"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Textarea } from "@/app/components/ui/Textarea";
import { US_STATES } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type BusinessCategory = {
  id: string;
  name: string;
};

type FormState = {
  name: string;
  category_id: string;
  description: string;
  phone: string;
  website: string;
  city: string;
  state: string;
  address1: string;
  zip: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  category_id: "",
  description: "",
  phone: "",
  website: "",
  city: "",
  state: "",
  address1: "",
  zip: "",
};

export default function NewBusinessPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/firmalar/yeni");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error: categoriesError } = await supabase
        .from("business_categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (categoriesError) {
        setError("Kategoriler alınamadı.");
        return;
      }

      const rows = (data || []) as BusinessCategory[];
      setCategories(rows);
      if (rows.length > 0) {
        setForm((prev) => ({ ...prev, category_id: rows[0].id }));
      }
    };

    void fetchCategories();
  }, []);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const generateUniqueSlug = async (name: string) => {
    const base = slugify(name) || `firma-${Date.now()}`;

    for (let index = 0; index < 8; index += 1) {
      const candidate = index === 0 ? base : `${base}-${index + 1}`;
      const { data, error: slugError } = await supabase
        .from("businesses")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();

      if (slugError) {
        throw slugError;
      }

      if (!data) {
        return candidate;
      }
    }

    return `${base}-${Date.now()}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    if (!form.name.trim() || !form.city.trim() || !form.state || !form.description.trim()) {
      setError("Lütfen zorunlu alanları doldurun.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const slug = await generateUniqueSlug(form.name);

      const { data, error: insertError } = await supabase
        .from("businesses")
        .insert({
          name: form.name.trim(),
          category_id: form.category_id || null,
          description: form.description.trim(),
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          city: form.city.trim(),
          state: form.state,
          address1: form.address1.trim() || null,
          zip: form.zip.trim() || null,
          owner_id: user.id,
          status: "pending",
          slug,
        })
        .select("slug")
        .single();

      if (insertError) throw insertError;

      router.push(`/firmalar/${data.slug}`);
    } catch (submitError) {
      console.error("Business create error:", submitError);
      setError("Firma kaydedilirken bir sorun oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <div className="max-w-4xl mx-auto px-4 py-10 text-sm text-[var(--color-ink-secondary)]">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/firmalar">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-ink)]">Yeni Firma Ekle</h1>
            <p className="text-sm text-[var(--color-ink-secondary)]">Firma bilgilerini girin. İlan moderasyon sonrası yayınlanır.</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-5 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Firma adı *" value={form.name} onChange={(event) => setField("name", event.target.value)} required />

              <Select
                label="Kategori"
                value={form.category_id}
                onChange={(event) => setField("category_id", event.target.value)}
                options={categories.map((category) => ({ value: category.id, label: category.name }))}
              />

              <Textarea
                label="Açıklama *"
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                rows={5}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Telefon" value={form.phone} onChange={(event) => setField("phone", event.target.value)} />
                <Input label="Web sitesi" value={form.website} onChange={(event) => setField("website", event.target.value)} placeholder="https://" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Şehir *" value={form.city} onChange={(event) => setField("city", event.target.value)} required />
                <Select
                  label="Eyalet *"
                  value={form.state}
                  onChange={(event) => setField("state", event.target.value)}
                  options={[{ value: "", label: "Eyalet seçin" }, ...US_STATES]}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Adres" value={form.address1} onChange={(event) => setField("address1", event.target.value)} />
                <Input label="Posta kodu" value={form.zip} onChange={(event) => setField("zip", event.target.value)} />
              </div>

              {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

              <Button type="submit" loading={submitting} className="w-full sm:w-auto">
                Firmayı Kaydet
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
