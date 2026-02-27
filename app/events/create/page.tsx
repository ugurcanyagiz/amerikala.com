"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../../contexts/AuthContext";
import {
  EventCategory,
  EVENT_CATEGORY_LABELS,
  US_STATES
} from "@/lib/types";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  CheckCircle2,
  Globe,
  Loader2
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";

interface FormData {
  title: string;
  category: EventCategory;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  is_online: boolean;
  online_url: string;
  location_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  max_attendees: string;
  is_free: boolean;
  price: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "social",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    is_online: false,
    online_url: "",
    location_name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    max_attendees: "",
    is_free: true,
    price: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirect if not logged in
  if (!user) {
    router.push("/login");
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Başlık gerekli";
    } else if (formData.title.length < 5) {
      newErrors.title = "Başlık en az 5 karakter olmalı";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Açıklama gerekli";
    } else if (formData.description.length < 20) {
      newErrors.description = "Açıklama en az 20 karakter olmalı";
    }

    if (!formData.event_date) {
      newErrors.event_date = "Tarih gerekli";
    } else {
      const eventDate = new Date(formData.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        newErrors.event_date = "Geçmiş bir tarih seçilemez";
      }
    }

    if (!formData.start_time) {
      newErrors.start_time = "Başlangıç saati gerekli";
    }

    if (formData.is_online) {
      if (!formData.online_url.trim()) {
        newErrors.online_url = "Online etkinlik için link gerekli";
      }
    } else {
      if (!formData.location_name.trim()) {
        newErrors.location_name = "Mekan adı gerekli";
      }
      if (!formData.city.trim()) {
        newErrors.city = "Şehir gerekli";
      }
      if (!formData.state) {
        newErrors.state = "Eyalet gerekli";
      }
    }

    if (!formData.is_free && !formData.price) {
      newErrors.price = "Ücretli etkinlik için fiyat gerekli";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        event_date: formData.event_date,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        is_online: formData.is_online,
        online_url: formData.is_online ? formData.online_url.trim() : null,
        location_name: formData.is_online ? "Online" : formData.location_name.trim(),
        address: formData.is_online ? null : formData.address.trim() || null,
        city: formData.is_online ? "Online" : formData.city.trim(),
        state: formData.is_online ? "NA" : formData.state,
        zip_code: formData.is_online ? null : formData.zip_code.trim() || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        is_free: formData.is_free,
        price: formData.is_free ? null : parseFloat(formData.price),
        organizer_id: user.id,
        status: "pending",
        current_attendees: 0
      };

