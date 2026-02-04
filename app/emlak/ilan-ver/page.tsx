"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  ListingType,
  RoommateType,
  PropertyType,
  LISTING_TYPE_LABELS,
  LISTING_TYPE_ICONS,
  ROOMMATE_TYPE_LABELS,
  ROOMMATE_TYPE_ICONS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_ICONS,
  AMENITIES_LIST,
  PET_POLICY_OPTIONS,
  PARKING_OPTIONS,
  LAUNDRY_OPTIONS,
  LEASE_TERM_OPTIONS,
  GENDER_PREFERENCE_OPTIONS,
  US_STATES,
} from "@/lib/types";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Building2,
  Users,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Square,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Info,
  X,
  Plus,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  // Step 1 - Type
  listing_type: ListingType | "";
  roommate_type: RoommateType | "";
  
  // Step 2 - Basic Info
  title: string;
  description: string;
  property_type: PropertyType | "";
  
  // Step 3 - Details
  bedrooms: number;
  bathrooms: number;
  sqft: string;
  price: string;
  deposit: string;
  utilities_included: boolean;
  available_date: string;
  lease_term: string;
  pet_policy: string;
  parking: string;
  laundry: string;
  amenities: string[];
  
  // Roommate specific
  current_occupants: number;
  preferred_gender: string;
  preferred_age_min: string;
  preferred_age_max: string;
  move_in_date: string;
  
  // Step 4 - Location
  address: string;
  city: string;
  state: string;
  zip_code: string;
  neighborhood: string;
  
  // Step 5 - Images & Contact
  images: string[];
  show_phone: boolean;
  show_email: boolean;
  contact_phone: string;
  contact_email: string;
}

const initialFormData: FormData = {
  listing_type: "",
  roommate_type: "",
  title: "",
  description: "",
  property_type: "",
  bedrooms: 1,
  bathrooms: 1,
  sqft: "",
  price: "",
  deposit: "",
  utilities_included: false,
  available_date: "",
  lease_term: "",
  pet_policy: "",
  parking: "",
  laundry: "",
  amenities: [],
  current_occupants: 1,
  preferred_gender: "any",
  preferred_age_min: "",
  preferred_age_max: "",
  move_in_date: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  neighborhood: "",
  images: [],
  show_phone: false,
  show_email: true,
  contact_phone: "",
  contact_email: "",
};

