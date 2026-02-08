"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { Button } from "./ui/Button";
import { Avatar } from "./ui/Avatar";
import {
  X,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  FileText,
  Building,
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Info
} from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onSave: () => Promise<void>;
}

const US_STATES = [
  { value: "", label: "Eyalet seçin..." },
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

export default function ProfileEditModal({ isOpen, onClose, profile, onSave }: ProfileEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state - İsim alanları kaldırıldı, sadece düzenlenebilir alanlar
  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [city, setCity] = useState(profile.city || "");
  const [state, setState] = useState(profile.state || "");
  const [profession, setProfession] = useState(profile.profession || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);
  const [showFullName, setShowFullName] = useState(profile.show_full_name ?? true);
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when profile changes
  useEffect(() => {
    setUsername(profile.username || "");
    setBio(profile.bio || "");
    setCity(profile.city || "");
    setState(profile.state || "");
    setProfession(profile.profession || "");
    setAvatarUrl(profile.avatar_url || "");
    setAvatarRefreshKey(0);
    setShowFullName(profile.show_full_name ?? true);
    setStatus(null);
    setErrors({});
  }, [profile, isOpen]);

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      setStatus({ type: "error", message: "Lütfen bir resim dosyası seçin" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus({ type: "error", message: "Dosya boyutu 5MB'dan küçük olmalı" });
      return;
    }

    setUploadingAvatar(true);
    setStatus(null);

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, cacheControl: "3600", contentType: file.type });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error("Fotoğraf URL'i alınamadı.");
      }

      setAvatarUrl(publicUrl);
      setAvatarRefreshKey(Date.now());
      setStatus({ type: "success", message: "Fotoğraf yüklendi!" });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      setStatus({ type: "error", message: "Fotoğraf yüklenemedi: " + error.message });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      newErrors.username = "Kullanıcı adı zorunludur";
    } else if (trimmedUsername.length < 3) {
      newErrors.username = "En az 3 karakter olmalı";
    } else if (trimmedUsername.length > 30) {
      newErrors.username = "En fazla 30 karakter olabilir";
    } else if (!/^[a-zA-Z0-9._-]+$/.test(trimmedUsername)) {
      newErrors.username = "Sadece harf, rakam, nokta, tire ve alt çizgi kullanın";
    }

    if (bio && bio.length > 160) {
      newErrors.bio = "En fazla 160 karakter olabilir";
    }

    if (city && city.length > 50) {
      newErrors.city = "En fazla 50 karakter olabilir";
    }

    if (profession && profession.length > 60) {
      newErrors.profession = "En fazla 60 karakter olabilir";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setStatus(null);

    try {
      const trimmedUsername = username.trim();
      const { error } = await supabase
        .from("profiles")
        .update({
          username: trimmedUsername,
          bio: bio.trim() || null,
          city: city.trim() || null,
          state: state || null,
          profession: profession.trim() || null,
          avatar_url: avatarUrl || null,
          show_full_name: showFullName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      setStatus({ type: "success", message: "Profil güncellendi!" });
      
      // Refresh profile data
      await onSave();
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error("Profile update error:", error);
      setStatus({ type: "error", message: error.message || "Profil güncellenemedi" });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Display name for avatar fallback
  const displayName = profile.full_name || profile.username || "U";
  const avatarPreview = avatarUrl
    ? `${avatarUrl}${avatarRefreshKey ? `?v=${avatarRefreshKey}` : ""}`
    : "/logo.png";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-bold">Profili Düzenle</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <Avatar
                src={avatarPreview}
                fallback={displayName}
                size="xl"
                className="h-24 w-24 text-2xl"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-neutral-500">
              Fotoğraf yüklemek için tıklayın
            </p>
          </div>

          {/* Name Display (Read-only) */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={16} className="text-neutral-400" />
              <span className="text-sm font-medium text-neutral-500">İsim Bilgileri</span>
            </div>
            <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
              {profile.full_name || "İsim belirtilmemiş"}
            </p>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
              <Info size={12} />
              İsim ve soyisim kayıt sırasında belirlenir ve değiştirilemez
            </p>
          </div>

          {/* Privacy Setting - Show/Hide Full Name */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {showFullName ? (
                  <Eye size={20} className="text-green-500" />
                ) : (
                  <EyeOff size={20} className="text-neutral-400" />
                )}
                <div>
                  <p className="font-medium">İsim Görünürlüğü</p>
                  <p className="text-sm text-neutral-500">
                    {showFullName ? "Herkes tam isminizi görebilir" : "Sadece kullanıcı adınız görünür"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFullName(!showFullName)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  showFullName ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-600"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    showFullName ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-500">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-8 pr-4 py-2.5 rounded-lg border ${
                    errors.username
                      ? "border-red-500 focus:ring-red-500"
                      : "border-neutral-200 dark:border-neutral-700 focus:ring-red-500"
                  } bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 transition-colors`}
                  maxLength={30}
                />
              </div>
              {errors.username ? (
                <p className="text-xs text-red-500 mt-1">{errors.username}</p>
              ) : (
                <p className="text-xs text-neutral-500 mt-1">Kullanıcı adınız profilinizde görünür.</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Bio
              </label>
              <div className="relative">
                <FileText size={18} className="absolute left-3 top-3 text-neutral-400" />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Kendinizi kısaca tanıtın..."
                  rows={3}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    errors.bio 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-neutral-200 dark:border-neutral-700 focus:ring-red-500"
                  } bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 transition-colors resize-none`}
                  maxLength={160}
                />
              </div>
              <div className="flex justify-between mt-1">
                {errors.bio ? (
                  <p className="text-red-500 text-sm">{errors.bio}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-neutral-500">{bio.length}/160</span>
              </div>
            </div>

            {/* Profession */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Meslek
              </label>
              <div className="relative">
                <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="örn: Ürün Tasarımcısı"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    errors.profession
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-neutral-200 dark:border-neutral-700 focus:ring-red-500"
                  } bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 transition-colors`}
                  maxLength={60}
                />
              </div>
              {errors.profession && (
                <p className="text-red-500 text-sm mt-1">{errors.profession}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Şehir
              </label>
              <div className="relative">
                <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="örn: New York City"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    errors.city 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-neutral-200 dark:border-neutral-700 focus:ring-red-500"
                  } bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 transition-colors`}
                  maxLength={50}
                />
              </div>
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Eyalet
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors appearance-none cursor-pointer"
                >
                  {US_STATES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {status && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                status.type === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="text-sm">{status.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            disabled={saving || uploadingAvatar}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              "Kaydet"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
