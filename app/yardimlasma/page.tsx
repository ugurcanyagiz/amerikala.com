"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { uploadImageToStorage } from "@/lib/supabase/imageUpload";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Sheet } from "../components/ui/Sheet";
import { AlertCircle, CheckCircle2, Filter, ImagePlus, Loader2, MapPin, MessageSquare, Send, Siren, Trash2, X } from "lucide-react";

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

interface HelpComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  body: string;
  helpful_count: number;
  created_at: string;
  profile: ProfileMini | null;
  viewer_reacted?: boolean;
}

interface HelpPost {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  category: string;
  location_text: string | null;
  tags: string[];
  is_urgent: boolean;
  status: "open" | "solved";
  comment_count: number;
  created_at: string;
  profile: ProfileMini | null;
  images: HelpImage[];
  comments: HelpComment[];
  subscribed: boolean;
}

const CATEGORIES = ["Barınma", "İş", "Ulaşım", "Eğitim", "Sağlık", "Resmi İşlemler", "Diğer"];

const formatTimeAgo = (value: string) => {
  const date = new Date(value);
  const diffMin = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} sa önce`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} gün önce`;
  return date.toLocaleDateString("tr-TR");
};

const displayName = (profile?: ProfileMini | null) => {
  if (!profile) return "Kullanıcı";
  const complete = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return complete || profile.full_name || profile.username || "Kullanıcı";
};

function SkeletonCard() {
  return (
    <Card className="animate-pulse" padding="md">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="mt-4 h-4 w-full rounded bg-slate-200" />
      <div className="mt-2 h-4 w-11/12 rounded bg-slate-200" />
      <div className="mt-4 h-9 w-full rounded bg-slate-100" />
    </Card>
  );
}

