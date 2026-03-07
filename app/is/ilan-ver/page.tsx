"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  JobCategory,
  JobType,
  JobListingType,
  JOB_CATEGORY_LABELS,
  JOB_CATEGORY_ICONS,
  JOB_TYPE_LABELS,
  US_STATES,
} from "@/lib/types";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Textarea } from "@/app/components/ui/Textarea";
import {
  ArrowLeft,
  Briefcase,
  User,
  Building,
  CheckCircle,
  Loader2,
  Plus,
  X,
} from "lucide-react";

type Step = 1 | 2 | 3;

interface FormData {
  listing_type: JobListingType | "";
  title: string;
  description: string;
  category: JobCategory;
  job_type: JobType;
  company_name: string;
  salary_min: string;
  salary_max: string;
  salary_type: "hourly" | "yearly" | "";
  city: string;
  state: string;
  is_remote: boolean;
  experience_level: string;
  skills: string[];
  benefits: string[];
  contact_email: string;
  contact_phone: string;
  website_url: string;
}

const initialFormData: FormData = {
  listing_type: "",
  title: "",
  description: "",
  category: "other",
  job_type: "fulltime",
  company_name: "",
  salary_min: "",
  salary_max: "",
  salary_type: "",
  city: "",
  state: "",
  is_remote: false,
  experience_level: "",
  skills: [],
  benefits: [],
  contact_email: "",
  contact_phone: "",
  website_url: "",
};

const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Giriş Seviye (0-2 yıl)" },
  { value: "mid", label: "Orta Seviye (2-5 yıl)" },
  { value: "senior", label: "Kıdemli (5-10 yıl)" },
  { value: "expert", label: "Uzman (10+ yıl)" },
];

const COMMON_BENEFITS = [
  "Sağlık Sigortası",
  "Diş Sigortası",
  "401(k)",
  "Ücretli İzin",
  "Uzaktan Çalışma",
  "Esnek Çalışma",
  "Eğitim Desteği",
  "Yemek Kartı",
];

