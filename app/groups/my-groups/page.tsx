"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
  Group,
  GroupMember,
  GROUP_CATEGORY_LABELS, 
  GROUP_CATEGORY_ICONS,
  GROUP_STATUS_LABELS,
  GROUP_STATUS_COLORS,
  MEMBER_ROLE_LABELS
} from "@/lib/types";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { 
  ArrowLeft,
  Plus,
  Users,
  MapPin,
  Globe,
  Loader2,
  Eye,
  Trash2,
  Settings,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  Crown,
  Shield,
  UserCheck
} from "lucide-react";

type FilterTab = "all" | "admin" | "member" | "pending";

export default function MyGroupsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [createdGroups, setCreatedGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<(GroupMember & { group: Group })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/groups/my-groups");
    }
  }, [user, authLoading, router]);

  // Fetch my groups
  useEffect(() => {
    if (!user) return;

    const fetchMyGroups = async () => {
      setLoading(true);
      try {
        // Fetch groups I created
        const { data: created, error: createdError } = await supabase
          .from("groups")
          .select("*")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });

        if (createdError) throw createdError;
        setCreatedGroups(created || []);

        // Fetch groups I'm a member of (excluding ones I created)
        const { data: memberships, error: membershipsError } = await supabase
          .from("group_members")
          .select(`
            *,
            group:group_id (*)
          `)
          .eq("user_id", user.id)
          .neq("role", "admin"); // Exclude admin role (those are created groups)

        if (membershipsError) throw membershipsError;
        
        // Filter out groups I created (they're already in createdGroups)
        const createdIds = new Set((created || []).map(g => g.id));
        const filtered = (memberships || []).filter(m => !createdIds.has(m.group_id));
        setJoinedGroups(filtered as any);

      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyGroups();
  }, [user]);

  // Delete group
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Bu grubu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) return;

    setDeletingGroup(groupId);
    try {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;
      setCreatedGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Grup silinemedi");
    } finally {
      setDeletingGroup(null);
    }
  };

  // Stats
  const stats = {
    total: createdGroups.length + joinedGroups.length,
    created: createdGroups.length,
    pending: createdGroups.filter(g => g.status === "pending").length,
    approved: createdGroups.filter(g => g.status === "approved").length,
    member: joinedGroups.filter(m => m.status === "approved").length
  };

  // Filter groups
  const getFilteredGroups = () => {
    switch (activeTab) {
      case "admin":
        return { created: createdGroups, joined: [] };
      case "member":
        return { created: [], joined: joinedGroups.filter(m => m.status === "approved") };
      case "pending":
        return { 
          created: createdGroups.filter(g => g.status === "pending"), 
          joined: joinedGroups.filter(m => m.status === "pending") 
        };
      default:
        return { created: createdGroups, joined: joinedGroups };
    }
  };

  const filtered = getFilteredGroups();

  if (authLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/groups">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Gruplarım</h1>
              <p className="text-neutral-500">Oluşturduğunuz ve üye olduğunuz gruplar</p>
            </div>
          </div>
          <Link href="/groups/create">
            <Button variant="primary" className="gap-2">
              <Plus size={18} />
              Yeni Grup
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`p-4 rounded-xl text-left transition-all ${
              activeTab === "all"
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-white dark:bg-neutral-900 hover:shadow-md"
            }`}
          >
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className={`text-sm ${activeTab === "all" ? "text-white/80" : "text-neutral-500"}`}>
              Toplam
            </p>
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`p-4 rounded-xl text-left transition-all ${
              activeTab === "admin"
                ? "bg-yellow-500 text-white shadow-lg"
                : "bg-white dark:bg-neutral-900 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-2">
              <Crown size={20} className={activeTab === "admin" ? "text-white" : "text-yellow-500"} />
              <p className="text-2xl font-bold">{stats.created}</p>
            </div>
            <p className={`text-sm ${activeTab === "admin" ? "text-white/80" : "text-neutral-500"}`}>
              Yönetici
            </p>
          </button>

          <button
            onClick={() => setActiveTab("member")}
            className={`p-4 rounded-xl text-left transition-all ${
              activeTab === "member"
                ? "bg-green-500 text-white shadow-lg"
                : "bg-white dark:bg-neutral-900 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-2">
              <UserCheck size={20} className={activeTab === "member" ? "text-white" : "text-green-500"} />
              <p className="text-2xl font-bold">{stats.member}</p>
            </div>
            <p className={`text-sm ${activeTab === "member" ? "text-white/80" : "text-neutral-500"}`}>
              Üye
            </p>
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={`p-4 rounded-xl text-left transition-all ${
              activeTab === "pending"
                ? "bg-orange-500 text-white shadow-lg"
                : "bg-white dark:bg-neutral-900 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock3 size={20} className={activeTab === "pending" ? "text-white" : "text-orange-500"} />
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <p className={`text-sm ${activeTab === "pending" ? "text-white/80" : "text-neutral-500"}`}>
              Beklemede
            </p>
          </button>
        </div>

        {/* Groups List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.created.length === 0 && filtered.joined.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {activeTab === "all" 
                  ? "Henüz bir grubunuz yok" 
                  : `Bu kategoride grup bulunmuyor`}
              </h3>
              <p className="text-neutral-500 mb-6">
                Yeni bir grup oluşturun veya mevcut gruplara katılın.
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/groups/create">
                  <Button variant="primary" className="gap-2">
                    <Plus size={18} />
                    Grup Oluştur
                  </Button>
                </Link>
                <Link href="/groups">
                  <Button variant="outline">
                    Grupları Keşfet
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Created Groups */}
            {filtered.created.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Crown className="text-yellow-500" size={20} />
                  Oluşturduğum Gruplar
                </h2>
                <div className="space-y-4">
                  {filtered.created.map(group => (
                    <GroupCard 
                      key={group.id} 
                      group={group} 
                      role="admin"
                      onDelete={() => handleDeleteGroup(group.id)}
                      deleting={deletingGroup === group.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Joined Groups */}
            {filtered.joined.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserCheck className="text-green-500" size={20} />
                  Üye Olduğum Gruplar
                </h2>
                <div className="space-y-4">
                  {filtered.joined.map(membership => (
                    <GroupCard 
                      key={membership.group_id} 
                      group={membership.group as Group} 
                      role={membership.role}
                      memberStatus={membership.status}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Group Card Component
function GroupCard({ 
  group, 
  role, 
  memberStatus,
  onDelete, 
  deleting 
}: { 
  group: Group; 
  role: string;
  memberStatus?: string;
  onDelete?: () => void; 
  deleting?: boolean;
}) {
  const isCreator = role === "admin";
  const isPending = isCreator ? group.status === "pending" : memberStatus === "pending";

  return (
    <Card className="glass overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Avatar */}
          <div className="w-24 sm:w-32 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            {group.avatar_url ? (
              <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">{GROUP_CATEGORY_ICONS[group.category]}</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {/* Status Badge */}
                  {isCreator && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${GROUP_STATUS_COLORS[group.status]}`}>
                      {GROUP_STATUS_LABELS[group.status]}
                    </span>
                  )}
                  {!isCreator && memberStatus && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      memberStatus === "approved" 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}>
                      {memberStatus === "approved" ? "Üye" : "Onay Bekliyor"}
                    </span>
                  )}
                  {/* Role Badge */}
                  {role === "admin" && (
                    <Badge variant="warning" size="sm" className="gap-1">
                      <Crown size={10} />
                      Yönetici
                    </Badge>
                  )}
                  {role === "moderator" && (
                    <Badge variant="info" size="sm" className="gap-1">
                      <Shield size={10} />
                      Moderatör
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-lg">{group.name}</h3>
              </div>
            </div>

            {/* Rejection Reason */}
            {isCreator && group.status === "rejected" && group.rejection_reason && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 mb-3">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Red Sebebi:</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{group.rejection_reason}</p>
                </div>
              </div>
            )}

            <p className="text-sm text-neutral-500 line-clamp-1 mb-3">{group.description}</p>

            <div className="flex flex-wrap gap-3 text-sm text-neutral-500 mb-4">
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
                  <span>{group.city}, {group.state}</span>
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Link href={`/groups/${group.slug}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <Eye size={16} />
                  Görüntüle
                </Button>
              </Link>
              
              {isCreator && group.status === "approved" && (
                <Button variant="ghost" size="sm" className="gap-1">
                  <Settings size={16} />
                  Ayarlar
                </Button>
              )}

              {isCreator && group.status === "pending" && onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={onDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Sil
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
