"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HeartOff, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Toast, ToastViewport } from "@/app/components/ui/Toast";
import type { FavoriteTargetType } from "@/lib/types";

type CategoryFilter = "all" | FavoriteTargetType;

type GenericFavoriteRow = { id: string; target_type: FavoriteTargetType; target_id: string; created_at: string };
type LegacyEmlakFavoriteRow = { listing_id: string; user_id: string; created_at: string };
type EmlakRow = { id: string; title: string; price: number | null; city: string | null; state: string | null; created_at: string; images: string[] | null; status: string | null };
type IsRow = { id: string; title: string; salary_min: number | null; city: string | null; state: string | null; created_at: string; status: string | null };
type AlisverisRow = { id: string; title: string; price: number | null; city: string | null; state: string | null; created_at: string; images: string[] | null; status: string | null };

type FollowedCard = { favoriteId: string; targetType: FavoriteTargetType; targetId: string; title: string; price?: number | null; location?: string; createdAt: string; imageUrl?: string | null; status?: string | null; href: string };

const CATEGORY_LABELS: Record<FavoriteTargetType, string> = { emlak: "Emlak", is: "İş", alisveris: "Alışveriş" };
const CATEGORY_STYLES: Record<FavoriteTargetType, string> = {
  emlak: "bg-emerald-50 text-emerald-700 border-emerald-200",
  is: "bg-blue-50 text-blue-700 border-blue-200",
  alisveris: "bg-orange-50 text-orange-700 border-orange-200",
};

const formatPrice = (value?: number | null) => {
  if (!value && value !== 0) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);
};

