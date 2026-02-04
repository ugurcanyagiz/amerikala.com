"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { ROLE_LABELS, ROLE_COLORS, US_STATES_MAP } from "@/lib/types";
import Sidebar from "../components/Sidebar";
import ProfileEditModal from "../components/ProfileEditModal";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { 
  Settings,
  MapPin,
  Calendar,
  Edit,
  Camera,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Award,
  TrendingUp,
  Loader2,
  Shield,
  Globe,
  Users,
  Link as LinkIcon,
  Mail,
  CheckCircle,
  Eye,
  EyeOff,
  Bookmark,
  Grid3X3,
  List,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

type Tab = "posts" | "about" | "activity";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [pageError, setPageError] = useState<string | null>(null);
  const [stats, setStats] = useState({ 
    posts: 0, 
    followers: 0, 
    following: 0,
    groups: 0,
    events: 0 
  });

  // Debug log
  useEffect(() => {
    console.log("ProfilePage - authLoading:", authLoading, "user:", !!user, "profile:", !!profile);
  }, [authLoading, user, profile]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("ProfilePage - No user, redirecting to login");
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch user posts
  const fetchPosts = useCallback(async () => {
    if (!user) return;

    setPostsLoading(true);
    try {
      const { data, error, count } = await supabase
        .from("posts")
        .select(`
          *,
          likes (user_id)
        `, { count: 'exact' })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching posts:", error);
        setUserPosts([]);
      } else {
        setUserPosts(data || []);
        setStats(prev => ({ ...prev, posts: count || 0 }));
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setUserPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && profile) {
      fetchPosts();
    }
  }, [user, profile, fetchPosts]);

  // Fetch stats
  useEffect(() => {
    if (!user || !profile) return;

    const fetchStats = async () => {
      try {
        setStats(prev => ({
          ...prev,
          followers: profile.follower_count ?? 0,
          following: profile.following_count ?? 0,
        }));

        // Fetch group memberships count - with error handling
        try {
          const { count: groupCount } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "approved");
          
          setStats(prev => ({ ...prev, groups: groupCount || 0 }));
        } catch {
          // Table might not exist
        }
        
        // Fetch event attendances count - with error handling
        try {
          const { count: eventCount } = await supabase
            .from("event_attendees")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          setStats(prev => ({ ...prev, events: eventCount || 0 }));
        } catch {
          // Table might not exist
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [user, profile]);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Az önce";
      if (diffMins < 60) return `${diffMins} dakika önce`;
      if (diffHours < 24) return `${diffHours} saat önce`;
      if (diffDays < 7) return `${diffDays} gün önce`;
      
      return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return "—";
    }
  };

  // Format join date
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
    } catch {
      return "—";
    }
  };

  // Get display name based on privacy setting - with safe access
  const getDisplayName = () => {
    if (!profile) return user?.email?.split('@')[0] || "Kullanıcı";
    const showFullName = profile.show_full_name ?? true;
    if (showFullName && profile.full_name) {
      return profile.full_name;
    }
    return profile.username || user?.email?.split('@')[0] || "Kullanıcı";
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
          <p className="mt-2 text-neutral-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Not logged in - will redirect
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
          <p className="mt-2 text-neutral-500">Yönlendiriliyor...</p>
        </div>
      </div>
    );
  }

  // Profile not loaded yet - show with retry button
  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
          <p className="mt-2 text-neutral-500">Profil yükleniyor...</p>
          <div className="flex gap-2 justify-center mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refreshProfile()}
              className="gap-2"
            >
              <RefreshCw size={16} />
              Yeniden Dene
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Sayfayı Yenile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Safe access to profile fields
  const showFullName = profile.show_full_name ?? true;
  const isVerified = profile.is_verified ?? false;
  const website = profile.website || null;

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* COVER & PROFILE */}
            <Card className="glass overflow-hidden mb-6">
              {/* Cover Image */}
              <div className="relative h-40 sm:h-56 bg-gradient-to-r from-red-500 via-red-600 to-orange-500">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Cover edit button */}
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-colors"
                >
                  <Camera size={18} />
                </button>
              </div>

              {/* Profile Info */}
              <div className="px-4 sm:px-6 pb-6">
                <div className="flex flex-col sm:flex-row gap-4 -mt-16 relative">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={profile.avatar_url || undefined}
                      fallback={getDisplayName()}
                      size="xl"
                      className="ring-4 ring-white dark:ring-neutral-900 h-28 w-28 sm:h-32 sm:w-32 text-3xl shadow-xl"
                    />
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-white dark:bg-neutral-800 border-2 border-white dark:border-neutral-900 flex items-center justify-center hover:scale-110 transition-smooth shadow-lg"
                    >
                      <Camera size={16} className="text-neutral-600 dark:text-neutral-300" />
                    </button>
                    
                    {/* Verified badge */}
                    {isVerified && (
                      <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white dark:ring-neutral-900">
                        <CheckCircle size={14} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 pt-2 sm:pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            {getDisplayName()}
                          </h1>
                          
                          {/* Role Badge */}
                          {profile.role && profile.role !== 'user' && (
                            <Badge variant="primary" size="sm" className={ROLE_COLORS[profile.role]}>
                              <Shield size={12} className="mr-1" />
                              {ROLE_LABELS[profile.role]}
                            </Badge>
                          )}
                          
                          {/* Privacy indicator */}
                          {!showFullName && (
                            <span className="text-neutral-400" title="İsim gizli">
                              <EyeOff size={14} />
                            </span>
                          )}
                        </div>
                        
                        <p className="text-neutral-500 dark:text-neutral-400 mb-2">
                          @{profile.username || user?.email?.split('@')[0] || "kullanici"}
                        </p>
                        
                        {profile.bio && (
                          <p className="text-neutral-700 dark:text-neutral-300 max-w-xl text-sm sm:text-base leading-relaxed">
                            {profile.bio}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-2"
                          onClick={() => setIsEditModalOpen(true)}
                        >
                          <Edit size={16} />
                          <span className="hidden sm:inline">Düzenle</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push("/ayarlar")}
                        >
                          <Settings size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {(profile.city || profile.state) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={15} className="text-neutral-400" />
                          <span>
                            {[profile.city, profile.state && US_STATES_MAP[profile.state]].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                      
                      {website && (
                        <a 
                          href={website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-red-600 hover:underline"
                        >
                          <LinkIcon size={15} />
                          <span className="truncate max-w-[150px]">
                            {website.replace(/^https?:\/\//, '')}
                          </span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                      
                      <div className="flex items-center gap-1.5">
                        <Calendar size={15} className="text-neutral-400" />
                        <span>Katıldı {formatJoinDate(profile.created_at)}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                      <div className="text-center">
                        <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">{stats.posts}</span>
                        <span className="text-sm text-neutral-500 ml-1">Gönderi</span>
                      </div>
                      <div className="text-center cursor-pointer hover:text-red-500 transition-colors">
                        <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">{stats.followers}</span>
                        <span className="text-sm text-neutral-500 ml-1">Takipçi</span>
                      </div>
                      <div className="text-center cursor-pointer hover:text-red-500 transition-colors">
                        <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">{stats.following}</span>
                        <span className="text-sm text-neutral-500 ml-1">Takip</span>
                      </div>
                      <div className="text-center">
                        <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">{stats.groups}</span>
                        <span className="text-sm text-neutral-500 ml-1">Grup</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* TABS */}
            <div className="flex items-center justify-between mb-6">
              <div className="glass rounded-xl p-1 inline-flex overflow-x-auto">
                {(["posts", "about", "activity"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-smooth capitalize whitespace-nowrap text-sm ${
                      activeTab === tab
                        ? "bg-white dark:bg-neutral-800 shadow-sm text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                    }`}
                  >
                    {tab === "posts" && "Gönderiler"}
                    {tab === "about" && "Hakkında"}
                    {tab === "activity" && "Aktivite"}
                  </button>
                ))}
              </div>

              {activeTab === "posts" && (
                <div className="hidden sm:flex items-center gap-1 glass rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded ${viewMode === "list" ? "bg-white dark:bg-neutral-800 shadow-sm" : ""}`}
                  >
                    <List size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-white dark:bg-neutral-800 shadow-sm" : ""}`}
                  >
                    <Grid3X3 size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* MAIN CONTENT */}
              <div className="lg:col-span-2 space-y-6">
                {activeTab === "posts" && (
                  <>
                    {postsLoading ? (
                      <Card className="glass">
                        <CardContent className="p-8 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
                          <p className="mt-2 text-neutral-500">Gönderiler yükleniyor...</p>
                        </CardContent>
                      </Card>
                    ) : userPosts.length === 0 ? (
                      <Card className="glass">
                        <CardContent className="p-8 text-center">
                          <MessageCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                          <h3 className="font-semibold text-lg mb-1">Henüz gönderi yok</h3>
                          <p className="text-neutral-500 text-sm mb-4">
                            Feed sayfasından ilk gönderinizi paylaşın!
                          </p>
                          <Button 
                            variant="primary" 
                            onClick={() => router.push("/feed")}
                          >
                            Gönderi Paylaş
                          </Button>
                        </CardContent>
                      </Card>
                    ) : viewMode === "list" ? (
                      userPosts.map((post) => (
                        <Card key={post.id} className="glass hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar 
                                  src={profile.avatar_url || undefined} 
                                  fallback={getDisplayName()} 
                                  size="md" 
                                />
                                <div>
                                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                    {getDisplayName()}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {formatDate(post.created_at)}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal size={18} />
                              </Button>
                            </div>

                            <p className="text-neutral-700 dark:text-neutral-300 mb-4 whitespace-pre-wrap leading-relaxed">
                              {post.content}
                            </p>

                            <div className="flex items-center gap-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                              <button className="flex items-center gap-2 text-neutral-500 hover:text-red-500 transition-colors">
                                <Heart size={18} />
                                <span className="text-sm">{post.likes?.length || 0}</span>
                              </button>
                              <button className="flex items-center gap-2 text-neutral-500 hover:text-blue-500 transition-colors">
                                <MessageCircle size={18} />
                                <span className="text-sm">0</span>
                              </button>
                              <button className="flex items-center gap-2 text-neutral-500 hover:text-green-500 transition-colors">
                                <Share2 size={18} />
                              </button>
                              <button className="flex items-center gap-2 text-neutral-500 hover:text-yellow-500 transition-colors ml-auto">
                                <Bookmark size={18} />
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {userPosts.map((post) => (
                          <Card key={post.id} className="glass aspect-square cursor-pointer hover:shadow-md transition-shadow overflow-hidden">
                            <CardContent className="p-3 h-full flex flex-col">
                              <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-4 flex-1">
                                {post.content}
                              </p>
                              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
                                <span className="flex items-center gap-1">
                                  <Heart size={12} /> {post.likes?.length || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle size={12} /> 0
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === "about" && (
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle>Hakkında</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-6">
                      {profile.bio ? (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm text-neutral-500 uppercase tracking-wide">Bio</h3>
                          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{profile.bio}</p>
                        </div>
                      ) : (
                        <div className="text-center py-4 px-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                          <p className="text-neutral-500 mb-3">Henüz bio eklenmemiş</p>
                          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                            Bio Ekle
                          </Button>
                        </div>
                      )}

                      {(profile.city || profile.state) && (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm text-neutral-500 uppercase tracking-wide">Konum</h3>
                          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                            <MapPin size={18} className="text-neutral-400" />
                            <span>
                              {[profile.city, profile.state && US_STATES_MAP[profile.state]].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        </div>
                      )}

                      {website && (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm text-neutral-500 uppercase tracking-wide">Web Sitesi</h3>
                          <a 
                            href={website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-red-600 hover:underline"
                          >
                            <Globe size={18} />
                            <span>{website}</span>
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      )}

                      <div>
                        <h3 className="font-semibold mb-2 text-sm text-neutral-500 uppercase tracking-wide">Üyelik Bilgileri</h3>
                        <div className="space-y-2 text-neutral-700 dark:text-neutral-300">
                          <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-neutral-400" />
                            <span>{formatJoinDate(profile.created_at)} tarihinden beri üye</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail size={18} className="text-neutral-400" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2 text-sm text-neutral-500 uppercase tracking-wide">Gizlilik</h3>
                        <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                          {showFullName ? (
                            <>
                              <Eye size={18} className="text-green-500" />
                              <span>İsim herkese açık</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={18} className="text-neutral-400" />
                              <span>İsim gizli (sadece kullanıcı adı görünür)</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === "activity" && (
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle>Son Aktiviteler</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="text-center py-8">
                        <TrendingUp className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                        <h3 className="font-semibold text-lg mb-1">Aktivite geçmişi</h3>
                        <p className="text-neutral-500 text-sm">
                          Katıldığınız etkinlikler, gruplar ve etkileşimleriniz burada görünecek.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* SIDEBAR */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Award className="h-5 w-5 text-amber-500" />
                      İstatistikler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                        <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats.posts}</span>
                        <p className="text-xs text-neutral-500 mt-1">Gönderi</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                        <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats.followers}</span>
                        <p className="text-xs text-neutral-500 mt-1">Takipçi</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                        <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats.groups}</span>
                        <p className="text-xs text-neutral-500 mt-1">Grup</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                        <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats.events}</span>
                        <p className="text-xs text-neutral-500 mt-1">Etkinlik</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Completion */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Profil Tamamlama
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {(() => {
                      const fields = [
                        { name: "Kullanıcı Adı", done: !!profile.username },
                        { name: "İsim", done: !!profile.full_name },
                        { name: "Bio", done: !!profile.bio },
                        { name: "Şehir", done: !!profile.city },
                        { name: "Profil Fotoğrafı", done: !!profile.avatar_url },
                      ];
                      const completed = fields.filter(f => f.done).length;
                      const percentage = Math.round((completed / fields.length) * 100);

                      return (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">%{percentage} Tamamlandı</span>
                            <span className="text-xs text-neutral-500">{completed}/{fields.length}</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-4">
                            <div 
                              className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="space-y-2">
                            {fields.filter(f => !f.done).slice(0, 3).map((field, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center justify-between text-sm p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
                              >
                                <span className="text-neutral-600 dark:text-neutral-400">{field.name}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setIsEditModalOpen(true)}
                                >
                                  Ekle
                                </Button>
                              </div>
                            ))}
                            {fields.every(f => f.done) && (
                              <div className="text-center py-2 text-green-600 dark:text-green-400 text-sm font-medium">
                                🎉 Profiliniz tamamlandı!
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-base">Hızlı İşlemler</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Edit size={18} />
                      Profili Düzenle
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      onClick={() => router.push("/groups")}
                    >
                      <Users size={18} />
                      Gruplara Göz At
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      onClick={() => router.push("/meetups")}
                    >
                      <Calendar size={18} />
                      Etkinliklere Göz At
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      onClick={() => router.push("/ayarlar")}
                    >
                      <Settings size={18} />
                      Hesap Ayarları
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Profile Modal */}
      {profile && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onSave={refreshProfile}
        />
      )}
    </div>
  );
}
