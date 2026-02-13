"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
  Group,
  GroupMember,
  GROUP_CATEGORY_LABELS, 
  GROUP_CATEGORY_ICONS,
  GROUP_CATEGORY_COLORS,
  MEMBER_ROLE_LABELS,
  US_STATES_MAP
} from "@/lib/types";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { 
  ArrowLeft,
  Users,
  MapPin,
  Globe,
  Lock,
  Unlock,
  Calendar,
  Share2,
  Settings,
  Loader2,
  CheckCircle2,
  UserPlus,
  UserMinus,
  Copy,
  Crown,
  Shield,
  MessageCircle,
  CalendarDays,
  Clock
} from "lucide-react";

type Tab = "about" | "members" | "events";

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("about");

  // Fetch group
  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      try {
        // Fetch group by slug
        const { data: groupData, error: groupError } = await supabase
          .from("groups")
          .select(`
            *,
            creator:created_by (id, username, full_name, avatar_url, bio)
          `)
          .eq("slug", slug)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData);

        // Fetch members
        const { data: membersData } = await supabase
          .from("group_members")
          .select(`
            *,
            profile:user_id (id, username, full_name, avatar_url)
          `)
          .eq("group_id", groupData.id)
          .eq("status", "approved")
          .order("role", { ascending: true });

        setMembers(membersData || []);

        // Check if current user is a member
        if (user) {
          const currentMember = membersData?.find(m => m.user_id === user.id);
          setIsMember(!!currentMember);
          setMemberRole(currentMember?.role || null);
        }

      } catch (error) {
        console.error("Error fetching group:", error);
        router.push("/groups");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchGroup();
    }
  }, [slug, user, router]);

  // Handle membership
  const handleMembership = async () => {
    if (!user || !group) {
      router.push(`/login?redirect=/groups/${slug}`);
      return;
    }

    setMembershipLoading(true);

    try {
      if (isMember) {
        // Leave group
        const { error } = await supabase
          .from("group_members")
          .delete()
          .eq("group_id", group.id)
          .eq("user_id", user.id);

        if (error) throw error;
        setIsMember(false);
        setMemberRole(null);
        setMembers(prev => prev.filter(m => m.user_id !== user.id));
      } else {
        // Join group
        const status = group.requires_approval ? "pending" : "approved";
        const { data, error } = await supabase
          .from("group_members")
          .insert({
            group_id: group.id,
            user_id: user.id,
            role: "member",
            status
          })
          .select(`
            *,
            profile:user_id (id, username, full_name, avatar_url)
          `)
          .single();

        if (error) throw error;
        
        if (status === "approved" && data) {
          setIsMember(true);
          setMemberRole("member");
          setMembers(prev => [...prev, data]);
        } else {
          // Show pending message
          alert("Üyelik talebiniz gönderildi. Yönetici onayı bekliyor.");
        }
      }
    } catch (error) {
      console.error("Error updating membership:", error);
    } finally {
      setMembershipLoading(false);
    }
  };

  // Copy link
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Grup Bulunamadı</h1>
          <p className="text-neutral-500 mb-4">Bu grup mevcut değil veya kaldırılmış olabilir.</p>
          <Link href="/groups">
            <Button variant="primary">Gruplara Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  const creator = group.creator as any;
  const isAdmin = memberRole === "admin";
  const isModerator = memberRole === "moderator" || isAdmin;

  return (
    <div className="ak-page">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-blue-500 to-purple-500">
        {group.cover_image_url ? (
          <img 
            src={group.cover_image_url} 
            alt={group.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl opacity-30">{GROUP_CATEGORY_ICONS[group.category]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Link href="/groups">
            <Button variant="secondary" size="sm" className="gap-2">
              <ArrowLeft size={18} />
              Geri
            </Button>
          </Link>
        </div>

        {/* Privacy Badge */}
        <div className="absolute top-4 right-4">
          {group.is_private ? (
            <Badge variant="default" size="lg" className="gap-1">
              <Lock size={14} />
              Özel Grup
            </Badge>
          ) : (
            <Badge variant="success" size="lg" className="gap-1">
              <Unlock size={14} />
              Açık Grup
            </Badge>
          )}
        </div>
      </div>

      <div className="ak-shell lg:px-8 -mt-16 relative z-10 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Group Header */}
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-neutral-900 shadow-lg flex-shrink-0">
                    {group.avatar_url ? (
                      <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{GROUP_CATEGORY_ICONS[group.category]}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${GROUP_CATEGORY_COLORS[group.category]}`}>
                      {GROUP_CATEGORY_ICONS[group.category]} {GROUP_CATEGORY_LABELS[group.category]}
                    </div>
                    
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">{group.name}</h1>
                    
                    <div className="flex flex-wrap gap-3 text-sm text-neutral-500">
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>{group.member_count} üye</span>
                      </div>
                      {group.is_nationwide ? (
                        <div className="flex items-center gap-1">
                          <Globe size={16} />
                          <span>ABD Geneli</span>
                        </div>
                      ) : group.city && group.state ? (
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>{group.city}, {US_STATES_MAP[group.state] || group.state}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                  {isAdmin ? (
                    <Button variant="outline" className="gap-2">
                      <Settings size={18} />
                      Grup Ayarları
                    </Button>
                  ) : (
                    <Button
                      variant={isMember ? "outline" : "primary"}
                      onClick={handleMembership}
                      disabled={membershipLoading}
                      className="gap-2"
                    >
                      {membershipLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : isMember ? (
                        <>
                          <UserMinus size={18} />
                          Gruptan Ayrıl
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} />
                          Gruba Katıl
                        </>
                      )}
                    </Button>
                  )}

                  <Button variant="outline" onClick={copyLink} className="gap-2">
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    {copied ? "Kopyalandı!" : "Paylaş"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(["about", "members", "events"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  }`}
                >
                  {tab === "about" && "Hakkında"}
                  {tab === "members" && `Üyeler (${members.length})`}
                  {tab === "events" && "Etkinlikler"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "about" && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Grup Hakkında</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {group.description}
                  </p>

                  <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                    <h4 className="font-semibold mb-3">Grup Bilgileri</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Oluşturulma</span>
                        <span>{formatDate(group.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Gizlilik</span>
                        <span>{group.is_private ? "Özel Grup" : "Açık Grup"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Üyelik</span>
                        <span>{group.requires_approval ? "Onay Gerekli" : "Herkese Açık"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "members" && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Üyeler</span>
                    <Badge variant="primary">{members.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {members.length === 0 ? (
                    <p className="text-center text-neutral-500 py-8">Henüz üye yok</p>
                  ) : (
                    <div className="space-y-3">
                      {members.map(member => {
                        const profile = member.profile as any;
                        return (
                          <Link
                            key={member.user_id}
                            href={`/profile/${member.user_id}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <Avatar 
                              src={profile?.avatar_url} 
                              fallback={profile?.full_name || profile?.username || "U"} 
                              size="md"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {profile?.full_name || profile?.username || "Anonim"}
                                </span>
                                {member.role === "admin" && (
                                  <Badge variant="warning" size="sm" className="gap-1">
                                    <Crown size={12} />
                                    Yönetici
                                  </Badge>
                                )}
                                {member.role === "moderator" && (
                                  <Badge variant="info" size="sm" className="gap-1">
                                    <Shield size={12} />
                                    Moderatör
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-neutral-500">@{profile?.username}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "events" && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Grup Etkinlikleri</span>
                    {isModerator && (
                      <Link href="/meetups/create">
                        <Button variant="outline" size="sm" className="gap-1">
                          <CalendarDays size={16} />
                          Etkinlik Oluştur
                        </Button>
                      </Link>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <CalendarDays className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                    <h4 className="font-semibold mb-1">Yaklaşan Etkinlik Yok</h4>
                    <p className="text-sm text-neutral-500">
                      Bu grubun henüz planlanmış etkinliği bulunmuyor.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Creator */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="text-yellow-500" size={18} />
                  Grup Kurucusu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link 
                  href={`/profile/${creator?.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Avatar 
                    src={creator?.avatar_url} 
                    fallback={creator?.full_name || creator?.username || "O"} 
                    size="lg"
                  />
                  <div>
                    <p className="font-semibold">
                      {creator?.full_name || creator?.username || "Kurucu"}
                    </p>
                    <p className="text-sm text-neutral-500">@{creator?.username}</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="glass">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Toplam Üye</span>
                  <span className="font-bold">{group.member_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Kategori</span>
                  <span className="font-medium">{GROUP_CATEGORY_LABELS[group.category]}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Konum</span>
                  <span className="font-medium">
                    {group.is_nationwide ? "ABD Geneli" : `${group.city}, ${group.state}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Kuruluş</span>
                  <span className="font-medium">{formatDate(group.created_at)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Share */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 size={18} />
                  Paylaş
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={copyLink}
                >
                  {copied ? "Kopyalandı!" : "Link Kopyala"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
