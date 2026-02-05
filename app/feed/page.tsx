"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { Post, Profile } from "@/lib/types";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  Image as ImageIcon,
  Smile,
  MapPin,
  Loader2,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";

interface PostWithAuthor extends Omit<Post, 'likes' | 'profiles'> {
  profiles: Profile;
  likes: { user_id: string }[];
  comments: CommentWithAuthor[];
  _count?: { comments: number };
}

interface CommentWithAuthor {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: Profile;
}

export default function FeedPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      console.log("Fetching posts...");
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (*),
          likes (user_id),
          comments (
            id,
            post_id,
            user_id,
            content,
            created_at,
            profiles (*)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching posts:", error);
        return;
      }

      console.log("Posts fetched:", data?.length || 0);
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Create new post
  const handleCreatePost = async () => {
    // Debug logging
    console.log("=== CREATE POST DEBUG ===");
    console.log("User:", user?.id);
    console.log("Content:", newPostContent.trim());
    console.log("Auth loading:", authLoading);

    if (!user) {
      setError("Gönderi oluşturmak için giriş yapmalısınız.");
      router.push("/login");
      return;
    }

    if (!newPostContent.trim()) {
      setError("Gönderi içeriği boş olamaz.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log("Inserting post with user_id:", user.id);
      
      const { data, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: newPostContent.trim(),
        })
        .select(`
          *,
          profiles (*),
          likes (user_id),
          comments (
            id,
            post_id,
            user_id,
            content,
            created_at,
            profiles (*)
          )
        `)
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      console.log("Post created successfully:", data?.id);
      
      // Ensure data has the required structure
      const newPost = {
        ...data,
        likes: data.likes || [],
        comments: data.comments || [],
        profiles: data.profiles || profile,
      };

      setPosts([newPost, ...posts]);
      setNewPostContent("");
    } catch (err: any) {
      console.error("Error creating post:", err);
      setError(err.message || "Gönderi oluşturulurken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle like
  const handleToggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: user.id });
        
        if (error) throw error;
      }

      // Update local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: isLiked
              ? post.likes.filter(l => l.user_id !== user.id)
              : [...post.likes, { user_id: user.id }]
          };
        }
        return post;
      }));
    } catch (error: any) {
      console.error("Error toggling like:", error);
    }
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
    } catch (error: any) {
      console.error("Error deleting post:", error);
      alert("Gönderi silinirken bir hata oluştu: " + error.message);
    }
  };

  // Add comment
  const handleAddComment = async (postId: string, content: string) => {
    if (!user) {
      router.push("/login");
      return false;
    }
    
    if (!content.trim()) return false;

    try {
      console.log("Adding comment to post:", postId);
      
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
        })
        .select(`*, profiles (*)`)
        .single();

      if (error) {
        console.error("Comment insert error:", error);
        throw error;
      }

      console.log("Comment added:", data?.id);

      // Update local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), data]
          };
        }
        return post;
      }));

      return true;
    } catch (error: any) {
      console.error("Error adding comment:", error);
      return false;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Az önce";
    if (diffMins < 60) return `${diffMins}dk`;
    if (diffHours < 24) return `${diffHours}sa`;
    if (diffDays < 7) return `${diffDays}g`;

    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)]">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[var(--color-ink)]">Feed</h1>
              <p className="text-[var(--color-ink-secondary)]">Topluluktaki son paylaşımlar</p>
            </div>

            {/* Create Post */}
            {authLoading ? (
              <Card className="mb-6">
                <CardContent className="p-6 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)] mx-auto" />
                </CardContent>
              </Card>
            ) : user ? (
              <Card className="mb-6">
                <CardContent className="p-4">
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      {error}
                      <button onClick={() => setError(null)} className="ml-auto">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Avatar
                      src={profile?.avatar_url || undefined}
                      fallback={profile?.username || profile?.full_name || "U"}
                      size="md"
                    />
                    <div className="flex-1">
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Aklından ne geçiyor?"
                        className="w-full min-h-[100px] p-3 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border-light)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                        maxLength={1000}
                      />
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button className="p-2 rounded-lg hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]">
                            <ImageIcon size={20} />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]">
                            <Smile size={20} />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]">
                            <MapPin size={20} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[var(--color-ink-tertiary)]">
                            {newPostContent.length}/1000
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleCreatePost}
                            disabled={!newPostContent.trim() || submitting}
                            className="gap-2"
                          >
                            {submitting ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Send size={16} />
                            )}
                            Paylaş
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6">
                <CardContent className="p-6 text-center">
                  <p className="text-[var(--color-ink-secondary)] mb-4">
                    Paylaşım yapmak için giriş yapın
                  </p>
                  <Button variant="primary" onClick={() => router.push("/login")}>
                    Giriş Yap
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Posts */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
              </div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageCircle className="w-12 h-12 text-[var(--color-ink-faint)] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[var(--color-ink)] mb-2">
                    Henüz gönderi yok
                  </h3>
                  <p className="text-[var(--color-ink-secondary)]">
                    İlk gönderiyi sen paylaş!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    currentUserProfile={profile}
                    onLike={() => handleToggleLike(post.id, post.likes?.some(l => l.user_id === user?.id) || false)}
                    onDelete={() => handleDeletePost(post.id)}
                    onAddComment={(content) => handleAddComment(post.id, content)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function PostCard({
  post,
  currentUserId,
  currentUserProfile,
  onLike,
  onDelete,
  onAddComment,
  formatDate,
}: {
  post: PostWithAuthor;
  currentUserId?: string;
  currentUserProfile?: Profile | null;
  onLike: () => void;
  onDelete: () => void;
  onAddComment: (content: string) => Promise<boolean | undefined>;
  formatDate: (date: string) => string;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isLiked = post.likes?.some(l => l.user_id === currentUserId) || false;
  const isOwner = post.user_id === currentUserId;
  const authorName = post.profiles?.full_name || post.profiles?.username || "Kullanıcı";

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    const success = await onAddComment(commentText);
    if (success) {
      setCommentText("");
    }
    setSubmittingComment(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-0">
          <div className="flex items-center gap-3">
            <Avatar
              src={post.profiles?.avatar_url || undefined}
              fallback={authorName}
              size="md"
            />
            <div>
              <p className="font-semibold text-[var(--color-ink)]">{authorName}</p>
              <p className="text-xs text-[var(--color-ink-tertiary)]">
                @{post.profiles?.username || "user"} · {formatDate(post.created_at)}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]"
              >
                <MoreHorizontal size={18} />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-xl shadow-lg py-1 z-10">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                    Sil
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 px-4 py-2 border-t border-[var(--color-border-light)]">
          <button
            onClick={onLike}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isLiked
                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)]"
            }`}
          >
            <Heart size={18} className={isLiked ? "fill-current" : ""} />
            <span className="text-sm">{post.likes?.length || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)] transition-colors"
          >
            <MessageCircle size={18} />
            <span className="text-sm">{post.comments?.length || 0}</span>
            {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)] transition-colors">
            <Share2 size={18} />
          </button>

          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)] transition-colors ml-auto">
            <Bookmark size={18} />
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="border-t border-[var(--color-border-light)] bg-[var(--color-surface-sunken)]">
            {/* Comment List */}
            {post.comments && post.comments.length > 0 && (
              <div className="p-4 space-y-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar
                      src={comment.profiles?.avatar_url || undefined}
                      fallback={comment.profiles?.username || "U"}
                      size="sm"
                    />
                    <div className="flex-1 bg-[var(--color-surface)] rounded-xl px-3 py-2">
                      <p className="text-sm font-medium text-[var(--color-ink)]">
                        {comment.profiles?.full_name || comment.profiles?.username || "Kullanıcı"}
                      </p>
                      <p className="text-sm text-[var(--color-ink-secondary)]">
                        {comment.content}
                      </p>
                      <p className="text-xs text-[var(--color-ink-tertiary)] mt-1">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment */}
            {currentUserId && (
              <div className="p-4 pt-0 flex gap-3">
                <Avatar
                  src={currentUserProfile?.avatar_url || undefined}
                  fallback={currentUserProfile?.username || "U"}
                  size="sm"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Yorum yaz..."
                    className="flex-1 px-4 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-light)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-primary)]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="rounded-full px-4"
                  >
                    {submittingComment ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