export default function IlanVerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Pre-fill type from URL
  useEffect(() => {
    const type = searchParams.get("type");
    if (type && ["rent", "sale", "roommate"].includes(type)) {
      setFormData(prev => ({ ...prev, listing_type: type as ListingType }));
    }
  }, [searchParams]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/emlak/ilan-ver");
    }
  }, [user, authLoading, router]);

  // Pre-fill email
    useEffect(() => {
        const email = user?.email;
        if (email) {
            setFormData(prev => ({ ...prev, contact_email: email }));
        }
    }, [user?.email]);

  // Validate step
  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    switch (currentStep) {
      case 1:
        if (!formData.listing_type) {
          newErrors.listing_type = "İlan türü seçiniz";
        }
        if (formData.listing_type === "roommate" && !formData.roommate_type) {
          newErrors.roommate_type = "Alt kategori seçiniz";
        }
        break;

      case 2:
        if (!formData.title || formData.title.length < 10) {
          newErrors.title = "Başlık en az 10 karakter olmalı";
        }
        if (!formData.description || formData.description.length < 50) {
          newErrors.description = "Açıklama en az 50 karakter olmalı";
        }
        if (!formData.property_type) {
          newErrors.property_type = "Emlak tipi seçiniz";
        }
        break;

      case 3:
        if (!formData.price || parseInt(formData.price) <= 0) {
          newErrors.price = "Geçerli bir fiyat giriniz";
        }
        break;

      case 4:
        if (!formData.address) {
          newErrors.address = "Adres zorunludur";
        }
        if (!formData.city) {
          newErrors.city = "Şehir zorunludur";
        }
        if (!formData.state) {
          newErrors.state = "Eyalet seçiniz";
        }
        break;

      case 5:
        if (formData.show_phone && !formData.contact_phone) {
          newErrors.contact_phone = "Telefon numarası giriniz";
        }
        if (formData.show_email && !formData.contact_email) {
          newErrors.contact_email = "E-posta adresi giriniz";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate steps
  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 5) as Step);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  // Handle form change
  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Toggle amenity
  const toggleAmenity = (value: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(value)
        ? prev.amenities.filter(a => a !== value)
        : [...prev.amenities, value]
    }));
  };

  // Add image
  const addImage = () => {
    if (newImageUrl && !formData.images.includes(newImageUrl)) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl]
      }));
      setNewImageUrl("");
    }
  };

  // Remove image
  const removeImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== url)
    }));
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    if (!user) return;

    setSubmitting(true);
    try {
      const listingData = {
        listing_type: formData.listing_type,
        roommate_type: formData.listing_type === "roommate" ? formData.roommate_type : null,
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        sqft: formData.sqft ? parseInt(formData.sqft) : null,
        price: parseFloat(formData.price),
        deposit: formData.deposit ? parseFloat(formData.deposit) : null,
        utilities_included: formData.utilities_included,
        available_date: formData.available_date || null,
        lease_term: formData.lease_term || null,
        pet_policy: formData.pet_policy || null,
        parking: formData.parking || null,
        laundry: formData.laundry || null,
        amenities: formData.amenities,
        current_occupants: formData.listing_type === "roommate" ? formData.current_occupants : 0,
        preferred_gender: formData.listing_type === "roommate" ? formData.preferred_gender : null,
        preferred_age_min: formData.preferred_age_min ? parseInt(formData.preferred_age_min) : null,
        preferred_age_max: formData.preferred_age_max ? parseInt(formData.preferred_age_max) : null,
        move_in_date: formData.move_in_date || null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code || null,
        neighborhood: formData.neighborhood || null,
        images: formData.images,
        show_phone: formData.show_phone,
        show_email: formData.show_email,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        user_id: user.id,
        status: "approved",
      };

      const { data, error } = await supabase
        .from("listings")
        .insert(listingData)
        .select()
        .single();

      if (error) throw error;

      alert("İlanınız başarıyla oluşturuldu!");
      router.push("/emlak");
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("İlan oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/emlak">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Emlak İlanı Ver</h1>
            <p className="text-neutral-500">Ücretsiz ilan verin, hızlıca kiraya verin veya satın</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    s < step
                      ? "bg-emerald-500 text-white"
                      : s === step
                      ? "bg-emerald-500 text-white ring-4 ring-emerald-500/30"
                      : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500"
                  }`}
                >
                  {s < step ? <Check size={20} /> : s}
                </div>
                {s < 5 && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      s < step ? "bg-emerald-500" : "bg-neutral-200 dark:bg-neutral-700"
                    }`}
                    style={{ width: "60px" }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-neutral-500">
            <span>İlan Türü</span>
            <span>Detaylar</span>
            <span>Özellikler</span>
            <span>Konum</span>
            <span>Görseller</span>
          </div>
        </div>

        {/* Form Steps */}
        <Card className="glass">
          <CardContent className="p-6">
            {/* Step 1: Type Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">İlan Türünü Seçin</h2>
                  <p className="text-neutral-500">Ne tür bir ilan vermek istiyorsunuz?</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {/* Kiralık */}
                  <button
                    type="button"
                    onClick={() => handleChange("listing_type", "rent")}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      formData.listing_type === "rent"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                      <Home className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-lg">Kiralık</h3>
                    <p className="text-sm text-neutral-500 mt-1">Evinizi kiraya verin</p>
                    {formData.listing_type === "rent" && (
                      <Check className="mt-3 text-blue-500" size={20} />
                    )}
                  </button>

                  {/* Satılık */}
                  <button
                    type="button"
                    onClick={() => handleChange("listing_type", "sale")}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      formData.listing_type === "sale"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                      <Building2 className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="font-bold text-lg">Satılık</h3>
                    <p className="text-sm text-neutral-500 mt-1">Gayrimenkulünüzü satın</p>
                    {formData.listing_type === "sale" && (
                      <Check className="mt-3 text-green-500" size={20} />
                    )}
                  </button>

                  {/* Ev Arkadaşı */}
                  <button
                    type="button"
                    onClick={() => handleChange("listing_type", "roommate")}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      formData.listing_type === "roommate"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                      <Users className="w-7 h-7 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-lg">Ev Arkadaşı</h3>
                    <p className="text-sm text-neutral-500 mt-1">Ev arkadaşı bulun</p>
                    {formData.listing_type === "roommate" && (
                      <Check className="mt-3 text-purple-500" size={20} />
                    )}
                  </button>
                </div>

                {errors.listing_type && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.listing_type}
                  </p>
                )}

                {/* Roommate Sub-type */}
                {formData.listing_type === "roommate" && (
                  <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                    <h3 className="font-semibold mb-4">Alt Kategori Seçin</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleChange("roommate_type", "looking_for_room")}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          formData.roommate_type === "looking_for_room"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        <span className="text-2xl">🔍</span>
                        <h4 className="font-bold mt-2">Ev Arıyorum</h4>
                        <p className="text-sm text-neutral-500">Taşınacak bir oda/ev arıyorum</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChange("roommate_type", "looking_for_roommate")}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          formData.roommate_type === "looking_for_roommate"
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        <span className="text-2xl">🙋</span>
                        <h4 className="font-bold mt-2">Ev Arkadaşı Arıyorum</h4>
                        <p className="text-sm text-neutral-500">Evime bir arkadaş arıyorum</p>
                      </button>
                    </div>
                    {errors.roommate_type && (
                      <p className="text-red-500 text-sm flex items-center gap-1 mt-2">
                        <AlertCircle size={14} />
                        {errors.roommate_type}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">Temel Bilgiler</h2>
                  <p className="text-neutral-500">İlanınızın detaylarını girin</p>
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
                    placeholder="örn: Manhattan'da güzel stüdyo daire"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.title ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                    } bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                    maxLength={100}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.title ? (
                      <p className="text-red-500 text-sm">{errors.title}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-neutral-500">{formData.title.length}/100</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Açıklama <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="İlanınızı detaylı bir şekilde açıklayın..."
                    rows={5}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.description ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                    } bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none`}
                    maxLength={2000}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.description ? (
                      <p className="text-red-500 text-sm">{errors.description}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-neutral-500">{formData.description.length}/2000</span>
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Emlak Tipi <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange("property_type", value)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          formData.property_type === value
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        <span className="text-xl">{PROPERTY_TYPE_ICONS[value as PropertyType]}</span>
                        <p className="text-sm font-medium mt-1">{label}</p>
                      </button>
                    ))}
                  </div>
                  {errors.property_type && (
                    <p className="text-red-500 text-sm flex items-center gap-1 mt-2">
                      <AlertCircle size={14} />
                      {errors.property_type}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">Özellikler ve Fiyat</h2>
                  <p className="text-neutral-500">Mülkün özelliklerini belirtin</p>
                </div>

                {/* Room & Bath */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Yatak Odası</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleChange("bedrooms", Math.max(0, formData.bedrooms - 1))}
                        className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center text-lg font-bold">{formData.bedrooms}</span>
                      <button
                        type="button"
                        onClick={() => handleChange("bedrooms", formData.bedrooms + 1)}
                        className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Banyo</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleChange("bathrooms", Math.max(0.5, formData.bathrooms - 0.5))}
                        className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center text-lg font-bold">{formData.bathrooms}</span>
                      <button
                        type="button"
                        onClick={() => handleChange("bathrooms", formData.bathrooms + 0.5)}
                        className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Alan (sqft)</label>
                    <input
                      type="number"
                      value={formData.sqft}
                      onChange={(e) => handleChange("sqft", e.target.value)}
                      placeholder="örn: 750"
                      className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Price */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {formData.listing_type === "sale" ? "Satış Fiyatı" : "Aylık Kira"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                        placeholder="0"
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                          errors.price ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                        } bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                    )}
                  </div>

                  {formData.listing_type === "rent" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Depozito</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                        <input
                          type="number"
                          value={formData.deposit}
                          onChange={(e) => handleChange("deposit", e.target.value)}
                          placeholder="0"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Utilities Included */}
                {formData.listing_type === "rent" && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                    <input
                      type="checkbox"
                      id="utilities"
                      checked={formData.utilities_included}
                      onChange={(e) => handleChange("utilities_included", e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <label htmlFor="utilities" className="font-medium">
                      Faturalar kiraya dahil
                    </label>
                  </div>
                )}

                {/* Additional Options */}
                {formData.listing_type !== "sale" && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Müsaitlik Tarihi</label>
                      <input
                        type="date"
                        value={formData.available_date}
                        onChange={(e) => handleChange("available_date", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Kira Süresi</label>
                      <select
                        value={formData.lease_term}
                        onChange={(e) => handleChange("lease_term", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Seçiniz</option>
                        {LEASE_TERM_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* More Options */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Evcil Hayvan</label>
                    <select
                      value={formData.pet_policy}
                      onChange={(e) => handleChange("pet_policy", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Seçiniz</option>
                      {PET_POLICY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Otopark</label>
                    <select
                      value={formData.parking}
                      onChange={(e) => handleChange("parking", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Seçiniz</option>
                      {PARKING_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Çamaşırhane</label>
                    <select
                      value={formData.laundry}
                      onChange={(e) => handleChange("laundry", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Seçiniz</option>
                      {LAUNDRY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Roommate Specific */}
                {formData.listing_type === "roommate" && (
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users size={18} className="text-purple-500" />
                      Ev Arkadaşı Tercihleri
                    </h3>
                    
                    <div className="grid sm:grid-cols-3 gap-4">
                      {formData.roommate_type === "looking_for_roommate" && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Mevcut Kişi Sayısı</label>
                          <input
                            type="number"
                            value={formData.current_occupants}
                            onChange={(e) => handleChange("current_occupants", parseInt(e.target.value) || 0)}
                            min={0}
                            className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium mb-2">Cinsiyet Tercihi</label>
                        <select
                          value={formData.preferred_gender}
                          onChange={(e) => handleChange("preferred_gender", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {GENDER_PREFERENCE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Taşınma Tarihi</label>
                        <input
                          type="date"
                          value={formData.move_in_date}
                          onChange={(e) => handleChange("move_in_date", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium mb-3">Olanaklar</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AMENITIES_LIST.map(amenity => (
                      <button
                        key={amenity.value}
                        type="button"
                        onClick={() => toggleAmenity(amenity.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                          formData.amenities.includes(amenity.value)
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        <span>{amenity.icon}</span>
                        <span className="text-sm">{amenity.label}</span>
                        {formData.amenities.includes(amenity.value) && (
                          <Check size={16} className="ml-auto text-emerald-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Location */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">Konum Bilgileri</h2>
                  <p className="text-neutral-500">Mülkün adresini girin</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Adres <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-neutral-400" size={20} />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      placeholder="Sokak adresi"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                        errors.address ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                      } bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                    />
                  </div>
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Şehir <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="örn: New York"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.city ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                      } bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
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
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.state ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                      } bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                    >
                      <option value="">Eyalet Seçin</option>
                      {US_STATES.map(state => (
                        <option key={state.value} value={state.value}>{state.label}</option>
                      ))}
                    </select>
                    {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Posta Kodu</label>
                    <input
                      type="text"
                      value={formData.zip_code}
                      onChange={(e) => handleChange("zip_code", e.target.value)}
                      placeholder="örn: 10001"
                      className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Mahalle</label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) => handleChange("neighborhood", e.target.value)}
                      placeholder="örn: Upper East Side"
                      className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-start gap-3">
                  <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Tam adresiniz yalnızca onayladığınız kişilerle paylaşılır. İlk görüşmede genel konum bilgisi gösterilir.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Images & Contact */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">Görseller ve İletişim</h2>
                  <p className="text-neutral-500">Fotoğraf ekleyin ve iletişim tercihlerinizi belirleyin</p>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fotoğraflar
                    <span className="text-neutral-500 font-normal ml-2">(URL olarak ekleyin)</span>
                  </label>
                  
                  <div className="flex gap-2 mb-4">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Fotoğraf URL'si yapıştırın"
                      className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Button type="button" variant="outline" onClick={addImage} disabled={!newImageUrl}>
                      <Plus size={18} />
                    </Button>
                  </div>

                  {/* Image Preview Grid */}
                  {formData.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formData.images.map((url, idx) => (
                        <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
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
                    <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg p-8 text-center">
                      <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500">Henüz fotoğraf eklenmedi</p>
                      <p className="text-sm text-neutral-400 mt-1">Fotoğraf URL'lerini yukarıya yapıştırın</p>
                    </div>
                  )}
                </div>

                {/* Contact Preferences */}
                <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800 space-y-4">
                  <h3 className="font-semibold">İletişim Tercihleri</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="show_email"
                        checked={formData.show_email}
                        onChange={(e) => handleChange("show_email", e.target.checked)}
                        className="w-5 h-5 rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <label htmlFor="show_email" className="flex items-center gap-2">
                        <Mail size={18} className="text-neutral-500" />
                        E-posta adresimi göster
                      </label>
                    </div>

                    {formData.show_email && (
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => handleChange("contact_email", e.target.value)}
                        placeholder="E-posta adresi"
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          errors.contact_email ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                        } bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      />
                    )}

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="show_phone"
                        checked={formData.show_phone}
                        onChange={(e) => handleChange("show_phone", e.target.checked)}
                        className="w-5 h-5 rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <label htmlFor="show_phone" className="flex items-center gap-2">
                        <Phone size={18} className="text-neutral-500" />
                        Telefon numaramı göster
                      </label>
                    </div>

                    {formData.show_phone && (
                      <input
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => handleChange("contact_phone", e.target.value)}
                        placeholder="(xxx) xxx-xxxx"
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          errors.contact_phone ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                        } bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      />
                    )}
                  </div>
                </div>

                {/* Review Notice */}
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-start gap-3">
                  <Sparkles className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-300">İnceleme Süreci</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      İlanınız yayınlanmadan önce moderatörlerimiz tarafından incelenecektir. 
                      Bu işlem genellikle 24 saat içinde tamamlanır.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={step === 1}
                className="gap-2"
              >
                <ArrowLeft size={18} />
                Geri
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={nextStep}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  Devam
                  <ArrowRight size={18} />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
