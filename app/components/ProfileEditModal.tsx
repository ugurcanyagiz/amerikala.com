"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Avatar } from "./ui/Avatar";
import {
  X,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  MapPin,
  FileText,
  Building
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
  
  // Form state
  const [username, setUsername] = useState(profile.username || "");
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [city, setCity] = useState(profile.city || "");
  const [state, setState] = useState(profile.state || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when profile changes
  useEffect(() => {
    setUsername(profile.username || "");
    setFullName(profile.full_name || "");
    setBio(profile.bio || "");
    setCity(profile.city || "");
    setState(profile.state || "");
    setAvatarUrl(profile.avatar_url || "");
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
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setStatus({ type: "success", message: "Fotoğraf yüklendi!" });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      setStatus({ type: "error", message: "Fotoğraf yüklenemedi: " + error.message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!username.trim()) {
      newErrors.username = "Kullanıcı adı gerekli";
    } else if (username.length < 3) {
      newErrors.username = "En az 3 karakter olmalı";
    } else if (username.length > 20) {
      newErrors.username = "En fazla 20 karakter olabilir";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Sadece harf, rakam ve alt çizgi kullanılabilir";
    }

    if (fullName && fullName.length > 50) {
      newErrors.fullName = "En fazla 50 karakter olabilir";
    }

    if (bio && bio.length > 500) {
      newErrors.bio = "En fazla 500 karakter olabilir";
    }

    if (city && city.length > 50) {
      newErrors.city = "En fazla 50 karakter olabilir";
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
          username: username.toLowerCase().trim(),
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          city: city.trim() || null,
          state: state || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) {
        if (error.code === "23505") {
          setErrors({ username: "Bu kullanıcı adı zaten alınmış" });
          throw new Error("Kullanıcı adı zaten kullanılıyor");
        }
        throw error;
      }

      setStatus({ type: "success", message: "Profil güncellendi!" });
      
      // Refresh profile data
      await onSave();
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error("Profile update error:", error);
      if (!status) {
        setStatus({ type: "error", message: error.message || "Profil güncellenemedi" });
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

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
                src={avatarUrl || undefined}
                fallback={fullName || username || "U"}
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

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Kullanıcı Adı <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="kullaniciadi"
                  className={`w-full pl-8 pr-4 py-2.5 rounded-lg border ${
                    errors.username 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-neutral-200 dark:border-neutral-700 focus:ring-red-500"
                  } bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 transition-colors`}
                  maxLength={20}
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
              <p className="text-xs text-neutral-500 mt-1">
                Sadece küçük harf, rakam ve alt çizgi
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Ad Soyad
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    errors.fullName 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-neutral-200 dark:border-neutral-700 focus:ring-red-500"
                  } bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 transition-colors`}
                  maxLength={50}
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
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
                  maxLength={500}
                />
              </div>
              <div className="flex justify-between mt-1">
                {errors.bio ? (
                  <p className="text-red-500 text-sm">{errors.bio}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-neutral-500">{bio.length}/500</span>
              </div>
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