export function FollowedListingsSection({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<FollowedCard[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      // Always load emlak favorites from existing listing_favorites table.
      const [{ data: legacyRows, error: legacyError }, { data: genericRows, error: genericError }] = await Promise.all([
        supabase.from("listing_favorites").select("listing_id, user_id, created_at").eq("user_id", userId),
        supabase.from("favorites").select("id, target_type, target_id, created_at").eq("user_id", userId),
      ]);

      if (cancelled) return;
      if (legacyError) {
        setRows([]);
        setLoading(false);
        setToast("Takip edilen ilanlar yüklenemedi.");
        return;
      }

      // favorites table may not exist yet in some installs; that's okay.
      const hasGenericTable = !genericError;

      const legacyFavorites = ((legacyRows || []) as LegacyEmlakFavoriteRow[]).map<GenericFavoriteRow>((item) => ({
        id: `legacy-${item.listing_id}`,
        target_type: "emlak",
        target_id: item.listing_id,
        created_at: item.created_at,
      }));

      const unifiedFavorites = [
        ...legacyFavorites,
        ...(hasGenericTable ? ((genericRows || []) as GenericFavoriteRow[]) : []),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const emlakIds = unifiedFavorites.filter((item) => item.target_type === "emlak").map((item) => item.target_id);
      const isIds = unifiedFavorites.filter((item) => item.target_type === "is").map((item) => item.target_id);
      const alisverisIds = unifiedFavorites.filter((item) => item.target_type === "alisveris").map((item) => item.target_id);

      const [emlakRes, isRes, alisverisRes] = await Promise.all([
        emlakIds.length ? supabase.from("listings").select("id, title, price, city, state, created_at, images, status").in("id", emlakIds) : Promise.resolve({ data: [], error: null }),
        isIds.length ? supabase.from("job_listings").select("id, title, salary_min, city, state, created_at, status").in("id", isIds) : Promise.resolve({ data: [], error: null }),
        alisverisIds.length ? supabase.from("marketplace_listings").select("id, title, price, city, state, created_at, images, status").in("id", alisverisIds) : Promise.resolve({ data: [], error: null }),
      ]);

      if (cancelled) return;

      const emlakMap = new Map<string, EmlakRow>((emlakRes.data as EmlakRow[]).map((item) => [item.id, item]));
      const isMap = new Map<string, IsRow>((isRes.data as IsRow[]).map((item) => [item.id, item]));
      const alisverisMap = new Map<string, AlisverisRow>((alisverisRes.data as AlisverisRow[]).map((item) => [item.id, item]));

      const normalized = unifiedFavorites
        .map((fav): FollowedCard | null => {
          if (fav.target_type === "emlak") {
            const item = emlakMap.get(fav.target_id);
            if (!item) return null;
            return { favoriteId: fav.id, targetType: "emlak", targetId: item.id, title: item.title, price: item.price, location: [item.city, item.state].filter(Boolean).join(", "), createdAt: item.created_at, imageUrl: item.images?.[0] || null, status: item.status, href: `/emlak/ilan/${item.id}` };
          }
          if (fav.target_type === "is") {
            const item = isMap.get(fav.target_id);
            if (!item) return null;
            return { favoriteId: fav.id, targetType: "is", targetId: item.id, title: item.title, price: item.salary_min, location: [item.city, item.state].filter(Boolean).join(", "), createdAt: item.created_at, imageUrl: null, status: item.status, href: `/is/ilan/${item.id}` };
          }
          const item = alisverisMap.get(fav.target_id);
          if (!item) return null;
          return { favoriteId: fav.id, targetType: "alisveris", targetId: item.id, title: item.title, price: item.price, location: [item.city, item.state].filter(Boolean).join(", "), createdAt: item.created_at, imageUrl: item.images?.[0] || null, status: item.status, href: `/alisveris/ilan/${item.id}` };
        })
        .filter(Boolean) as FollowedCard[];

      setRows(normalized);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, userId]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const statuses = useMemo(() => ["all", ...Array.from(new Set(rows.map((item) => item.status).filter(Boolean) as string[]))], [rows]);

  const filtered = rows.filter((item) => {
    const categoryMatch = category === "all" || item.targetType === category;
    const statusMatch = statusFilter === "all" || item.status === statusFilter;
    return categoryMatch && statusMatch;
  });

  const unfollow = async (item: FollowedCard) => {
    const previous = rows;
    setRows((curr) => curr.filter((row) => row.favoriteId !== item.favoriteId));

    const response = item.targetType === "emlak"
      ? await supabase.from("listing_favorites").delete().eq("listing_id", item.targetId).eq("user_id", userId)
      : await supabase.from("favorites").delete().eq("id", item.favoriteId).eq("user_id", userId);

    if (response.error) {
      setRows(previous);
      setToast("Takip kaldırılırken hata oluştu.");
      return;
    }

    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-4 w-full min-w-0 overflow-x-hidden">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "emlak", "is", "alisveris"] as CategoryFilter[]).map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${category === item ? "bg-blue-600 text-white border-blue-600" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"}`}>
            {item === "all" ? "Tümü" : CATEGORY_LABELS[item]}
          </button>
        ))}
      </div>

      {statuses.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((item) => (
            <button key={item} onClick={() => setStatusFilter(item)} className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${statusFilter === item ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-200"}`}>
              {item === "all" ? "Tüm Durumlar" : item}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="h-44 rounded-2xl border border-neutral-200 bg-neutral-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">Takip ettiğiniz ilan bulunmuyor.</div>
      ) : (
        <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2">
          {filtered.map((item) => (
            <article key={item.favoriteId} className="w-full min-w-0 rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-sm">
              <div className="flex min-w-0 gap-3">
                <div className="h-20 w-20 max-w-[5rem] shrink-0 overflow-hidden rounded-xl bg-neutral-100">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /> : null}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">{item.title}</h3>
                    <button type="button" aria-label="Takipten çıkar" className="h-8 w-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-red-600" onClick={() => unfollow(item)}><HeartOff size={14} /></button>
                  </div>
                  <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
                    <Badge className={`border ${CATEGORY_STYLES[item.targetType]}`}>{CATEGORY_LABELS[item.targetType]}</Badge>
                    {item.price !== undefined && item.price !== null ? <span className="max-w-full truncate text-sm font-semibold text-neutral-900">{formatPrice(item.price)}</span> : null}
                  </div>
                  {item.location ? <div className="mt-1 flex min-w-0 items-start gap-1 text-xs text-neutral-500"><MapPin size={12} className="mt-0.5 shrink-0" /><span className="break-words">{item.location}</span></div> : null}
                  <p className="mt-1 text-xs text-neutral-400">{new Date(item.createdAt).toLocaleDateString("tr-TR")}</p>
                </div>
              </div>
              <div className="mt-3"><Link href={item.href} className="block w-full"><Button variant="secondary" className="w-full">İlana Git</Button></Link></div>
            </article>
          ))}
        </div>
      )}

      <ToastViewport>{toast ? <Toast variant="error" description={toast} onClose={() => setToast(null)} /> : null}</ToastViewport>
    </div>
  );
}
