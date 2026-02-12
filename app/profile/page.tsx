"use client";

import { useEffect, useState } from "react";
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
  Loader2,
  Shield,
  CheckCircle,
  Briefcase,
  Activity,
  History,
  RefreshCw,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [stats, setStats] = useState({ 
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

  // Get display name
  const getDisplayName = () => {
    if (!profile) return user?.email?.split('@')[0] || "Kullanıcı";
    if (profile.full_name) {
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
  const isVerified = profile.is_verified ?? false;
  const profession = profile.profession || null;
  const avatarSrc = profile.avatar_url || "/logo.png";

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* PROFILE */}
            <Card className="glass mb-6">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={avatarSrc}
                      fallback={getDisplayName()}
                      size="xl"
                      className="ring-4 ring-white dark:ring-neutral-900 shadow-xl"
                    />
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:scale-110 transition-smooth shadow-lg"
                    >
                      <Camera size={16} className="text-neutral-600 dark:text-neutral-300" />
                    </button>
                    
                    {isVerified && (
                      <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white dark:ring-neutral-900">
                        <CheckCircle size={14} className="text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                            {getDisplayName()}
                          </h1>
                          
                          {profile.role && profile.role !== "user" && (
                            <Badge variant="primary" size="sm" className={ROLE_COLORS[profile.role]}>
                              <Shield size={12} className="mr-1" />
                              {ROLE_LABELS[profile.role]}
                            </Badge>
                          )}
                          
                        </div>
                        
                        <p className="text-neutral-500 dark:text-neutral-400 mb-2">
                          @{profile.username || user?.email?.split("@")[0] || "kullanici"}
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

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                      {profession && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase size={15} className="text-neutral-400" />
                          <span>{profession}</span>
                        </div>
                      )}

                      {(profile.city || profile.state) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={15} className="text-neutral-400" />
                          <span>
                            {[profile.city, profile.state && US_STATES_MAP[profile.state]].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5">
                        <Calendar size={15} className="text-neutral-400" />
                        <span>Katıldı {formatJoinDate(profile.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-4 border-t border-neutral-200/70 dark:border-neutral-800">
                      <div className="text-center">
                        <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{stats.followers}</span>
                        <span className="text-sm text-neutral-500 ml-1">Takipçi</span>
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{stats.following}</span>
                        <span className="text-sm text-neutral-500 ml-1">Takip</span>
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{stats.groups}</span>
                        <span className="text-sm text-neutral-500 ml-1">Grup</span>
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{stats.events}</span>
                        <span className="text-sm text-neutral-500 ml-1">Etkinlik</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity size={18} className="text-red-500" />
                      Aktiviteler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-4 bg-white/60 dark:bg-neutral-900/40">
                        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Beğeniler</p>
                        <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">—</p>
                        <p className="text-sm text-neutral-500">Gönderi ve etkinlik etkileşimleri</p>
                      </div>
                      <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-4 bg-white/60 dark:bg-neutral-900/40">
                        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Bağlantılar</p>
                        <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">—</p>
                        <p className="text-sm text-neutral-500">Yeni arkadaşlıklar ve takipler</p>
                      </div>
                    </div>

                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                      <h3 className="font-semibold text-lg mb-1">Aktivite geçmişi</h3>
                      <p className="text-neutral-500 text-sm">
                        Beğeniler, yorumlar, takipler ve etkileşimler burada listelenecek.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <History className="h-5 w-5 text-neutral-500" />
                      Tarihçe Özeti
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-medium text-neutral-700 dark:text-neutral-200">Katılım</span>
                      <span>{formatJoinDate(profile.created_at)}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-medium text-neutral-700 dark:text-neutral-200">Konum</span>
                      <span>
                        {[profile.city, profile.state && US_STATES_MAP[profile.state]].filter(Boolean).join(", ") || "—"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-medium text-neutral-700 dark:text-neutral-200">Meslek</span>
                      <span>{profession || "—"}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-medium text-neutral-700 dark:text-neutral-200">Takipçiler</span>
                      <span>{stats.followers}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-medium text-neutral-700 dark:text-neutral-200">Takip</span>
                      <span>{stats.following}</span>
                    </div>
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