export default function YardimlasmaPage() {
  const { user, profile, isAdmin } = useAuth();
  const [posts, setPosts] = useState<HelpPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "solved">("all");
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);

  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "",
    location: "",
    tags: "",
    isUrgent: false,
    status: "open" as "open" | "solved",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: postRows, error: postError } = await supabase
        .from("help_posts")
        .select("id,user_id,title,body,category,location_text,tags,is_urgent,status,comment_count,created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (postError) throw postError;
      const postList = postRows ?? [];
      if (postList.length === 0) {
        setPosts([]);
        return;
      }

      const postIds = postList.map((p) => p.id as string);
      const userIds = Array.from(new Set(postList.map((p) => p.user_id as string)));

      const [imagesRes, commentsRes, subscriptionsRes] = await Promise.all([
        supabase.from("help_post_images").select("id,post_id,image_url,position").in("post_id", postIds).order("position", { ascending: true }),
        supabase.from("help_comments").select("id,post_id,user_id,parent_comment_id,body,helpful_count,created_at").in("post_id", postIds).order("created_at", { ascending: true }),
        user ? supabase.from("help_post_subscriptions").select("post_id").eq("user_id", user.id).in("post_id", postIds) : Promise.resolve({ data: [], error: null }),
      ]);

      if (imagesRes.error) throw imagesRes.error;
      if (commentsRes.error) throw commentsRes.error;
      if (subscriptionsRes.error) throw subscriptionsRes.error;

      const comments = commentsRes.data ?? [];
      const commentUserIds = Array.from(new Set(comments.map((c) => c.user_id as string)));
      const profileIds = Array.from(new Set([...userIds, ...commentUserIds]));

      const [profilesRes, reactionsRes] = await Promise.all([
        supabase.from("profiles").select("id,full_name,first_name,last_name,username,avatar_url").in("id", profileIds),
        user && comments.length > 0
          ? supabase.from("help_comment_reactions").select("comment_id").eq("user_id", user.id).in("comment_id", comments.map((c) => c.id as string))
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (reactionsRes.error) throw reactionsRes.error;

      const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id as string, p as ProfileMini]));
      const imagesMap = new Map<string, HelpImage[]>();
      const commentsMap = new Map<string, HelpComment[]>();
      const viewerReactionSet = new Set((reactionsRes.data ?? []).map((r) => r.comment_id as string));
      const subscribedSet = new Set((subscriptionsRes.data ?? []).map((row) => row.post_id as string));

      for (const img of imagesRes.data ?? []) {
        const postId = img.post_id as string;
        const arr = imagesMap.get(postId) ?? [];
        arr.push(img as HelpImage);
        imagesMap.set(postId, arr);
      }

      for (const comment of comments) {
        const postId = comment.post_id as string;
        const arr = commentsMap.get(postId) ?? [];
        arr.push({
          ...(comment as Omit<HelpComment, "profile">),
          profile: profileMap.get(comment.user_id as string) ?? null,
          viewer_reacted: viewerReactionSet.has(comment.id as string),
        });
        commentsMap.set(postId, arr);
      }

      const enriched = postList.map((post) => ({
        ...(post as Omit<HelpPost, "profile" | "images" | "comments" | "subscribed">),
        profile: profileMap.get(post.user_id as string) ?? null,
        images: imagesMap.get(post.id as string) ?? [],
        comments: commentsMap.get(post.id as string) ?? [],
        subscribed: subscribedSet.has(post.id as string),
      }));

      setPosts(enriched as HelpPost[]);
    } catch (fetchError) {
      console.error(fetchError);
      setError("Yardımlaşma akışı yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const visiblePosts = useMemo(() => {
    return posts.filter((post) => {
      if (filterCategory !== "all" && post.category !== filterCategory) return false;
      if (filterStatus !== "all" && post.status !== filterStatus) return false;
      if (showUrgentOnly && !post.is_urgent) return false;
      return true;
    });
  }, [posts, filterCategory, filterStatus, showUrgentOnly]);

  const resetComposer = () => {
    setForm({ title: "", body: "", category: "", location: "", tags: "", isUrgent: false, status: "open" });
    setSelectedFiles([]);
    setValidationError(null);
    setComposerOpen(false);
  };

  const handleCreatePost = async () => {
    if (!user) {
      setValidationError("Paylaşım yapmak için giriş yapmalısın.");
      return;
    }

    if (form.body.trim().length < 3) {
      setValidationError("Paylaşım metni en az 3 karakter olmalı.");
      return;
    }

    if (!form.category.trim()) {
      setValidationError("Kategori seçmelisin.");
      return;
    }

    if (selectedFiles.length > 6) {
      setValidationError("En fazla 6 görsel ekleyebilirsin.");
      return;
    }

    setSubmitting(true);
    setValidationError(null);

    try {
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 5);

      const { data: postRow, error: postError } = await supabase
        .from("help_posts")
        .insert({
          user_id: user.id,
          title: form.title.trim() || null,
          body: form.body.trim(),
          category: form.category,
          location_text: form.location.trim() || null,
          tags,
          is_urgent: form.isUrgent,
          status: form.status,
        })
        .select("id")
        .single();

      if (postError) throw postError;

      if (selectedFiles.length > 0) {
        const uploaded = await Promise.all(
          selectedFiles.map((file, index) =>
            uploadImageToStorage({ file, folder: `help-posts/${user.id}/${postRow.id}`, bucket: "avatars" }).then((url) => ({
              post_id: postRow.id,
              image_url: url,
              position: index,
            }))
          )
        );

        const { error: imageError } = await supabase.from("help_post_images").insert(uploaded);
        if (imageError) throw imageError;
      }

      resetComposer();
      await fetchPosts();
    } catch (submitError) {
      console.error(submitError);
      setValidationError("Paylaşım gönderilemedi. Lütfen tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSubscribe = async (post: HelpPost) => {
    if (!user) return;

    const next = !post.subscribed;
    setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, subscribed: next } : item)));

    if (next) {
      const { error: insertError } = await supabase.from("help_post_subscriptions").insert({ post_id: post.id, user_id: user.id });
      if (insertError) {
        setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, subscribed: false } : item)));
      }
      return;
    }

    const { error: deleteError } = await supabase.from("help_post_subscriptions").delete().eq("post_id", post.id).eq("user_id", user.id);
    if (deleteError) {
      setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, subscribed: true } : item)));
    }
  };

  const markSolved = async (post: HelpPost) => {
    if (!user || post.user_id !== user.id) return;

    const nextStatus = post.status === "open" ? "solved" : "open";
    setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, status: nextStatus } : item)));

    const { error: updateError } = await supabase.from("help_posts").update({ status: nextStatus }).eq("id", post.id).eq("user_id", user.id);
    if (updateError) {
      setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, status: post.status } : item)));
    }
  };

  const deletePost = async (post: HelpPost) => {
    if (!user || (!isAdmin && user.id !== post.user_id)) return;
    const previous = posts;
    setPosts((prev) => prev.filter((item) => item.id !== post.id));

    let query = supabase.from("help_posts").delete().eq("id", post.id);
    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }
    const { error: deleteError } = await query;
    if (deleteError) {
      setPosts(previous);
    }
  };

  const addComment = async (post: HelpPost, body: string, parentCommentId: string | null = null) => {
    if (!user || !body.trim()) return;

    const optimisticId = `temp-${Date.now()}`;
    const optimisticComment: HelpComment = {
      id: optimisticId,
      post_id: post.id,
      user_id: user.id,
      parent_comment_id: parentCommentId,
      body: body.trim(),
      helpful_count: 0,
      created_at: new Date().toISOString(),
      profile: {
        id: user.id,
        full_name: profile?.full_name ?? null,
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        username: profile?.username ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
      viewer_reacted: false,
    };

    setPosts((prev) =>
      prev.map((item) =>
        item.id === post.id
          ? { ...item, comment_count: item.comment_count + 1, comments: [...item.comments, optimisticComment] }
          : item
      )
    );

    const { data: inserted, error: insertError } = await supabase
      .from("help_comments")
      .insert({ post_id: post.id, user_id: user.id, parent_comment_id: parentCommentId, body: body.trim() })
      .select("id,post_id,user_id,parent_comment_id,body,helpful_count,created_at")
      .single();

    if (insertError || !inserted) {
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? {
                ...item,
                comment_count: Math.max(0, item.comment_count - 1),
                comments: item.comments.filter((comment) => comment.id !== optimisticId),
              }
            : item
        )
      );
      return;
    }

    const finalized: HelpComment = {
      ...(inserted as Omit<HelpComment, "profile">),
      profile: optimisticComment.profile,
      viewer_reacted: false,
    };

    setPosts((prev) =>
      prev.map((item) =>
        item.id === post.id
          ? {
              ...item,
              comments: item.comments.map((comment) => (comment.id === optimisticId ? finalized : comment)),
            }
          : item
      )
    );

    const recipients = Array.from(new Set([post.user_id, ...post.comments.map((comment) => comment.user_id)])).filter((id) => id !== user.id);

    if (recipients.length > 0) {
      await fetch("/api/yardimlasma/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUserIds: recipients,
          postId: post.id,
          commentId: inserted.id,
          actorName: displayName(optimisticComment.profile),
        }),
      });
    }
  };

  const toggleHelpful = async (postId: string, comment: HelpComment) => {
    if (!user) return;

    const next = !comment.viewer_reacted;
    setPosts((prev) =>
      prev.map((post) =>
        post.id !== postId
          ? post
          : {
              ...post,
              comments: post.comments.map((row) =>
                row.id !== comment.id
                  ? row
                  : {
                      ...row,
                      viewer_reacted: next,
                      helpful_count: Math.max(0, row.helpful_count + (next ? 1 : -1)),
                    }
              ),
            }
      )
    );

    if (next) {
      const { error: insertError } = await supabase.from("help_comment_reactions").insert({ comment_id: comment.id, user_id: user.id });
      if (insertError) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id !== postId
              ? post
              : {
                  ...post,
                  comments: post.comments.map((row) =>
                    row.id !== comment.id
                      ? row
                      : {
                          ...row,
                          viewer_reacted: false,
                          helpful_count: Math.max(0, row.helpful_count - 1),
                        }
                  ),
                }
          )
        );
      }
      return;
    }

    const { error: deleteError } = await supabase.from("help_comment_reactions").delete().eq("comment_id", comment.id).eq("user_id", user.id);
    if (deleteError) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id !== postId
            ? post
            : {
                ...post,
                comments: post.comments.map((row) =>
                  row.id !== comment.id
                    ? row
                    : {
                        ...row,
                        viewer_reacted: true,
                        helpful_count: row.helpful_count + 1,
                      }
                ),
              }
        )
      );
    }
  };

  const renderFilterPanel = (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">Kategori</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterCategory("all")} className={`rounded-full px-3 py-1.5 text-sm ${filterCategory === "all" ? "bg-slate-900 text-white" : "bg-slate-100"}`}>Tümü</button>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)} className={`rounded-full px-3 py-1.5 text-sm ${filterCategory === cat ? "bg-slate-900 text-white" : "bg-slate-100"}`}>{cat}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">Durum</p>
        <div className="flex gap-2">
          {[
            { key: "all", label: "Tümü" },
            { key: "open", label: "Açık" },
            { key: "solved", label: "Çözüldü" },
          ].map((option) => (
            <button key={option.key} onClick={() => setFilterStatus(option.key as "all" | "open" | "solved")} className={`rounded-xl px-3 py-2 text-sm ${filterStatus === option.key ? "bg-slate-900 text-white" : "bg-slate-100"}`}>{option.label}</button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={showUrgentOnly} onChange={(e) => setShowUrgentOnly(e.target.checked)} />
        Sadece acil gönderiler
      </label>
    </div>
  );

  return (
    <AppShell mainClassName="app-page-container max-w-5xl pb-24 md:pb-10">
      <section className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Yardımlaşma</h1>
            <p className="mt-1 text-slate-600">Sor, paylaş, birlikte çözelim.</p>
          </div>
          <Button variant="secondary" size="sm" className="hidden md:inline-flex" onClick={() => setMobileFiltersOpen(true)}>
            <Filter className="h-4 w-4" /> Filtreler
          </Button>
          <Button variant="secondary" size="sm" className="md:hidden" onClick={() => setMobileFiltersOpen(true)}>
            <Filter className="h-4 w-4" />
          </Button>
        </header>

        <Card padding="md" className="overflow-hidden">
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar src={profile?.avatar_url ?? undefined} fallback={displayName(profile as unknown as ProfileMini)} size="md" />
              <div className="flex-1">
                <Textarea
                  value={form.body}
                  onFocus={() => setComposerOpen(true)}
                  onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                  placeholder="Ne konuda yardıma ihtiyacın var?"
                  className="min-h-[92px]"
                  aria-label="Yardım paylaşımı metni"
                />
              </div>
            </div>

            {composerOpen && (
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-2 animate-in fade-in duration-200">
                <Input
                  label="Başlık (opsiyonel)"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Kısa bir başlık"
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">Kategori *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm"
                    aria-label="Kategori seç"
                  >
                    <option value="">Kategori seç</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <Input label="Konum (opsiyonel)" value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Şehir / bölge" />
                <Input label="Etiketler (max 5)" value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} placeholder="ör. kiralık, vize, sağlık" hint="Virgül ile ayırabilirsin." />

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">Durum</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, status: "open" }))} className={`rounded-xl px-3 py-2 text-sm ${form.status === "open" ? "bg-slate-900 text-white" : "bg-white border border-slate-300"}`}>Açık</button>
                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, status: "solved" }))} className={`rounded-xl px-3 py-2 text-sm ${form.status === "solved" ? "bg-slate-900 text-white" : "bg-white border border-slate-300"}`}>Çözüldü</button>
                  </div>
                </div>

                <div className="flex items-end">
                  <label className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
                    <ImagePlus className="h-4 w-4" /> Görsel ekle
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []).slice(0, 6);
                        setSelectedFiles(files);
                      }}
                    />
                  </label>
                </div>

                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={form.isUrgent} onChange={(e) => setForm((prev) => ({ ...prev, isUrgent: e.target.checked }))} />
                  Acil olarak işaretle
                </label>

                {selectedFiles.length > 0 && (
                  <div className="sm:col-span-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file) => (
                      <Badge key={`${file.name}-${file.size}`} variant="outline">{file.name}</Badge>
                    ))}
                  </div>
                )}

                {validationError && (
                  <p className="sm:col-span-2 flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" /> {validationError}
                  </p>
                )}

                <div className="sm:col-span-2 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={resetComposer}>Vazgeç</Button>
                  <Button size="sm" onClick={handleCreatePost} loading={submitting}>
                    <Send className="h-4 w-4" /> Paylaş
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <Card padding="md">
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        ) : visiblePosts.length === 0 ? (
          <Card padding="md">
            <p className="text-sm text-slate-600">Henüz gönderi yok. İlk paylaşımı sen yap.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {visiblePosts.map((post) => (
              <Card key={post.id} padding="md" className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar src={post.profile?.avatar_url ?? undefined} fallback={displayName(post.profile)} size="md" />
                    <div>
                      <p className="font-semibold text-slate-900">{displayName(post.profile)}</p>
                      <p className="text-xs text-slate-500">{formatTimeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <Badge>{post.category}</Badge>
                    {post.location_text && <Badge variant="outline"><MapPin className="mr-1 h-3 w-3" />{post.location_text}</Badge>}
                    {post.is_urgent && <Badge variant="warning"><Siren className="mr-1 h-3 w-3" />Acil</Badge>}
                    {post.status === "solved" && <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" />Çözüldü</Badge>}
                  </div>
                </div>

                {post.title && <h2 className="text-lg font-semibold text-slate-900">{post.title}</h2>}
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.body}</p>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={`${post.id}-${tag}`} variant="outline">#{tag}</Badge>
                    ))}
                  </div>
                )}

                {post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {post.images.map((img) => (
                      <a key={img.id} href={img.image_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200">
                        <img src={img.image_url} alt="Yardım paylaşımı görseli" className="h-36 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                  <Badge variant="outline"><MessageSquare className="mr-1 h-3 w-3" />{post.comment_count} yorum</Badge>
                  <Button variant="ghost" size="sm" onClick={() => void toggleSubscribe(post)}>{post.subscribed ? "Takip ediliyor" : "Takip et"}</Button>
                  {user?.id === post.user_id && <Button variant="ghost" size="sm" onClick={() => void markSolved(post)}>{post.status === "open" ? "Çözüldü işaretle" : "Açık yap"}</Button>}
                  {(isAdmin || user?.id === post.user_id) && <Button variant="ghost" size="sm" onClick={() => void deletePost(post)}><Trash2 className="h-4 w-4" /> Sil</Button>}
                </div>

                <CommentsSection
                  post={post}
                  onAddComment={addComment}
                  onToggleHelpful={toggleHelpful}
                />
              </Card>
            ))}
          </div>
        )}
      </section>

      <Sheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filtreler"
      >
        {renderFilterPanel}
      </Sheet>
    </AppShell>
  );
}

