import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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

  const comments = commentsRes.data ?? [];
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

  const profileMap = new Map((profilesRes.data ?? []).map((profile) => [profile.id as string, profile]));
  const imagesMap = new Map<string, typeof imagesRes.data>();
  const commentsMap = new Map<string, typeof comments>();
  const viewerReactionSet = new Set((reactionsRes.data ?? []).map((reaction) => reaction.comment_id as string));
  const subscribedSet = new Set((subscriptionsRes.data ?? []).map((row) => row.post_id as string));

  for (const image of imagesRes.data ?? []) {
    const arr = imagesMap.get(image.post_id as string) ?? [];
    arr.push(image);
    imagesMap.set(image.post_id as string, arr);
  }

  for (const comment of comments) {
    const arr = commentsMap.get(comment.post_id as string) ?? [];
    arr.push({
      ...comment,
      profile: profileMap.get(comment.user_id as string) ?? null,
      viewer_reacted: viewerReactionSet.has(comment.id as string),
    });
    commentsMap.set(comment.post_id as string, arr);
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
