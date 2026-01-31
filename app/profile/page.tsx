"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/types";
import Sidebar from "../components/Sidebar";
import ProfileEditModal from "../components/ProfileEditModal";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
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
} from "lucide-react";

type Tab = "posts" | "about";

// US States map for display
const US_STATES_MAP: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming"
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch user posts
  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(`
            *,
            likes (user_id)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching posts:", error);
          setUserPosts([]);
        } else {
          setUserPosts(data || []);
          setStats(prev => ({ ...prev, posts: data?.length || 0 }));
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
        setUserPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

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

  // Not logged in
  if (!user) {
    return null;
  }

  // Profile not loaded yet - show skeleton
  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
          <p className="mt-2 text-neutral-500">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* COVER & PROFILE */}
            <Card className="glass overflow-hidden mb-6">
              {/* Cover Image */}
              <div className="relative h-48 sm:h-64 bg-gradient-to-r from-red-500 via-red-600 to-orange-500">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Profile Info */}
              <div className="px-4 sm:px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 relative">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar
                      src={profile.avatar_url || undefined}
                      fallback={profile.full_name || profile.username || "U"}
                      size="xl"
                      className="ring-4 ring-white dark:ring-neutral-900 h-28 w-28 sm:h-32 sm:w-32 text-3xl"
                    />
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-white dark:bg-neutral-800 border-2 border-white dark:border-neutral-900 flex items-center justify-center hover:scale-110 transition-smooth shadow-lg"
                    >
                      <Camera size={16} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 mt-2 sm:mt-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h1 className="text-xl sm:text-2xl font-bold">
                            {profile.full_name || profile.username || "İsimsiz Kullanıcı"}
                          </h1>
                          
                          {/* Role Badge */}
                          {profile.role && profile.role !== 'user' && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[profile.role]}`}>
                              <Shield size={12} />
                              {ROLE_LABELS[profile.role]}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-neutral-500 dark:text-neutral-400 mb-2">
                          @{profile.username || "kullanici"}
                        </p>
                        
                        {profile.bio && (
                          <p className="text-neutral-700 dark:text-neutral-300 max-w-2xl text-sm sm:text-base">
                            {profile.bio}
                          </p>
                        )}
                      </div>

                      <Button 
                        variant="outline" 
                        className="gap-2 self-start"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <Edit size={18} />
                        <span className="hidden sm:inline">Profili Düzenle</span>
                        <span className="sm:hidden">Düzenle</span>
                      </Button>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {(profile.city || profile.state) && (
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>
                            {[profile.city, profile.state && US_STATES_MAP[profile.state]].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>Katıldı {formatJoinDate(profile.created_at)}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 sm:gap-6 mt-4">
                      <div>
                        <span className="font-bold text-lg">{stats.posts}</span>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">Gönderi</span>
                      </div>
                      <div>
                        <span className="font-bold text-lg">{stats.followers}</span>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">Takipçi</span>
                      </div>
                      <div>
                        <span className="font-bold text-lg">{stats.following}</span>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">Takip</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* TABS */}
            <div className="mb-6 glass rounded-xl p-1 inline-flex overflow-x-auto max-w-full">
              {(["posts", "about"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-smooth capitalize whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-white dark:bg-neutral-800 shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                  }`}
                >
                  {tab === "posts" && "Gönderiler"}
                  {tab === "about" && "Hakkında"}
                </button>
              ))}
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
                          <p className="text-neutral-500 text-sm">
                            Feed sayfasından ilk gönderinizi paylaşın!
                          </p>
                          <Button 
                            variant="primary" 
                            className="mt-4"
                            onClick={() => router.push("/feed")}
                          >
                            Gönderi Paylaş
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      userPosts.map((post) => (
                        <Card key={post.id} className="glass">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar 
                                  src={profile.avatar_url || undefined} 
                                  fallback={profile.full_name || profile.username || "U"} 
                                  size="md" 
                                />
                                <div>
                                  <p className="font-semibold">
                                    {profile.full_name || profile.username}
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

                            <p className="text-neutral-700 dark:text-neutral-300 mb-4 whitespace-pre-wrap">
                              {post.content}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                              <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
                                <Heart size={18} />
                                {post.likes?.length || 0}
                              </button>
                              <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                                <MessageCircle size={18} />
                                0
                              </button>
                              <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
                                <Share2 size={18} />
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
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
                          <p className="text-neutral-700 dark:text-neutral-300">{profile.bio}</p>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-neutral-500 mb-3">Henüz bio eklenmemiş</p>
                          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                            Bio Ekle
                          </Button>
                        </div>
                      )}

                      {(profile.city || profile.state) && (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm text-neutral-500 uppercase tracking-wide">Konum</h3>
                          <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-neutral-400" />
                            <span>
                              {[profile.city, profile.state && US_STATES_MAP[profile.state]].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="font-semibold mb-2 text-sm text-neutral-500 uppercase tracking-wide">Üyelik</h3>
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-neutral-400" />
                          <span>{formatJoinDate(profile.created_at)} tarihinden beri üye</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* SIDEBAR */}
              <div className="space-y-6">
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
                      onClick={() => router.push("/ayarlar")}
                    >
                      <Settings size={18} />
                      Ayarlar
                    </Button>
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
                            {fields.filter(f => !f.done).map((field, idx) => (
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
                              <div className="text-center py-2 text-green-600 dark:text-green-400 text-sm">
                                🎉 Profiliniz tamamlandı!
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Stats */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Award className="h-5 w-5 text-amber-500" />
                      İstatistikler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Toplam Gönderi</span>
                      <span className="font-bold">{stats.posts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Takipçi</span>
                      <span className="font-bold">{stats.followers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Takip</span>
                      <span className="font-bold">{stats.following}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Profile Modal - only render when profile exists */}
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
