"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
  EventCategory,
  EVENT_CATEGORY_LABELS, 
  EVENT_CATEGORY_ICONS,
  US_STATES
} from "@/lib/types";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  DollarSign,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info
} from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("social");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState(profile?.state || "");
  const [zipCode, setZipCode] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUrl, setOnlineUrl] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/meetups/create");
    }
  }, [user, authLoading, router]);

  // Set default state from profile
  useEffect(() => {
    if (profile?.state) {
      setState(profile.state);
    }
  }, [profile]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Etkinlik başlığı gerekli";
    if (title.length > 100) newErrors.title = "Başlık en fazla 100 karakter olabilir";
    
    if (!description.trim()) newErrors.description = "Açıklama gerekli";
    if (description.length > 2000) newErrors.description = "Açıklama en fazla 2000 karakter olabilir";
    
    if (!eventDate) newErrors.eventDate = "Tarih seçimi gerekli";
    if (new Date(eventDate) < new Date(new Date().toDateString())) {
      newErrors.eventDate = "Geçmiş bir tarih seçemezsiniz";
    }
    
    if (!startTime) newErrors.startTime = "Başlangıç saati gerekli";
    
    if (!isOnline) {
      if (!locationName.trim()) newErrors.locationName = "Mekan adı gerekli";
      if (!city.trim()) newErrors.city = "Şehir gerekli";
      if (!state) newErrors.state = "Eyalet seçimi gerekli";
    } else {
      if (!onlineUrl.trim()) newErrors.onlineUrl = "Online etkinlik linki gerekli";
      if (onlineUrl && !onlineUrl.startsWith("http")) {
        newErrors.onlineUrl = "Geçerli bir URL girin (https://...)";
      }
    }

    if (!isFree && (!price || parseFloat(price) <= 0)) {
      newErrors.price = "Geçerli bir fiyat girin";
    }

    if (maxAttendees && parseInt(maxAttendees) < 1) {
      newErrors.maxAttendees = "En az 1 katılımcı olmalı";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) return;

    setSaving(true);
    setStatus(null);

    try {
      const { data, error } = await supabase
        .from("events")
        .insert({
          title: title.trim(),
          description: description.trim(),
          category,
          event_date: eventDate,
          start_time: startTime,
          end_time: endTime || null,
          location_name: isOnline ? "Online" : locationName.trim(),
          address: isOnline ? null : address.trim() || null,
          city: isOnline ? "Online" : city.trim(),
          state: isOnline ? "CA" : state, // Default state for online events
          zip_code: isOnline ? null : zipCode.trim() || null,
          is_online: isOnline,
          online_url: isOnline ? onlineUrl.trim() : null,
          max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
          is_free: isFree,
          price: isFree ? null : parseFloat(price),
          cover_image_url: coverImageUrl || null,
          organizer_id: user.id,
          created_by: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      setStatus({
        type: "success",
        message: "Etkinliğiniz oluşturuldu ve onay için gönderildi! Admin onayından sonra yayınlanacaktır."
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/meetups/my-events");
      }, 2000);

    } catch (error: any) {
      console.error("Error creating event:", error);
      setStatus({
        type: "error",
        message: error.message || "Etkinlik oluşturulurken bir hata oluştu"
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="ak-page">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/meetups">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Etkinlik Oluştur</h1>
            <p className="text-neutral-500">Toplulukla buluşma fırsatı yarat</p>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="glass mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Etkinlik Onay Süreci</p>
                <p>Oluşturduğunuz etkinlik admin onayından sonra yayınlanacaktır. Bu süreç genellikle 24 saat içinde tamamlanır.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Etkinlik Başlığı <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="örn: NYC Türk Kahvesi Buluşması"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={errors.title}
                  maxLength={100}
                />
                <p className="text-xs text-neutral-500 mt-1 text-right">{title.length}/100</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value as EventCategory)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        category === value
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{EVENT_CATEGORY_ICONS[value as EventCategory]}</span>
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Açıklama <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Etkinlik hakkında detaylı bilgi verin..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  error={errors.description}
                  maxLength={2000}
                />
                <p className="text-xs text-neutral-500 mt-1 text-right">{description.length}/2000</p>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar size={20} />
                Tarih ve Saat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Tarih <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    error={errors.eventDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Başlangıç <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    error={errors.startTime}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Bitiş <span className="text-neutral-400">(Opsiyonel)</span>
                  </label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin size={20} />
                Konum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Online Toggle */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="h-5 w-5 rounded border-neutral-300 text-red-500 focus:ring-red-500"
                />
                <label htmlFor="isOnline" className="flex items-center gap-2 cursor-pointer">
                  <Globe size={20} />
                  <span className="font-medium">Online Etkinlik</span>
                </label>
              </div>

              {isOnline ? (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Etkinlik Linki <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="https://zoom.us/j/..."
                    value={onlineUrl}
                    onChange={(e) => setOnlineUrl(e.target.value)}
                    error={errors.onlineUrl}
                    icon={<Globe size={18} />}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Zoom, Google Meet, Teams vb. link
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Mekan Adı <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="örn: Central Park, Starbucks Times Square"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      error={errors.locationName}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Adres <span className="text-neutral-400">(Opsiyonel)</span>
                    </label>
                    <Input
                      placeholder="Sokak, Numara"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Şehir <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="New York"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        error={errors.city}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Eyalet <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          errors.state 
                            ? "border-red-500" 
                            : "border-neutral-200 dark:border-neutral-700"
                        } bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-500`}
                      >
                        <option value="">Seçin...</option>
                        {US_STATES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Zip Code
                      </label>
                      <Input
                        placeholder="10001"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        maxLength={10}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Capacity & Price */}
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users size={20} />
                Kapasite ve Ücret
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Maksimum Katılımcı <span className="text-neutral-400">(Opsiyonel)</span>
                </label>
                <Input
                  type="number"
                  placeholder="Sınırsız için boş bırakın"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  min="1"
                  error={errors.maxAttendees}
                />
              </div>

              {/* Free Toggle */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="h-5 w-5 rounded border-neutral-300 text-red-500 focus:ring-red-500"
                />
                <label htmlFor="isFree" className="flex items-center gap-2 cursor-pointer">
                  <span className="font-medium">Ücretsiz Etkinlik</span>
                </label>
              </div>

              {!isFree && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Katılım Ücreti ($) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="25.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    icon={<DollarSign size={18} />}
                    error={errors.price}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon size={20} />
                Kapak Görseli
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Görsel URL <span className="text-neutral-400">(Opsiyonel)</span>
                </label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Görsel URL&apos;si girin veya boş bırakarak varsayılan görseli kullanın
                </p>
              </div>

              {coverImageUrl && (
                <div className="mt-4 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                  <img 
                    src={coverImageUrl} 
                    alt="Preview" 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Message */}
          {status && (
            <div
              className={`flex items-start gap-3 p-4 rounded-xl mb-6 ${
                status.type === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/meetups">
              <Button type="button" variant="ghost">
                İptal
              </Button>
            </Link>
            <Button 
              type="submit" 
              variant="primary"
              disabled={saving}
              className="min-w-[150px]"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                "Etkinlik Oluştur"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
