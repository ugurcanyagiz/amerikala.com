"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  MarketplaceCategory,
  MarketplaceCondition,
  MARKETPLACE_CATEGORY_LABELS,
  MARKETPLACE_CATEGORY_ICONS,
  MARKETPLACE_CONDITION_LABELS,
  US_STATES,
} from "@/lib/types";
import Sidebar from "@/app/components/Sidebar";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import {
  ArrowLeft,
  ShoppingBag,
  Package,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";

interface FormData {
  title: string;
  description: string;
  category: MarketplaceCategory;
  condition: MarketplaceCondition;
  price: string;
  is_negotiable: boolean;
  city: string;
  state: string;
  images: string[];
  contact_phone: string;
  contact_email: string;
}

const initialFormData: FormData = {
  title: "",
  description: "",
  category: "diger",
  condition: "good",
  price: "",
  is_negotiable: false,
  city: "",
  state: "",
  images: [],
  contact_phone: "",
  contact_email: "",
};

export default function AlisverisIlanVerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/alisveris/ilan-ver");
    }
  }, [user, authLoading, router]);

  // Pre-fill email
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, contact_email: user.email || "" }));
    }
  }, [user?.email]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const addImage = () => {
    if (newImageUrl && !formData.images.includes(newImageUrl)) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, newImageUrl],
      }));
      setNewImageUrl("");
    }
  };

  const removeImage = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== url),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title || formData.title.length < 5) {
      newErrors.title = "Başlık en az 5 karakter olmalı";
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Geçerli bir fiyat giriniz";
    }
    if (!formData.city) {
      newErrors.city = "Şehir zorunludur";
    }
    if (!formData.state) {
      newErrors.state = "Eyalet seçiniz";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user) return;

    setSubmitting(true);
    try {
      const listingData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        condition: formData.condition,
        price: parseFloat(formData.price),
        is_negotiable: formData.is_negotiable,
        city: formData.city,
        state: formData.state,
        images: formData.images,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        user_id: user.id,
        status: "approved",
      };

      const { error } = await supabase
        .from("marketplace_listings")
        .insert(listingData);

      if (error) throw error;

      router.push("/alisveris/ilanlarim?success=true");
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("İlan oluşturulurken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link href="/alisveris">
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="text-orange-500" />
                  Alışveriş İlanı Ver
                </h1>
                <p className="text-neutral-500">Ürün veya hizmetinizi satışa çıkarın</p>
              </div>
            </div>

            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">Kategori</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {Object.entries(MARKETPLACE_CATEGORY_LABELS).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange("category", value)}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          formData.category === value
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-orange-300"
                        }`}
                      >
                        <span className="text-xl block mb-1">
                          {MARKETPLACE_CATEGORY_ICONS[value as MarketplaceCategory]}
                        </span>
                        <span className="text-xs">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    İlan Başlığı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Örn: iPhone 14 Pro Max - 256GB"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.title ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                    } bg-white dark:bg-neutral-900`}
                    maxLength={100}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Ürün hakkında detaylı bilgi..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                    maxLength={2000}
                  />
                </div>

                {/* Condition & Price */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Durumu</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => handleChange("condition", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                    >
                      {Object.entries(MARKETPLACE_CONDITION_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Fiyat <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                        placeholder="0"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                          errors.price ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                        } bg-white dark:bg-neutral-900`}
                      />
                    </div>
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>
                </div>

                {/* Negotiable */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="negotiable"
                    checked={formData.is_negotiable}
                    onChange={(e) => handleChange("is_negotiable", e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="negotiable" className="font-medium">
                    Fiyat pazarlığa açık
                  </label>
                </div>

                {/* Location */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Şehir <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="Örn: New York"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.city ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                      } bg-white dark:bg-neutral-900`}
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Eyalet <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.state ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                      } bg-white dark:bg-neutral-900`}
                    >
                      <option value="">Eyalet Seçin</option>
                      {US_STATES.map((state) => (
                        <option key={state.value} value={state.value}>{state.label}</option>
                      ))}
                    </select>
                    {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium mb-2">Fotoğraflar</label>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Fotoğraf URL'si yapıştırın"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                    />
                    <Button type="button" variant="outline" onClick={addImage} disabled={!newImageUrl}>
                      <Plus size={18} />
                    </Button>
                  </div>

                  {formData.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formData.images.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                          <img src={url} alt={`Fotoğraf ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(url)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
                              Kapak
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-8 text-center">
                      <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500">Henüz fotoğraf eklenmedi</p>
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 space-y-4">
                  <h3 className="font-semibold">İletişim Bilgileri</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">E-posta</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                        <input
                          type="email"
                          value={formData.contact_email}
                          onChange={(e) => handleChange("contact_email", e.target.value)}
                          placeholder="ornek@email.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Telefon</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                        <input
                          type="tel"
                          value={formData.contact_phone}
                          onChange={(e) => handleChange("contact_phone", e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notice */}
                <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-start gap-3">
                  <Sparkles className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-orange-800 dark:text-orange-300">Yayınlamaya Hazır</p>
                    <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                      İlanınız hemen yayınlanacak ve diğer kullanıcılar tarafından görülebilecek.
                    </p>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Link href="/alisveris">
                    <Button variant="ghost">İptal</Button>
                  </Link>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="gap-2 bg-orange-500 hover:bg-orange-600"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        İlanı Yayınla
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