function CommentsSection({
  post,
  onAddComment,
  onToggleHelpful,
}: {
  post: HelpPost;
  onAddComment: (post: HelpPost, body: string, parentCommentId?: string | null) => Promise<void>;
  onToggleHelpful: (postId: string, comment: HelpComment) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState<HelpComment | null>(null);

  const topLevelComments = post.comments.filter((comment) => !comment.parent_comment_id);

  const submit = async () => {
    if (!value.trim()) return;
    setSubmitting(true);
    await onAddComment(post, value, replyTarget?.id ?? null);
    setValue("");
    setReplyTarget(null);
    setSubmitting(false);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="space-y-2">
        {topLevelComments.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz yorum yok. İlk yorumu sen yaz.</p>
        ) : (
          topLevelComments.map((comment) => {
            const replies = post.comments.filter((item) => item.parent_comment_id === comment.id);
            return (
              <div key={comment.id} className="rounded-xl bg-white p-3" id={`comment-${comment.id}`}>
                <p className="text-sm font-semibold text-slate-900">{displayName(comment.profile)}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{comment.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button className="text-xs font-medium text-slate-500 hover:text-slate-800" onClick={() => setReplyTarget(comment)}>Yanıtla</button>
                  <button className={`text-xs font-medium ${comment.viewer_reacted ? "text-blue-600" : "text-slate-500"}`} onClick={() => void onToggleHelpful(post.id, comment)}>
                    Faydalı ({comment.helpful_count})
                  </button>
                </div>

                {replies.length > 0 && (
                  <div className="mt-3 space-y-2 border-l border-slate-200 pl-3">
                    {replies.map((reply) => (
                      <div key={reply.id} className="rounded-lg bg-slate-50 p-2">
                        <p className="text-xs font-semibold text-slate-900">{displayName(reply.profile)}</p>
                        <p className="text-sm text-slate-700">{reply.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {replyTarget && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <p>{displayName(replyTarget.profile)} yorumuna yanıt yazıyorsun.</p>
          <button onClick={() => setReplyTarget(null)} aria-label="Yanıtı iptal et">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Yorumunu yaz..." className="h-11" />
        <Button size="sm" onClick={() => void submit()} disabled={!value.trim()} loading={submitting}>
          {submitting ? <Loader2 className="h-4 w-4" /> : "Gönder"}
        </Button>
      </div>
    </div>
  );
}
