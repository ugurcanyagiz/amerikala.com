import { publicSupabase } from "@/lib/supabase/publicClient";

export type SiteSearchType = "event" | "realEstate" | "job" | "marketplace" | "group" | "profile" | "post";

export type SiteSearchResult = {
  id: string;
  type: SiteSearchType;
  title: string;
  subtitle: string;
  href: string;
  createdAt?: string;
};

export async function searchSiteContent(query: string, limitPerType = 6): Promise<SiteSearchResult[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];

  const keyword = `%${normalizedQuery}%`;

  const [eventsRes, listingsRes, jobsRes, marketplaceRes, groupsRes, profilesRes, postsRes] = await Promise.all([
    publicSupabase
      .from("events")
      .select("id, title, city, state, created_at")
      .eq("status", "approved")
      .or(`title.ilike.${keyword},description.ilike.${keyword},city.ilike.${keyword},state.ilike.${keyword}`)
      .order("created_at", { ascending: false })
      .limit(limitPerType),
    publicSupabase
      .from("listings")
      .select("id, title, city, state, created_at")
      .eq("status", "approved")
      .or(`title.ilike.${keyword},description.ilike.${keyword},city.ilike.${keyword},state.ilike.${keyword}`)
      .order("created_at", { ascending: false })
      .limit(limitPerType),
    publicSupabase
      .from("job_listings")
      .select("id, title, city, state, created_at")
      .eq("status", "approved")
      .or(`title.ilike.${keyword},description.ilike.${keyword},city.ilike.${keyword},state.ilike.${keyword}`)
      .order("created_at", { ascending: false })
      .limit(limitPerType),
    publicSupabase
      .from("marketplace_listings")
      .select("id, title, city, state, created_at")
      .eq("status", "approved")
      .or(`title.ilike.${keyword},description.ilike.${keyword},city.ilike.${keyword},state.ilike.${keyword}`)
      .order("created_at", { ascending: false })
      .limit(limitPerType),
    publicSupabase
      .from("groups")
      .select("id, name, city, state, slug, created_at")
      .eq("status", "approved")
      .or(`name.ilike.${keyword},description.ilike.${keyword},city.ilike.${keyword},state.ilike.${keyword}`)
      .order("created_at", { ascending: false })
      .limit(limitPerType),
    publicSupabase
      .from("profiles")
      .select("id, username, full_name, city, state, created_at")
      .or(`username.ilike.${keyword},full_name.ilike.${keyword},bio.ilike.${keyword},city.ilike.${keyword},state.ilike.${keyword}`)
      .order("created_at", { ascending: false })
      .limit(limitPerType),
    publicSupabase
      .from("posts")
      .select("id, content, created_at")
      .ilike("content", keyword)
      .order("created_at", { ascending: false })
      .limit(limitPerType),
  ]);

  if (eventsRes.error) throw eventsRes.error;
  if (listingsRes.error) throw listingsRes.error;
  if (jobsRes.error) throw jobsRes.error;
  if (marketplaceRes.error) throw marketplaceRes.error;
  if (groupsRes.error) throw groupsRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (postsRes.error) throw postsRes.error;

  const results: SiteSearchResult[] = [
    ...((eventsRes.data ?? []).map((item) => ({
      id: `event-${item.id}`,
      type: "event" as const,
      title: item.title,
      subtitle: `${item.city}, ${item.state}`,
      href: `/meetups/${item.id}`,
      createdAt: item.created_at,
    }))),
    ...((listingsRes.data ?? []).map((item) => ({
      id: `listing-${item.id}`,
      type: "realEstate" as const,
      title: item.title,
      subtitle: `${item.city}, ${item.state}`,
      href: `/emlak/ilan/${item.id}`,
      createdAt: item.created_at,
    }))),
    ...((jobsRes.data ?? []).map((item) => ({
      id: `job-${item.id}`,
      type: "job" as const,
      title: item.title,
      subtitle: `${item.city}, ${item.state}`,
      href: `/is/ilan/${item.id}`,
      createdAt: item.created_at,
    }))),
    ...((marketplaceRes.data ?? []).map((item) => ({
      id: `market-${item.id}`,
      type: "marketplace" as const,
      title: item.title,
      subtitle: `${item.city}, ${item.state}`,
      href: `/alisveris/ilan/${item.id}`,
      createdAt: item.created_at,
    }))),
    ...((groupsRes.data ?? []).map((item) => ({
      id: `group-${item.id}`,
      type: "group" as const,
      title: item.name,
      subtitle: `${item.city || "Çevrimiçi"}${item.state ? `, ${item.state}` : ""}`,
      href: `/groups/${item.slug}`,
      createdAt: item.created_at,
    }))),
    ...((profilesRes.data ?? []).map((item) => ({
      id: `profile-${item.id}`,
      type: "profile" as const,
      title: item.full_name || item.username || "Kullanıcı",
      subtitle: `${item.city || ""}${item.state ? `, ${item.state}` : ""}`.trim() || "Profil",
      href: `/profile/${item.id}`,
      createdAt: item.created_at,
    }))),
    ...((postsRes.data ?? []).map((item) => ({
      id: `post-${item.id}`,
      type: "post" as const,
      title: item.content.slice(0, 90),
      subtitle: "Feed gönderisi",
      href: `/feed?focusPost=${item.id}`,
      createdAt: item.created_at,
    }))),
  ];

  return results
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, limitPerType * 5);
}
