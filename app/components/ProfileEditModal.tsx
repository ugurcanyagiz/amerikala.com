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
  Lock,
  Info,
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
  const AVATAR_SIZE = 1080;
  const MIN_AVATAR_SIDE = 200;
  
  // Form state - İsim alanları kaldırıldı, sadece düzenlenebilir alanlar
  const [bio, setBio] = useState(profile.bio || "");
  const [city, setCity] = useState(profile.city || "");
  const [state, setState] = useState(profile.state || "");
  const [profession, setProfession] = useState(profile.profession || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [avatarVersion, setAvatarVersion] = useState(() => Date.now());
  const [accountIdentity, setAccountIdentity] = useState({
    fullName: profile.full_name || "",
    username: profile.username || "",
  });
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when profile changes
  useEffect(() => {
    setBio(profile.bio || "");
    setCity(profile.city || "");
    setState(profile.state || "");
    setProfession(profile.profession || "");
    setAvatarUrl(profile.avatar_url || "");
    setAvatarVersion(Date.now());
    setAccountIdentity({
      fullName: profile.full_name || "",
      username: profile.username || "",
    });
    setStatus(null);
    setErrors({});
  }, [profile, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const loadAuthIdentity = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;
      if (!authUser) return;

      const fullNameFromAuth =
        typeof authUser.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : "";
      const firstName = typeof authUser.user_metadata?.first_name === "string" ? authUser.user_metadata.first_name : "";
      const lastName = typeof authUser.user_metadata?.last_name === "string" ? authUser.user_metadata.last_name : "";
      const usernameFromAuth =
        typeof authUser.user_metadata?.username === "string" ? authUser.user_metadata.username : "";

      const mergedFullName = profile.full_name || fullNameFromAuth || [firstName, lastName].filter(Boolean).join(" ").trim();
      const mergedUsername = profile.username || usernameFromAuth;

      setAccountIdentity({
        fullName: mergedFullName,
        username: mergedUsername,
      });
    };

    loadAuthIdentity();
  }, [isOpen, profile.full_name, profile.username]);

  const loadImage = (file: File): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Fotoğraf okunamadı."));
      };
      image.src = objectUrl;
    });

  const processAvatarImage = async (file: File) => {
    const image = await loadImage(file);
    const minSide = Math.min(image.width, image.height);

    if (minSide < MIN_AVATAR_SIDE) {
      throw new Error("Fotoğraf en az 200x200 px olmalı.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Görsel işleme başlatılamadı.");
    }

    const cropX = (image.width - minSide) / 2;
    const cropY = (image.height - minSide) / 2;
    ctx.drawImage(image, cropX, cropY, minSide, minSide, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Fotoğraf dönüştürülemedi."));
        },
        "image/jpeg",
        0.9
      );
    });

    return blob;
  };

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
      const processedBlob = await processAvatarImage(file);

      // Create unique filename
      const fileName = `${profile.id}-${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, processedBlob, { upsert: true, cacheControl: "3600", contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error("Fotoğraf URL'i alınamadı.");
      }

      setAvatarUrl(publicUrl);
      setAvatarVersion(Date.now());
      setStatus({ type: "success", message: "Fotoğraf yüklendi!" });
    } catch (error: unknown) {
      console.error("Avatar upload error:", error);
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      setStatus({ type: "error", message: "Fotoğraf yüklenemedi: " + message });
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
      const { error } = await supabase
        .from("profiles")
        .update({
          bio: bio.trim() || null,
          city: city.trim() || null,
          state: state || null,
          profession: profession.trim() || null,
          avatar_url: avatarUrl || null,
          full_name: accountIdentity.fullName || profile.full_name || null,
          username: accountIdentity.username || profile.username || null,
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
    } catch (error: unknown) {
      console.error("Profile update error:", error);
      const message = error instanceof Error ? error.message : "Profil güncellenemedi";
      setStatus({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Display name for avatar fallback
  const displayName = profile.full_name || profile.username || "U";
  const avatarPreview = avatarUrl
    ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}t=${avatarVersion}`
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
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-neutral-500">
              1:1 oranında kırpılır, 1080×1080 px olarak yüklenir (JPG)
            </p>
          </div>

          {/* Name Display (Read-only) */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={16} className="text-neutral-400" />
              <span className="text-sm font-medium text-neutral-500">İsim Bilgileri</span>
            </div>
            <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
              {accountIdentity.fullName || "İsim belirtilmemiş"}
            </p>
            <p className="text-sm text-neutral-500 mt-1">@{accountIdentity.username || "kullanici"}</p>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
              <Info size={12} />
              İsim soyisim ve kullanıcı adı kayıt sırasında belirlenir, değiştirilemez.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
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
