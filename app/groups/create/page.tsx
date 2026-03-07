"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
  GroupCategory,
  GROUP_CATEGORY_LABELS, 
  GROUP_CATEGORY_ICONS,
  US_STATES
} from "@/lib/types";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Select } from "@/app/components/ui/Select";
import { 
  ArrowLeft,
  Users,
  MapPin,
  Globe,
  Lock,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  Shield
} from "lucide-react";
import { uploadImageToStorage } from "@/lib/supabase/imageUpload";

export default function CreateGroupPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GroupCategory>("social");
  const [city, setCity] = useState("");
  const [state, setState] = useState(profile?.state || "");
  const [isNationwide, setIsNationwide] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [applicationQuestion, setApplicationQuestion] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [avatarDragOver, setAvatarDragOver] = useState(false);
  const [coverDragOver, setCoverDragOver] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/groups/create");
    }
  }, [user, authLoading, router]);

  // Set default state from profile
  useEffect(() => {
    if (profile?.state) {
      setState(profile.state);
    }
  }, [profile]);

  const MAX_SIZE_MB = 8;

  const uploadSingleImage = async (
    file: File,
    folder: "avatar" | "cover"
  ): Promise<string> => {
    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Lütfen geçerli bir görsel dosyası seçin.");
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`Dosya boyutu ${MAX_SIZE_MB}MB sınırını aşıyor.`);
    }

    return uploadImageToStorage({
      file,
      folder: `groups/${folder}/${user.id}`,
    });
  };

  const handleAvatarFile = async (file: File | null) => {
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadSingleImage(file, "avatar");
      setAvatarUrl(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Avatar yüklenemedi";
      setStatus({ type: "error", message });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const handleCoverFile = async (file: File | null) => {
    if (!file) return;

    setUploadingCover(true);
    try {
      const url = await uploadSingleImage(file, "cover");
      setCoverImageUrl(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kapak görseli yüklenemedi";
      setStatus({ type: "error", message });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Grup adı gerekli";
    if (name.length < 3) newErrors.name = "Grup adı en az 3 karakter olmalı";
    if (name.length > 60) newErrors.name = "Grup adı en fazla 60 karakter olabilir";
    
    if (!description.trim()) newErrors.description = "Açıklama gerekli";
    if (description.length < 20) newErrors.description = "Açıklama en az 20 karakter olmalı";
    if (description.length > 1000) newErrors.description = "Açıklama en fazla 1000 karakter olabilir";
    
    if (!isNationwide) {
      if (!city.trim()) newErrors.city = "Şehir gerekli";
      if (!state) newErrors.state = "Eyalet seçimi gerekli";
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
        .from("groups")
        .insert({
          name: name.trim(),
          description: description.trim(),
          category,
          city: isNationwide ? null : city.trim(),
          state: isNationwide ? null : state,
          is_nationwide: isNationwide,
          avatar_url: avatarUrl || null,
          cover_image_url: coverImageUrl || null,
          is_private: isPrivate,
          requires_approval: isPrivate ? true : requiresApproval,
          created_by: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join as admin
      if (data) {
        await supabase
          .from("group_members")
          .insert({
            group_id: data.id,
            user_id: user.id,
            role: "admin",
            status: "approved"
          });
      }

      setStatus({
        type: "success",
        message: "Grubunuz oluşturuldu ve onay için gönderildi! Admin onayından sonra yayınlanacaktır."
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/groups/my-groups");
      }, 2000);

    } catch (error: unknown) {
      console.error("Error creating group:", error);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Grup oluşturulurken bir hata oluştu"
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="ak-page">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/groups">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Grup Oluştur</h1>
            <p className="text-neutral-500">Topluluğunu bir araya getir</p>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="glass mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Grup Onay Süreci</p>
                <p>Oluşturduğunuz grup admin onayından sonra yayınlanacaktır. Bu süreç genellikle 24 saat içinde tamamlanır.</p>
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Grup Adı <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="örn: NYC Türk Yazılımcılar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  maxLength={60}
                />
                <p className="text-xs text-neutral-500 mt-1 text-right">{name.length}/60</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(GROUP_CATEGORY_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value as GroupCategory)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        category === value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                          : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      <span className="text-xl block mb-1">{GROUP_CATEGORY_ICONS[value as GroupCategory]}</span>
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
                  placeholder="Grubunuz ne hakkında? Kimler katılmalı?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  error={errors.description}
                  maxLength={1000}
                />
                <p className="text-xs text-neutral-500 mt-1 text-right">{description.length}/1000</p>
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
              {/* Nationwide Toggle */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <input
                  type="checkbox"
                  id="isNationwide"
                  checked={isNationwide}
                  onChange={(e) => setIsNationwide(e.target.checked)}
                  className="h-5 w-5 rounded border-neutral-300 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="isNationwide" className="flex items-center gap-2 cursor-pointer">
                  <Globe size={20} />
                  <span className="font-medium">ABD Geneli Grup</span>
                </label>
              </div>

              {!isNationwide && (
                <div className="grid sm:grid-cols-2 gap-4">
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
                    <Select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      options={[{ value: "", label: "Seçin..." }, ...US_STATES]}
                      error={errors.state}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield size={20} />
                Gizlilik Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Private Group */}
              <div className="flex items-start gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsPrivate(checked);
                    if (checked) setRequiresApproval(true);
                  }}
                  className="h-5 w-5 mt-0.5 rounded border-neutral-300 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="isPrivate" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <Lock size={18} />
                    Özel Grup
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">
                    Sadece üyeler grup içeriğini görebilir. Gönderiler ve üye listesi gizlidir.
                  </p>
                </label>
              </div>

              {/* Requires Approval */}
              <div className="flex items-start gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  disabled={isPrivate}
                  className="h-5 w-5 mt-0.5 rounded border-neutral-300 text-blue-500 focus:ring-blue-500 disabled:opacity-50"
                />
                <label htmlFor="requiresApproval" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <Users size={18} />
                    Üyelik Onayı Gerekli
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">
                    Yeni üyeler gruba katılmadan önce yönetici onayı gerekir. Özel gruplarda bu ayar zorunlu olur.
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Membership Question */}
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Başvuru Sorusu (Opsiyonel)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Örn: Bu gruba neden katılmak istiyorsunuz?"
                value={applicationQuestion}
                onChange={(e) => setApplicationQuestion(e.target.value)}
                rows={3}
                maxLength={240}
              />
              <p className="text-xs text-neutral-500 mt-1 text-right">{applicationQuestion.length}/240</p>
              <p className="text-xs text-neutral-500 mt-2">
                Üyelik onayı aktif olduğunda, katılmak isteyenlere bu soru gösterilir.
              </p>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon size={20} />
                Görseller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Avatar <span className="text-neutral-400">(Opsiyonel)</span>
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setAvatarDragOver(true);
                  }}
                  onDragLeave={() => setAvatarDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setAvatarDragOver(false);
                    handleAvatarFile(e.dataTransfer.files?.[0] || null);
                  }}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    avatarDragOver
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAvatarFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                    Avatar görselini sürükleyin veya seçin
                  </p>
                  <Button type="button" variant="secondary" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                    {uploadingAvatar ? "Yükleniyor..." : "Avatar Seç"}
                  </Button>
                  <p className="text-xs text-neutral-500 mt-2">Kare format önerilir (örn: 200x200)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Kapak Görseli <span className="text-neutral-400">(Opsiyonel)</span>
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setCoverDragOver(true);
                  }}
                  onDragLeave={() => setCoverDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setCoverDragOver(false);
                    handleCoverFile(e.dataTransfer.files?.[0] || null);
                  }}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    coverDragOver
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleCoverFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                    Kapak görselini sürükleyin veya seçin
                  </p>
                  <Button type="button" variant="secondary" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>
                    {uploadingCover ? "Yükleniyor..." : "Kapak Görseli Seç"}
                  </Button>
                  <p className="text-xs text-neutral-500 mt-2">Geniş format önerilir (örn: 1200x400)</p>
                </div>
              </div>

              {/* Preview */}
              {(avatarUrl || coverImageUrl) && (
                <div className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                  <p className="text-sm font-medium mb-3">Önizleme</p>
                  <div className="relative h-24 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
                    {coverImageUrl && (
                      <img 
                        src={coverImageUrl} 
                        alt="Cover Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {avatarUrl && (
                      <div className="absolute -bottom-4 left-4 w-12 h-12 rounded-lg bg-white dark:bg-neutral-900 shadow-lg overflow-hidden ring-2 ring-white dark:ring-neutral-900">
                        <img 
                          src={avatarUrl} 
                          alt="Avatar Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
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
            <Link href="/groups">
              <Button type="button" variant="ghost">
                İptal
              </Button>
            </Link>
            <Button 
              type="submit" 
              variant="primary"
              disabled={saving || uploadingAvatar || uploadingCover}
              className="min-w-[150px]"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                "Grup Oluştur"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
