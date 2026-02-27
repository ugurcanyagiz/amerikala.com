"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { 
  Group, 
  GroupCategory,
  GROUP_CATEGORY_LABELS, 
  GROUP_CATEGORY_ICONS,
  GROUP_CATEGORY_COLORS,
  US_STATES,
  US_STATES_MAP 
} from "@/lib/types";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { 
  Plus, 
  MapPin,
  Users,
  Search,
  Loader2,
  ChevronRight,
  Globe,
  Lock,
  Unlock,
  Grid,
  List,
  Sparkles,
  TrendingUp,
  Crown,
  UserPlus,
  Heart
} from "lucide-react";

type ViewMode = "grid" | "list";

export default function GroupsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // State
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GroupCategory | "all">("all");
  const [selectedState, setSelectedState] = useState<string>(searchParams.get("state") || "all");

  // Fetch approved groups
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("groups")
          .select(`
            *,
            creator:created_by (id, username, full_name, avatar_url)
          `)
          .eq("status", "approved")
          .order("member_count", { ascending: false });

        // Filter by state
        if (selectedState !== "all") {
          query = query.or(`state.eq.${selectedState},is_nationwide.eq.true`);
        }

        // Filter by category
        if (selectedCategory !== "all") {
          query = query.eq("category", selectedCategory);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching groups:", error);
        } else {
          setGroups(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [selectedState, selectedCategory]);

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    
    const query = searchQuery.toLowerCase();
    return groups.filter(group => 
      group.name.toLowerCase().includes(query) ||
      group.description.toLowerCase().includes(query) ||
      (group.city && group.city.toLowerCase().includes(query))
    );
  }, [groups, searchQuery]);

  // Featured groups (top 4 by member count)
  const featuredGroups = filteredGroups.slice(0, 4);
  const regularGroups = filteredGroups.slice(4);

  // Categories for filter
  const categories: { value: GroupCategory | "all"; label: string; icon?: string }[] = [
    { value: "all", label: "Tümü" },
    ...Object.entries(GROUP_CATEGORY_LABELS).map(([value, label]) => ({
      value: value as GroupCategory,
      label,
      icon: GROUP_CATEGORY_ICONS[value as GroupCategory]
    }))
  ];

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="ak-shell ak-shell-wide py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Users className="text-blue-500" />
                  Community Grupları
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {filteredGroups.length} aktif grup · canlı feed, etkinlik ve moderasyonlu üyelik sistemi
                </p>
              </div>
              
              {user ? (
                <Link href="/groups/create">
                  <Button variant="primary" className="gap-2">
                    <Plus size={20} />
                    Grup Oluştur
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="secondary" className="gap-2">
                    Grup oluşturmak için giriş yapın
                  </Button>
                </Link>
              )}
            </div>

            {/* Search & Filters */}
            <Card className="glass mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                    <input
                      type="text"
                      placeholder="Grup ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* State Filter */}
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                  >
                    <option value="all">Tüm Eyaletler</option>
                    {US_STATES.map(state => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>

                  {/* View Mode */}
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === "grid" 
                          ? "bg-white dark:bg-neutral-700 shadow-sm" 
                          : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === "list" 
                          ? "bg-white dark:bg-neutral-700 shadow-sm" 
                          : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      <List size={20} />
                    </button>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === cat.value
                          ? "bg-blue-500 text-white"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {cat.icon && <span className="mr-1">{cat.icon}</span>}
                      {cat.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Groups List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Grup bulunamadı</h3>
                  <p className="text-neutral-500 mb-6">
                    {searchQuery || selectedCategory !== "all" || selectedState !== "all"
                      ? "Arama kriterlerinize uygun grup bulunamadı."
                      : "Henüz grup oluşturulmamış."}
                  </p>
                  {user && (
                    <Link href="/groups/create">
                      <Button variant="primary" className="gap-2">
                        <Plus size={20} />
                        İlk Grubu Oluştur
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Featured Groups */}
                {featuredGroups.length > 0 && viewMode === "grid" && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="text-yellow-500" size={20} />
                      Popüler Gruplar
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {featuredGroups.map(group => (
                        <GroupCard key={group.id} group={group} />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Groups */}
                {viewMode === "grid" ? (
                  regularGroups.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="text-blue-500" size={20} />
                        Tüm Gruplar
                      </h2>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {regularGroups.map(group => (
                          <GroupCard key={group.id} group={group} />
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    {filteredGroups.map(group => (
                      <GroupListCard key={group.id} group={group} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Groups Section */}
            {user && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Gruplarım</h2>
                  <Link href="/groups/my-groups">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Tümünü Gör
                      <ChevronRight size={16} />
                    </Button>
                  </Link>
                </div>
                <MyGroupsPreview userId={user.id} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Group Card Component (Grid View)
function GroupCard({ group }: { group: Group }) {
  return (
    <Link href={`/groups/${group.slug}`}>
      <Card className="glass overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full group">
        {/* Cover Image */}
        <div className="relative h-24 bg-gradient-to-br from-blue-500 to-purple-500">
          {group.cover_image_url ? (
            <img 
              src={group.cover_image_url} 
              alt={group.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl opacity-50">{GROUP_CATEGORY_ICONS[group.category]}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--color-trust-rgb),0.6)] to-transparent" />
          
          {/* Avatar */}
          <div className="absolute -bottom-6 left-4">
            <div className="w-14 h-14 rounded-xl bg-white dark:bg-neutral-800 shadow-lg flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-neutral-900">
              {group.avatar_url ? (
                <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{GROUP_CATEGORY_ICONS[group.category]}</span>
              )}
            </div>
          </div>

          {/* Privacy Badge */}
          <div className="absolute top-2 right-2">
            {group.is_private ? (
              <Badge variant="default" size="sm" className="gap-1">
                <Lock size={12} />
                Özel
              </Badge>
            ) : (
              <Badge variant="success" size="sm" className="gap-1">
                <Unlock size={12} />
                Açık
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 pt-8">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${GROUP_CATEGORY_COLORS[group.category]}`}>
            {GROUP_CATEGORY_ICONS[group.category]} {GROUP_CATEGORY_LABELS[group.category]}
          </div>
          
          <h3 className="font-bold line-clamp-1 mb-1 group-hover:text-blue-500 transition-colors">
            {group.name}
          </h3>
          
          <p className="text-sm text-neutral-500 line-clamp-2 mb-3">
            {group.description}
          </p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-neutral-500">
              <Users size={16} />
              <span>{group.member_count} üye</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-500">
              {group.is_nationwide ? (
                <>
                  <Globe size={14} />
                  <span>ABD Geneli</span>
                </>
              ) : group.state ? (
                <>
                  <MapPin size={14} />
                  <span>{group.state}</span>
                </>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Group List Card Component
function GroupListCard({ group }: { group: Group }) {
  const creator = group.creator as { full_name?: string | null; username?: string | null } | undefined;
  return (
    <Link href={`/groups/${group.slug}`}>
      <Card className="glass hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
              {group.avatar_url ? (
                <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">{GROUP_CATEGORY_ICONS[group.category]}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${GROUP_CATEGORY_COLORS[group.category]}`}>
                      {GROUP_CATEGORY_ICONS[group.category]} {GROUP_CATEGORY_LABELS[group.category]}
                    </span>
                    {group.is_private ? (
                      <Badge variant="default" size="sm" className="gap-1">
                        <Lock size={10} />
                        Özel
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className="font-bold text-lg group-hover:text-blue-500 transition-colors line-clamp-1">
                    {group.name}
                  </h3>
                  <p className="text-sm text-neutral-500 line-clamp-1 mt-1">
                    {group.description}
                  </p>
                </div>

                {/* Cover Thumbnail */}
                {group.cover_image_url && (
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden hidden sm:block">
                    <img 
                      src={group.cover_image_url} 
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-neutral-500">
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
                <div className="flex items-center gap-1">
                  <Crown size={16} className="text-yellow-500" />
                  <span>{creator?.full_name || creator?.username}</span>
                </div>
              </div>
            </div>

            {/* Arrow & Join Button */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <Button variant="secondary" size="sm" className="hidden sm:flex gap-1">
                <UserPlus size={16} />
                Katıl
              </Button>
              <ChevronRight size={24} className="text-neutral-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// My Groups Preview Component
function MyGroupsPreview({ userId }: { userId: string }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        // Fetch groups where user is a member
        const { data: memberData, error: memberError } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", userId)
          .eq("status", "approved");

        if (memberError) throw memberError;

        if (memberData && memberData.length > 0) {
          const groupIds = memberData.map(m => m.group_id);
          
          const { data: groupsData, error: groupsError } = await supabase
            .from("groups")
            .select("*")
            .in("id", groupIds)
            .limit(3);

          if (groupsError) throw groupsError;
          setGroups(groupsData || []);
        }
      } catch (error) {
        console.error("Error fetching my groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyGroups();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="p-6 text-center">
          <Heart className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500">Henüz bir gruba katılmadınız</p>
          <p className="text-sm text-neutral-400 mt-1">Yukarıdaki gruplardan birini keşfedin!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {groups.map(group => (
        <Link key={group.id} href={`/groups/${group.slug}`}>
          <Card className="glass hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  {group.avatar_url ? (
                    <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-xl">{GROUP_CATEGORY_ICONS[group.category]}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{group.name}</h3>
                  <p className="text-sm text-neutral-500">{group.member_count} üye</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
