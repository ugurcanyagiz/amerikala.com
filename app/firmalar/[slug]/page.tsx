"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Textarea } from "@/app/components/ui/Textarea";
import { US_STATES_MAP } from "@/lib/types";
import { ArrowLeft, Globe, MapPin, MessageSquare, Phone, Star } from "lucide-react";

type Business = {
  id: string;
  owner_id: string;
  slug: string;
  status: string;
  name: string;
  description: string;
  phone: string | null;
  website: string | null;
  city: string;
  state: string;
  address1: string | null;
  zip: string | null;
  category?: { name: string | null } | null;
};

type Review = {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  content: string;
  created_at: string;
};

type ProfilePreview = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfilePreview>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  const myReview = useMemo(() => {
    if (!user) return null;
    return reviews.find((review) => review.user_id === user.id) || null;
  }, [reviews, user]);

  const fetchBusiness = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("businesses")
        .select("id, owner_id, slug, status, name, description, phone, website, city, state, address1, zip, category:business_categories(name)")
        .eq("slug", slug)
        .limit(1);

      if (user?.id) {
        query = query.or(`status.eq.published,owner_id.eq.${user.id}`);
      } else {
        query = query.eq("status", "published");
      }

      const { data, error: businessError } = await query.maybeSingle();
      if (businessError) throw businessError;

      if (!data) {
        setError("Firma bulunamadı veya görüntüleme yetkiniz yok.");
        setBusiness(null);
        setReviews([]);
        return;
      }

      const businessData = data as Business;
      setBusiness(businessData);

      const { data: reviewRows, error: reviewError } = await supabase
        .from("business_reviews")
        .select("id, business_id, user_id, rating, content, created_at")
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false });

      if (reviewError) throw reviewError;

      const reviewList = (reviewRows || []) as Review[];
      setReviews(reviewList);

      const userIds = [...new Set(reviewList.map((review) => review.user_id))];
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", userIds);

        const map = ((profileRows || []) as ProfilePreview[]).reduce<Record<string, ProfilePreview>>((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        setProfiles(map);
      } else {
        setProfiles({});
      }
    } catch (fetchError) {
      console.error("Business detail error:", fetchError);
      setError("Firma detayları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [slug, user?.id]);

  useEffect(() => {
    void fetchBusiness();
  }, [fetchBusiness]);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setContent(myReview.content || "");
    }
  }, [myReview]);

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, count: 0 };
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return { avg: Number((total / reviews.length).toFixed(1)), count: reviews.length };
  }, [reviews]);

  const handleReviewSubmit = async () => {
    if (!user || !business) {
      router.push(`/login?redirect=/firmalar/${slug}`);
      return;
    }

    if (!content.trim()) {
      alert("Lütfen yorumunuzu yazın.");
      return;
    }

    setSavingReview(true);
    try {
      const { error: reviewError } = await supabase.from("business_reviews").upsert(
        {
          business_id: business.id,
          user_id: user.id,
          rating,
          content: content.trim(),
        },
        { onConflict: "business_id,user_id" }
      );

      if (reviewError) throw reviewError;

      await fetchBusiness();
    } catch (submitError) {
      console.error("Review submit error:", submitError);
      alert("Yorum kaydedilemedi.");
    } finally {
      setSavingReview(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!user || !business) return;

    const { error: deleteError } = await supabase
      .from("business_reviews")
      .delete()
      .eq("business_id", business.id)
      .eq("user_id", user.id);

    if (deleteError) {
      alert("Yorum silinemedi.");
      return;
    }

    setContent("");
    setRating(5);
    await fetchBusiness();
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-8">Yükleniyor...</div>;
  }

  if (!business || error) {
    return <div className="max-w-5xl mx-auto px-4 py-8 text-[var(--color-error)]">{error || "Firma bulunamadı."}</div>;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/firmalar">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-ink)]">{business.name}</h1>
          {business.status !== "published" && <Badge variant="warning">Yayında değil</Badge>}
        </div>

        <Card>
          <CardContent className="p-5 md:p-6 space-y-3">
            <div className="flex flex-wrap gap-2 text-sm text-[var(--color-ink-secondary)]">
              <Badge variant="info">{business.category?.name || "Kategori yok"}</Badge>
              <span className="inline-flex items-center gap-1"><MapPin size={14} /> {business.city}, {US_STATES_MAP[business.state] || business.state}</span>
              {business.phone && <span className="inline-flex items-center gap-1"><Phone size={14} /> {business.phone}</span>}
              {business.website && <span className="inline-flex items-center gap-1"><Globe size={14} /> {business.website}</span>}
            </div>

            <p className="text-[var(--color-ink)] whitespace-pre-wrap">{business.description}</p>
            {(business.address1 || business.zip) && (
              <p className="text-sm text-[var(--color-ink-secondary)]">{business.address1} {business.zip}</p>
            )}

            <div className="inline-flex items-center gap-2 text-sm">
              <Star size={16} className="text-amber-500" />
              <span className="font-medium">{stats.count > 0 ? `${stats.avg} / 5` : "Henüz puan yok"}</span>
              <span className="text-[var(--color-ink-secondary)] inline-flex items-center gap-1"><MessageSquare size={14} /> {stats.count} yorum</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 md:p-6 space-y-4">
            <h2 className="text-lg font-semibold">Yorum Yaz</h2>

            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1"
                  aria-label={`${star} yıldız`}
                >
                  <Star size={22} className={star <= rating ? "text-amber-500 fill-amber-500" : "text-neutral-300"} />
                </button>
              ))}
            </div>

            <Textarea rows={4} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Deneyiminizi paylaşın" />

            <div className="flex gap-2">
              <Button onClick={handleReviewSubmit} loading={savingReview}>{myReview ? "Yorumu Güncelle" : "Yorum Gönder"}</Button>
              {myReview && (
                <Button variant="outline" onClick={handleReviewDelete}>Yorumu Sil</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Yorumlar</h2>
          {reviews.length === 0 ? (
            <Card><CardContent className="p-6 text-sm text-[var(--color-ink-secondary)]">Henüz yorum yapılmamış.</CardContent></Card>
          ) : (
            reviews.map((review) => {
              const profile = profiles[review.user_id];
              return (
                <Card key={review.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar src={profile?.avatar_url || undefined} fallback={(profile?.full_name || profile?.username || "?").slice(0, 1)} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{profile?.full_name || profile?.username || "Kullanıcı"}</p>
                          <p className="text-xs text-[var(--color-ink-secondary)]">{new Date(review.created_at).toLocaleDateString("tr-TR")}</p>
                        </div>
                      </div>
                      <Badge variant="warning">{review.rating} / 5</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{review.content}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
