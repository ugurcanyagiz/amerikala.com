"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../../contexts/AuthContext";
import {
  JobListing,
  JobCategory,
  JobType,
  JOB_CATEGORY_LABELS,
  JOB_CATEGORY_ICONS,
  JOB_TYPE_LABELS,
  US_STATES,
  US_STATES_MAP
} from "@/lib/types";
import Sidebar from "../../components/Sidebar";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import MobileFilterSheet from "../components/MobileFilterSheet";
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  ArrowLeft,
  Plus,
  Loader2,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Phone,
  Globe
} from "lucide-react";

type JobFilterDraft = {
  searchQuery: string;
  selectedCategory: string;
  selectedState: string;
  selectedJobType: string;
};

export default function IsciAriyorumPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Listings state
  const [listings, setListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedJobType, setSelectedJobType] = useState<string>("all");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileDraft, setMobileDraft] = useState<JobFilterDraft | null>(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company_name: "",
    category: "other" as JobCategory,
    job_type: "fulltime" as JobType,
    salary_min: "",
    salary_max: "",
    salary_type: "yearly" as "hourly" | "yearly",
    city: "",
    state: "",
    is_remote: false,
    experience_level: "",
    skills: "",
    benefits: "",
    contact_email: "",
    contact_phone: "",
    website_url: ""
  });

  // Fetch listings
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("job_listings")
          .select("*, user:user_id (id, username, full_name, avatar_url)", { count: "exact" })
          .eq("listing_type", "hiring")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (selectedCategory !== "all") {
          query = query.eq("category", selectedCategory);
        }
        if (selectedState !== "all") {
          query = query.eq("state", selectedState);
        }
        if (selectedJobType !== "all") {
          query = query.eq("job_type", selectedJobType);
        }

        const { data, count, error } = await query.limit(50);

        if (error) throw error;

        setListings(data || []);
        setTotalCount(count || 0);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setListings([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [selectedCategory, selectedState, selectedJobType]);

  // Filter listings by search
  const filteredListings = listings.filter(listing => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      listing.title.toLowerCase().includes(query) ||
      listing.description.toLowerCase().includes(query) ||
      listing.company_name?.toLowerCase().includes(query) ||
      listing.city.toLowerCase().includes(query)
    );
  });

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const { error } = await supabase.from("job_listings").insert({
        listing_type: "hiring",
        title: formData.title.trim(),
        description: formData.description.trim(),
        company_name: formData.company_name.trim() || null,
        category: formData.category,
        job_type: formData.job_type,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        salary_type: formData.salary_type,
        city: formData.city.trim(),
        state: formData.state,
        is_remote: formData.is_remote,
        experience_level: formData.experience_level.trim() || null,
        skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
        benefits: formData.benefits.split(",").map(s => s.trim()).filter(Boolean),
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        website_url: formData.website_url.trim() || null,
        user_id: user.id,
        status: "pending"
      });

      if (error) throw error;

      setCreateSuccess(true);
      setFormData({
        title: "",
        description: "",
        company_name: "",
        category: "other",
        job_type: "fulltime",
        salary_min: "",
        salary_max: "",
        salary_type: "yearly",
        city: "",
        state: "",
        is_remote: false,
        experience_level: "",
        skills: "",
        benefits: "",
        contact_email: "",
        contact_phone: "",
        website_url: ""
      });

      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(false);
      }, 2000);
    } catch (error: unknown) {
      console.error("Error creating listing:", error);
      const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu";
      setCreateError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const formatSalary = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return "Belirtilmemiş";
    const suffix = type === "hourly" ? "/saat" : "/yıl";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}${suffix}`;
    if (min) return `$${min.toLocaleString()}+${suffix}`;
    if (max) return `$${max.toLocaleString()}'a kadar${suffix}`;
    return "Belirtilmemiş";
  };

  const buildFilterState = (): JobFilterDraft => ({
    searchQuery,
    selectedCategory,
    selectedState,
    selectedJobType,
  });

  const resetFilterState = (): JobFilterDraft => ({
    searchQuery: "",
    selectedCategory: "all",
    selectedState: "all",
    selectedJobType: "all",
  });

  const applyFilterState = (next: JobFilterDraft) => {
    setSearchQuery(next.searchQuery);
    setSelectedCategory(next.selectedCategory);
    setSelectedState(next.selectedState);
    setSelectedJobType(next.selectedJobType);
  };

  const mobileFilterChips = [
    searchQuery ? `Ara: ${searchQuery}` : null,
    selectedCategory !== "all" ? JOB_CATEGORY_LABELS[selectedCategory as JobCategory] : null,
    selectedState !== "all" ? (US_STATES_MAP[selectedState] || selectedState) : null,
    selectedJobType !== "all" ? JOB_TYPE_LABELS[selectedJobType as JobType] : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          {/* Header */}
          <section className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border-light)]">
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
              <Link href="/is">
                <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2">
                  <ArrowLeft size={16} />
                  İş İlanları
                </Button>
              </Link>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold text-[var(--color-ink)]">İşçi Arıyorum</h1>
                  <p className="text-[var(--color-ink-secondary)] mt-1">
                    {totalCount} iş ilanı
                  </p>
                </div>

                <Button
                  variant="primary"
                  onClick={() => user ? setShowCreateModal(true) : router.push("/login")}
                  className="gap-2"
                >
                  <Plus size={18} />
                  İlan Ver
                </Button>
              </div>

              {mobileFilterChips.length > 0 && (
                <div className="mt-4 flex gap-2 overflow-x-auto md:hidden">
                  {mobileFilterChips.map((chip) => (
                    <Badge key={chip} variant="outline" size="sm" className="whitespace-nowrap">
                      {chip}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Filters */}
          <section className="border-b border-[var(--color-border-light)] bg-[var(--color-surface)] md:hidden">
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2"
                onClick={() => {
                  setMobileDraft(buildFilterState());
                  setIsMobileFiltersOpen(true);
                }}
                aria-label="Filtreleri aç"
              >
                <Search size={16} />
                Filtreler
              </Button>
            </div>
          </section>

          <section className="sticky top-[72px] z-30 hidden bg-[var(--color-surface)] border-b border-[var(--color-border-light)] md:block">
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Pozisyon veya şirket ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={18} />}
                  />
                </div>
                <Select
                  options={[
                    { value: "all", label: "Tüm Kategoriler" },
                    ...Object.entries(JOB_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))
                  ]}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                />
                <Select
                  options={[
                    { value: "all", label: "Tüm Eyaletler" },
                    ...US_STATES.map(s => ({ value: s.value, label: s.label }))
                  ]}
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                />
                <Select
                  options={[
                    { value: "all", label: "Çalışma Şekli" },
                    ...Object.entries(JOB_TYPE_LABELS).map(([value, label]) => ({ value, label }))
                  ]}
                  value={selectedJobType}
                  onChange={(e) => setSelectedJobType(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Listings */}
          <section className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
              </div>
            ) : filteredListings.length === 0 ? (
              <Card variant="default">
                <CardContent className="p-12 text-center">
                  <Briefcase className="h-16 w-16 text-[var(--color-ink-faint)] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[var(--color-ink)] mb-2">
                    Henüz ilan yok
                  </h3>
                  <p className="text-[var(--color-ink-secondary)] mb-6">
                    İlk ilanı siz verin ve yetenekleri bulun.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => user ? setShowCreateModal(true) : router.push("/login")}
                    className="gap-2"
                  >
                    <Plus size={18} />
                    İlan Ver
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <JobCard key={listing.id} listing={listing} formatSalary={formatSalary} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <MobileFilterSheet
        open={isMobileFiltersOpen && !!mobileDraft}
        title="Filters"
        onClose={() => {
          setIsMobileFiltersOpen(false);
          setMobileDraft(null);
        }}
        onClear={() => {
          const cleared = resetFilterState();
          setMobileDraft(cleared);
          applyFilterState(cleared);
          setIsMobileFiltersOpen(false);
        }}
        onApply={() => {
          if (!mobileDraft) return;
          applyFilterState(mobileDraft);
          setIsMobileFiltersOpen(false);
          setMobileDraft(null);
        }}
      >
        {mobileDraft && (
          <div className="space-y-4">
            <Input
              placeholder="Pozisyon veya şirket ara..."
              value={mobileDraft.searchQuery}
              onChange={(e) => setMobileDraft((prev) => prev ? { ...prev, searchQuery: e.target.value } : prev)}
              icon={<Search size={18} />}
            />
            <Select
              options={[
                { value: "all", label: "Tüm Kategoriler" },
                ...Object.entries(JOB_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))
              ]}
              value={mobileDraft.selectedCategory}
              onChange={(e) => setMobileDraft((prev) => prev ? { ...prev, selectedCategory: e.target.value } : prev)}
            />
            <Select
              options={[
                { value: "all", label: "Tüm Eyaletler" },
                ...US_STATES.map(s => ({ value: s.value, label: s.label }))
              ]}
              value={mobileDraft.selectedState}
              onChange={(e) => setMobileDraft((prev) => prev ? { ...prev, selectedState: e.target.value } : prev)}
            />
            <Select
              options={[
                { value: "all", label: "Çalışma Şekli" },
                ...Object.entries(JOB_TYPE_LABELS).map(([value, label]) => ({ value, label }))
              ]}
              value={mobileDraft.selectedJobType}
              onChange={(e) => setMobileDraft((prev) => prev ? { ...prev, selectedJobType: e.target.value } : prev)}
            />
          </div>
        )}
      </MobileFilterSheet>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(var(--color-trust-rgb),0.5)]">
          <Card variant="elevated" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-[var(--color-border-light)]">
              <CardTitle>Yeni İş İlanı</CardTitle>
              <button
                onClick={() => setShowCreateModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-sunken)] transition-colors"
              >
                <X size={20} />
              </button>
            </CardHeader>

            <CardContent className="p-6">
              {createSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">İlanınız Oluşturuldu</h3>
                  <p className="text-[var(--color-ink-secondary)]">
                    İlanınız onay için gönderildi. Onaylandıktan sonra yayınlanacaktır.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {createError && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                      <AlertCircle size={20} />
                      <p className="text-sm">{createError}</p>
                    </div>
                  )}

                  <Input
                    label="Pozisyon Başlığı *"
                    placeholder="örn: Senior Software Engineer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />

                  <Input
                    label="Şirket Adı"
                    placeholder="Şirketinizin adı"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    icon={<Building2 size={18} />}
                  />

                  <Textarea
                    label="İş Tanımı *"
                    placeholder="Pozisyon hakkında detaylı bilgi, sorumluluklar, beklentiler..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    required
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <Select
                      label="Kategori *"
                      options={Object.entries(JOB_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as JobCategory })}
                    />
                    <Select
                      label="Çalışma Şekli *"
                      options={Object.entries(JOB_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                      value={formData.job_type}
                      onChange={(e) => setFormData({ ...formData, job_type: e.target.value as JobType })}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Input
                      label="Min Maaş"
                      type="number"
                      placeholder="50000"
                      value={formData.salary_min}
                      onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                    />
                    <Input
                      label="Max Maaş"
                      type="number"
                      placeholder="80000"
                      value={formData.salary_max}
                      onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                    />
                    <Select
                      label="Maaş Türü"
                      options={[
                        { value: "yearly", label: "Yıllık" },
                        { value: "hourly", label: "Saatlik" }
                      ]}
                      value={formData.salary_type}
                      onChange={(e) => setFormData({ ...formData, salary_type: e.target.value as "hourly" | "yearly" })}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Şehir *"
                      placeholder="örn: New York"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                    <Select
                      label="Eyalet *"
                      options={[
                        { value: "", label: "Seçin..." },
                        ...US_STATES.map(s => ({ value: s.value, label: s.label }))
                      ]}
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_remote"
                      checked={formData.is_remote}
                      onChange={(e) => setFormData({ ...formData, is_remote: e.target.checked })}
                      className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                    />
                    <label htmlFor="is_remote" className="text-sm font-medium">
                      Uzaktan çalışma imkanı var
                    </label>
                  </div>

                  <Input
                    label="Deneyim Gereksinimi"
                    placeholder="örn: 3-5 yıl deneyim"
                    value={formData.experience_level}
                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  />

                  <Input
                    label="Aranan Yetenekler (virgülle ayırın)"
                    placeholder="örn: React, Node.js, TypeScript"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  />

                  <Input
                    label="Yan Haklar (virgülle ayırın)"
                    placeholder="örn: Sağlık sigortası, 401k, PTO"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="E-posta"
                      type="email"
                      placeholder="hr@sirket.com"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      icon={<Mail size={18} />}
                    />
                    <Input
                      label="Telefon"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      icon={<Phone size={18} />}
                    />
                  </div>

                  <Input
                    label="Web Sitesi"
                    type="url"
                    placeholder="https://sirket.com"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    icon={<Globe size={18} />}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1"
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={creating}
                      className="flex-1"
                    >
                      {creating ? "Oluşturuluyor..." : "İlan Yayınla"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function JobCard({ listing, formatSalary }: { listing: JobListing; formatSalary: (min: number | null, max: number | null, type: string | null) => string }) {
  return (
    <Link href={`/is/ilan/${listing.id}`}>
      <Card variant="elevated" className="h-full hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer group">
        <CardContent className="p-5 h-full flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="h-12 w-12 rounded-xl bg-[var(--color-surface-sunken)] flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{JOB_CATEGORY_ICONS[listing.category]}</span>
            </div>
            <Badge variant="primary" size="sm">{JOB_CATEGORY_LABELS[listing.category]}</Badge>
          </div>

          <div className="mt-4 min-w-0">
            <h3 className="text-lg font-semibold text-[var(--color-ink)] line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
              {listing.title}
            </h3>
            {listing.company_name && (
              <p className="text-sm text-[var(--color-ink-secondary)] mt-1 line-clamp-1">{listing.company_name}</p>
            )}
          </div>

          <p className="text-sm text-[var(--color-ink-secondary)] mt-3 line-clamp-2">
            {listing.description}
          </p>

          <div className="space-y-2.5 mt-4 text-sm text-[var(--color-ink-secondary)]">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} />
              <span className="line-clamp-1">{listing.city}, {US_STATES_MAP[listing.state] || listing.state}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign size={14} />
              <span className="line-clamp-1">{formatSalary(listing.salary_min, listing.salary_max, listing.salary_type)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              {JOB_TYPE_LABELS[listing.job_type]}
            </div>
          </div>

          {listing.skills && listing.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {listing.skills.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="outline" size="sm">{skill}</Badge>
              ))}
              {listing.skills.length > 3 && (
                <Badge variant="outline" size="sm">+{listing.skills.length - 3}</Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-[var(--color-border-light)]">
            <div className="flex items-center gap-2">
              <Badge variant="outline" size="sm">{JOB_TYPE_LABELS[listing.job_type]}</Badge>
              {listing.is_remote && <Badge variant="info" size="sm">Uzaktan OK</Badge>}
            </div>
            <span className="text-sm font-medium text-[var(--color-primary)]">İlana Git</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
