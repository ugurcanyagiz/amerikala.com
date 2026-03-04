import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface ProfileMini {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface HelpImage {
  id: string;
  post_id: string;
  image_url: string;
  position: number;
}

interface HelpCommentRow {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  body: string;
  helpful_count: number;
  created_at: string;
}

interface HelpComment extends HelpCommentRow {
  profile: ProfileMini | null;
  viewer_reacted: boolean;
}

interface HelpPostRow {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  category: string;
  location_text: string | null;
  tags: string[] | null;
  is_urgent: boolean;
  status: "open" | "solved";
  comment_count: number;
  created_at: string;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = getSupabaseAdminClient();

  const { data: postRows, error: postError } = await admin
    .from("help_posts")
    .select("id,user_id,title,body,category,location_text,tags,is_urgent,status,comment_count,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (postError) {
    return NextResponse.json({ error: postError.message }, { status: 500 });
  }

  const postList = (postRows ?? []) as HelpPostRow[];

  if (postList.length === 0) {
    return NextResponse.json({ posts: [] });
  }

  const postIds = postList.map((post) => post.id);
  const userIds = Array.from(new Set(postList.map((post) => post.user_id)));

  const [imagesRes, commentsRes, subscriptionsRes] = await Promise.all([
    admin.from("help_post_images").select("id,post_id,image_url,position").in("post_id", postIds).order("position", { ascending: true }),
    admin
      .from("help_comments")
      .select("id,post_id,user_id,parent_comment_id,body,helpful_count,created_at")
      .in("post_id", postIds)
      .order("created_at", { ascending: true }),
    user
      ? admin.from("help_post_subscriptions").select("post_id").eq("user_id", user.id).in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (imagesRes.error) return NextResponse.json({ error: imagesRes.error.message }, { status: 500 });
  if (commentsRes.error) return NextResponse.json({ error: commentsRes.error.message }, { status: 500 });
  if (subscriptionsRes.error) return NextResponse.json({ error: subscriptionsRes.error.message }, { status: 500 });

  const comments = (commentsRes.data ?? []) as HelpCommentRow[];
  const commentUserIds = Array.from(new Set(comments.map((comment) => comment.user_id as string)));
  const profileIds = Array.from(new Set([...userIds, ...commentUserIds]));

  const [profilesRes, reactionsRes] = await Promise.all([
    admin.from("profiles").select("id,full_name,first_name,last_name,username,avatar_url").in("id", profileIds),
    user && comments.length > 0
      ? admin.from("help_comment_reactions").select("comment_id").eq("user_id", user.id).in("comment_id", comments.map((comment) => comment.id as string))
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesRes.error) return NextResponse.json({ error: profilesRes.error.message }, { status: 500 });
  if (reactionsRes.error) return NextResponse.json({ error: reactionsRes.error.message }, { status: 500 });

  const profileMap = new Map<string, ProfileMini>((profilesRes.data ?? []).map((profile) => [profile.id as string, profile as ProfileMini]));
  const imagesMap = new Map<string, HelpImage[]>();
  const commentsMap = new Map<string, HelpComment[]>();
  const viewerReactionSet = new Set((reactionsRes.data ?? []).map((reaction) => reaction.comment_id as string));
  const subscribedSet = new Set((subscriptionsRes.data ?? []).map((row) => row.post_id as string));

  for (const image of imagesRes.data ?? []) {
    const arr = imagesMap.get(image.post_id as string) ?? [];
    arr.push(image as HelpImage);
    imagesMap.set(image.post_id as string, arr);
  }

  for (const comment of comments) {
    const arr = commentsMap.get(comment.post_id) ?? [];
    arr.push({
      ...comment,
      profile: profileMap.get(comment.user_id) ?? null,
      viewer_reacted: viewerReactionSet.has(comment.id),
    });
    commentsMap.set(comment.post_id, arr);
  }

  const enrichedPosts = postList.map((post) => ({
    ...post,
    tags: post.tags ?? [],
    profile: profileMap.get(post.user_id) ?? null,
    images: imagesMap.get(post.id) ?? [],
    comments: commentsMap.get(post.id) ?? [],
    subscribed: subscribedSet.has(post.id),
  }));

  return NextResponse.json({ posts: enrichedPosts });
}
