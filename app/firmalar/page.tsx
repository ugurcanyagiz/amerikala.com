"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { US_STATES_MAP } from "@/lib/types";
import { Building2, MapPin, MessageSquare, Plus, Search, Star } from "lucide-react";

type BusinessCategory = {
  id: string;
  name: string;
};

type Business = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  status: string;
  category_id: string | null;
  category?: { name: string | null } | null;
};

type RatingMap = Record<string, { avg: number; count: number }>;

const stateOptions = [
  { value: "all", label: "Tüm eyaletler" },
  ...Object.entries(US_STATES_MAP).map(([value, label]) => ({ value, label })),
];

export default function BusinessDirectoryPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [ratings, setRatings] = useState<RatingMap>({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error: categoriesError } = await supabase
        .from("business_categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (categoriesError) {
        setError("Kategoriler yüklenemedi.");
        return;
      }

      setCategories((data || []) as BusinessCategory[]);
    };

    void fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("businesses")
        .select("id, name, slug, city, state, status, category_id, category:business_categories(name)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (user?.id) {
        query = query.or(`status.eq.published,owner_id.eq.${user.id}`);
      } else {
        query = query.eq("status", "published");
      }

      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        query = query.ilike("name", `%${trimmedSearch}%`);
      }

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      if (selectedState !== "all") {
        query = query.eq("state", selectedState);
      }

      if (selectedCity !== "all") {
        query = query.eq("city", selectedCity);
      }

      const { data, error: businessError } = await query;

      if (businessError) {
        setError("Firmalar yüklenirken bir hata oluştu.");
        setBusinesses([]);
        setRatings({});
        setLoading(false);
        return;
      }

      const rows = (data || []) as Business[];
      setBusinesses(rows);

      if (rows.length === 0) {
        setRatings({});
        setLoading(false);
        return;
      }

      const businessIds = rows.map((row) => row.id);
      const { data: reviewData } = await supabase
        .from("business_reviews")
        .select("business_id, rating")
        .in("business_id", businessIds);

      const nextRatings: RatingMap = {};
      (reviewData || []).forEach((review) => {
        const businessId = review.business_id as string;
        const rating = Number(review.rating || 0);

        if (!nextRatings[businessId]) {
          nextRatings[businessId] = { avg: 0, count: 0 };
        }

        nextRatings[businessId].avg += rating;
        nextRatings[businessId].count += 1;
      });

      Object.entries(nextRatings).forEach(([businessId, value]) => {
        nextRatings[businessId] = {
          avg: value.count > 0 ? Number((value.avg / value.count).toFixed(1)) : 0,
          count: value.count,
        };
      });

      setRatings(nextRatings);
      setLoading(false);
    };

    void fetchBusinesses();
  }, [search, selectedCategory, selectedState, selectedCity, user?.id]);

  const cityOptions = useMemo(() => {
    const uniqueCities = [...new Set(businesses.map((business) => business.city).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "tr"));

    return [
      { value: "all", label: "Tüm şehirler" },
      ...uniqueCities.map((city) => ({ value: city, label: city })),
    ];
  }, [businesses]);

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-ink)]">Firmalar</h1>
            <p className="text-sm text-[var(--color-ink-secondary)] mt-1">Türk topluluğundaki işletmeleri keşfedin.</p>
          </div>
          <Link href="/firmalar/yeni">
            <Button className="w-full sm:w-auto">
              <Plus size={16} /> Firma Ekle
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-4 md:p-6 space-y-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Firma adına göre ara"
              icon={<Search size={16} />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                options={[
                  { value: "all", label: "Tüm kategoriler" },
                  ...categories.map((category) => ({ value: category.id, label: category.name })),
                ]}
              />
              <Select value={selectedState} onChange={(event) => setSelectedState(event.target.value)} options={stateOptions} />
              <Select value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)} options={cityOptions} />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-sm text-[var(--color-ink-secondary)]">Firmalar yükleniyor...</p>
        ) : error ? (
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        ) : businesses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-[var(--color-ink-secondary)]">
              Filtrelerinize uygun firma bulunamadı.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {businesses.map((business) => {
              const rating = ratings[business.id] || { avg: 0, count: 0 };
              return (
                <Link key={business.id} href={`/firmalar/${business.slug}`}>
                  <Card variant="interactive" className="h-full">
                    <CardContent className="p-5 h-full flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-lg font-semibold text-[var(--color-ink)] line-clamp-2">{business.name}</h2>
                        {business.status !== "published" && (
                          <Badge variant="warning" size="sm">Taslak</Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-[var(--color-ink-secondary)]">
                        <div className="inline-flex items-center gap-2">
                          <Building2 size={15} />
                          <span>{business.category?.name || "Kategori yok"}</span>
                        </div>
                        <div className="inline-flex items-center gap-2">
                          <MapPin size={15} />
                          <span>{business.city}, {US_STATES_MAP[business.state] || business.state}</span>
                        </div>
                        <div className="inline-flex items-center gap-2">
                          <Star size={15} className="text-amber-500" />
                          <span>{rating.count > 0 ? `${rating.avg} / 5` : "Henüz puan yok"}</span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare size={14} /> {rating.count}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