      const { data, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error("Error creating event:", error);
        setErrorMessage("Etkinlik oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
        return;
      }

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push("/events");
      }, 2000);
    } catch (err) {
      console.error("Error:", err);
      setErrorMessage("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center py-16">
            <Card variant="elevated" className="max-w-md w-full mx-4">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Etkinlik Oluşturuldu</h2>
                <p className="text-ink-muted mb-4">
                  Etkinliğiniz başarıyla oluşturuldu ve onay bekliyor.
                  Onaylandıktan sonra etkinlikler sayfasında görünecektir.
                </p>
                <Link href="/events">
                  <Button variant="primary" className="w-full">
                    Etkinliklere Dön
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/events">
              <Button variant="ghost" className="gap-2 mb-6">
                <ArrowLeft size={18} />
                Geri Dön
              </Button>
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Yeni Etkinlik Oluştur</h1>
              <p className="text-ink-muted">
                Toplulukla bir araya gelmek için etkinlik düzenle
              </p>
            </div>

            {errorMessage && (
              <Card variant="elevated" className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
                </CardContent>
              </Card>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Temel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <Input
                    label="Etkinlik Başlığı *"
                    placeholder="örn: NYC Turkish Coffee Meetup"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    error={errors.title}
                    maxLength={100}
                  />

                  <Select
                    label="Kategori *"
                    options={Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => ({
                      value,
                      label
                    }))}
                    value={formData.category}
                    onChange={(e) => updateField("category", e.target.value as EventCategory)}
                  />

                  <Textarea
                    label="Açıklama *"
                    placeholder="Etkinlik hakkında detaylı bilgi verin..."
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={6}
                    error={errors.description}
                    maxLength={2000}
                  />
                  <p className="text-xs text-ink-muted text-right">
                    {formData.description.length}/2000
                  </p>
                </CardContent>
              </Card>

              {/* Date & Time */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Tarih & Saat</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Input
                      label="Tarih *"
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => updateField("event_date", e.target.value)}
                      icon={<Calendar size={18} />}
                      error={errors.event_date}
                      min={new Date().toISOString().split("T")[0]}
                    />

                    <Input
                      label="Başlangıç Saati *"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => updateField("start_time", e.target.value)}
                      icon={<Clock size={18} />}
                      error={errors.start_time}
                    />

                    <Input
                      label="Bitiş Saati"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => updateField("end_time", e.target.value)}
                      icon={<Clock size={18} />}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Konum</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  {/* Online Toggle */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isOnline"
                      checked={formData.is_online}
                      onChange={(e) => updateField("is_online", e.target.checked)}
                      className="h-4 w-4 rounded border-border-default text-primary focus:ring-primary"
                    />
                    <label htmlFor="isOnline" className="text-sm font-medium flex items-center gap-2">
                      <Globe size={16} />
                      Bu online bir etkinlik
                    </label>
                  </div>

                  {formData.is_online ? (
                    <Input
                      label="Etkinlik Linki *"
                      placeholder="https://zoom.us/j/..."
                      value={formData.online_url}
                      onChange={(e) => updateField("online_url", e.target.value)}
                      icon={<Globe size={18} />}
                      error={errors.online_url}
                    />
                  ) : (
                    <>
                      <Input
                        label="Mekan Adı *"
                        placeholder="örn: Turkish Cultural Center"
                        value={formData.location_name}
                        onChange={(e) => updateField("location_name", e.target.value)}
                        icon={<MapPin size={18} />}
                        error={errors.location_name}
                      />

                      <Input
                        label="Adres"
                        placeholder="Sokak adresi"
                        value={formData.address}
                        onChange={(e) => updateField("address", e.target.value)}
                      />

                      <div className="grid md:grid-cols-3 gap-4">
                        <Input
                          label="Şehir *"
                          placeholder="örn: New York"
                          value={formData.city}
                          onChange={(e) => updateField("city", e.target.value)}
                          error={errors.city}
                        />

                        <Select
                          label="Eyalet *"
                          options={[
                            { value: "", label: "Seçin..." },
                            ...US_STATES.map(s => ({ value: s.value, label: s.label }))
                          ]}
                          value={formData.state}
                          onChange={(e) => updateField("state", e.target.value)}
                          error={errors.state}
                        />

                        <Input
                          label="ZIP Kodu"
                          placeholder="örn: 10017"
                          value={formData.zip_code}
                          onChange={(e) => updateField("zip_code", e.target.value)}
                          maxLength={10}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Capacity & Pricing */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Kapasite & Fiyatlandırma</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <Input
                    label="Maksimum Katılımcı"
                    type="number"
                    placeholder="Boş bırakılırsa sınırsız"
                    value={formData.max_attendees}
                    onChange={(e) => updateField("max_attendees", e.target.value)}
                    icon={<Users size={18} />}
                    min={1}
                    max={10000}
                  />

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isFree"
                      checked={formData.is_free}
                      onChange={(e) => updateField("is_free", e.target.checked)}
                      className="h-4 w-4 rounded border-border-default text-primary focus:ring-primary"
                    />
                    <label htmlFor="isFree" className="text-sm font-medium">
                      Bu ücretsiz bir etkinlik
                    </label>
                  </div>

                  {!formData.is_free && (
                    <Input
                      label="Fiyat (USD) *"
                      type="number"
                      placeholder="örn: 25"
                      value={formData.price}
                      onChange={(e) => updateField("price", e.target.value)}
                      icon={<DollarSign size={18} />}
                      error={errors.price}
                      min={0}
                      step={0.01}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Submit */}
              <Card variant="elevated" className="bg-primary-light border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Oluşturmadan önce kontrol edin:</p>
                      <ul className="list-disc list-inside space-y-1 text-ink-muted">
                        <li>Tüm gerekli alanlar dolduruldu mu?</li>
                        <li>Tarih ve saat bilgileri doğru mu?</li>
                        <li>Konum bilgisi net mi?</li>
                      </ul>
                      <p className="mt-2 text-ink-muted">
                        Etkinliğiniz moderatör onayından sonra yayınlanacaktır.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link href="/events" className="flex-1">
                      <Button variant="secondary" className="w-full" disabled={loading}>
                        İptal
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1"
                      loading={loading}
                      disabled={loading}
                    >
                      {loading ? "Oluşturuluyor..." : "Etkinliği Oluştur"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