export default function IsIlanVerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/is/ilan-ver");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, contact_email: user.email || "" }));
    }
  }, [user?.email]);

  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    switch (currentStep) {
      case 1:
        if (!formData.listing_type) newErrors.listing_type = "İlan türü seçiniz";
        if (!formData.title.trim()) newErrors.title = "Başlık zorunludur";
        if (!formData.description.trim()) newErrors.description = "Açıklama zorunludur";
        break;
      case 2:
        if (!formData.city) newErrors.city = "Şehir zorunludur";
        if (!formData.state) newErrors.state = "Eyalet seçiniz";
        break;
      case 3:
        if (!formData.contact_email) newErrors.contact_email = "E-posta zorunludur";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((prev) => Math.min(prev + 1, 3) as Step);
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1) as Step);

  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, newSkill] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const toggleBenefit = (benefit: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(benefit) 
        ? prev.benefits.filter((b) => b !== benefit) 
        : [...prev.benefits, benefit],
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(3) || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("job_listings").insert({
        listing_type: formData.listing_type,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        job_type: formData.job_type,
        company_name: formData.company_name || null,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        salary_type: formData.salary_type || null,
        city: formData.city,
        state: formData.state,
        is_remote: formData.is_remote,
        experience_level: formData.experience_level || null,
        skills: formData.skills,
        benefits: formData.benefits,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        website_url: formData.website_url || null,
        user_id: user.id,
        status: "pending",
      });

      if (error) throw error;
      router.push("/is/ilanlarim?success=true");
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("İlan oluşturulurken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/is">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">İş İlanı Ver</h1>
            <p className="text-neutral-500">İş arayan veya işçi arayan ilanı oluşturun</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  s < step ? "bg-blue-500 text-white" : s === step ? "bg-blue-500 text-white ring-4 ring-blue-500/30" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500"
                }`}>
                  {s < step ? <CheckCircle size={20} /> : s}
                </div>
                {s < 3 && <div className={`w-24 h-1 mx-2 ${s < step ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-neutral-500">
            <span>İlan Bilgileri</span>
            <span>Konum & Detay</span>
            <span>İletişim</span>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">İlan Türü ve Bilgileri</h2>

                <div>
                  <label className="block text-sm font-medium mb-3">İlan Türü *</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => handleChange("listing_type", "seeking_job")}
                      className={`p-4 rounded-xl border-2 transition-all ${formData.listing_type === "seeking_job" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-neutral-200 dark:border-neutral-700 hover:border-blue-300"}`}>
                      <User className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <div className="font-medium">İş Arıyorum</div>
                      <div className="text-xs text-neutral-500 mt-1">Kendinizi tanıtın</div>
                    </button>
                    <button type="button" onClick={() => handleChange("listing_type", "hiring")}
                      className={`p-4 rounded-xl border-2 transition-all ${formData.listing_type === "hiring" ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-neutral-200 dark:border-neutral-700 hover:border-green-300"}`}>
                      <Building className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <div className="font-medium">İşçi Arıyorum</div>
                      <div className="text-xs text-neutral-500 mt-1">Pozisyon açın</div>
                    </button>
                  </div>
                  {errors.listing_type && <p className="text-red-500 text-sm mt-2">{errors.listing_type}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Başlık *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder={formData.listing_type === "hiring" ? "Örn: Full Stack Developer Aranıyor" : "Örn: Deneyimli Yazılım Geliştirici"}
                    error={errors.title}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Kategori</label>
                    <Select
                      value={formData.category}
                      onChange={(e) => handleChange("category", e.target.value as JobCategory)}
                      options={Object.entries(JOB_CATEGORY_LABELS).map(([value, label]) => ({ value, label: `${JOB_CATEGORY_ICONS[value as JobCategory]} ${label}` }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Çalışma Şekli</label>
                    <Select
                      value={formData.job_type}
                      onChange={(e) => handleChange("job_type", e.target.value as JobType)}
                      options={Object.entries(JOB_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Açıklama *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={5}
                    placeholder={formData.listing_type === "hiring" ? "İş tanımı, gereksinimler, sorumluluklar..." : "Deneyim, yetenekler, aradığınız pozisyon..."}
                    error={errors.description}
                  />
                </div>

                {formData.listing_type === "hiring" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Şirket Adı</label>
                    <Input type="text" value={formData.company_name} onChange={(e) => handleChange("company_name", e.target.value)} placeholder="Şirket adı (opsiyonel)" />
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">Konum ve Detaylar</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Şehir *</label>
                    <Input type="text" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="Örn: New York" error={errors.city} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Eyalet *</label>
                    <Select value={formData.state} onChange={(e) => handleChange("state", e.target.value)} options={[{ value: "", label: "Eyalet Seçin" }, ...US_STATES]} error={errors.state} />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.is_remote} onChange={(e) => handleChange("is_remote", e.target.checked)} className="w-5 h-5 rounded border-neutral-300 text-blue-500" />
                  <span className="font-medium">Uzaktan çalışma imkanı var</span>
                </label>

                <div>
                  <label className="block text-sm font-medium mb-2">Maaş Aralığı</label>
                  <div className="grid grid-cols-3 gap-4">
                    <input type="number" value={formData.salary_min} onChange={(e) => handleChange("salary_min", e.target.value)} placeholder="Min"
                      className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900" />
                    <input type="number" value={formData.salary_max} onChange={(e) => handleChange("salary_max", e.target.value)} placeholder="Max"
                      className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900" />
                    <select value={formData.salary_type} onChange={(e) => handleChange("salary_type", e.target.value as FormData["salary_type"])}
                      className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                      <option value="">Tip</option>
                      <option value="hourly">Saatlik</option>
                      <option value="yearly">Yıllık</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Deneyim Seviyesi</label>
                  <select value={formData.experience_level} onChange={(e) => handleChange("experience_level", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                    <option value="">Seçiniz</option>
                    {EXPERIENCE_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Yetenekler</label>
                  <div className="flex gap-2 mb-2">
                    <Input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Yetenek ekle" className="flex-1" />
                    <Button type="button" variant="secondary" onClick={addSkill}><Plus size={18} /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <Badge key={skill} variant="default" className="gap-1">{skill}<button onClick={() => removeSkill(skill)}><X size={14} /></button></Badge>
                    ))}
                  </div>
                </div>

                {formData.listing_type === "hiring" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Yan Haklar</label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_BENEFITS.map((benefit) => (
                        <button key={benefit} type="button" onClick={() => toggleBenefit(benefit)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${formData.benefits.includes(benefit) ? "bg-green-500 text-white" : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200"}`}>
                          {benefit}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">İletişim Bilgileri</h2>

                <div>
                  <label className="block text-sm font-medium mb-2">E-posta *</label>
                  <Input type="email" value={formData.contact_email} onChange={(e) => handleChange("contact_email", e.target.value)}
                    placeholder="ornek@email.com" error={errors.contact_email} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Telefon</label>
                  <Input type="tel" value={formData.contact_phone} onChange={(e) => handleChange("contact_phone", e.target.value)} placeholder="+1 (555) 123-4567" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Web Sitesi</label>
                  <Input type="url" value={formData.website_url} onChange={(e) => handleChange("website_url", e.target.value)} placeholder="https://..." />
                </div>

                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold mb-2">İlan Özeti</h3>
                  <div className="text-sm space-y-1 text-neutral-600 dark:text-neutral-400">
                    <p><strong>Tür:</strong> {formData.listing_type === "hiring" ? "İşçi Arıyorum" : "İş Arıyorum"}</p>
                    <p><strong>Başlık:</strong> {formData.title}</p>
                    <p><strong>Kategori:</strong> {JOB_CATEGORY_LABELS[formData.category]}</p>
                    <p><strong>Konum:</strong> {formData.city}, {formData.state}</p>
                    {formData.is_remote && <p><strong>🌍 Uzaktan Çalışma</strong></p>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 ? (
                <Button variant="secondary" onClick={prevStep}><ArrowLeft size={18} className="mr-2" />Geri</Button>
              ) : <div />}
              
              {step < 3 ? (
                <Button variant="primary" onClick={nextStep}>Devam<CheckCircle size={18} className="ml-2" /></Button>
              ) : (
                <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <CheckCircle size={18} className="mr-2" />}
                  İlanı Yayınla
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
