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
import { Avatar } from "../../components/ui/Avatar";
import {
  Search,
  MapPin,
  Clock,
  ArrowLeft,
  Plus,
  Loader2,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Phone
} from "lucide-react";

export default function IsAriyorumPage() {
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

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other" as JobCategory,
    job_type: "fulltime" as JobType,
    city: "",
    state: "",
    is_remote: false,
    experience_level: "",
    skills: "",
    contact_email: "",
    contact_phone: ""
  });

  // Fetch listings
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("job_listings")
          .select("*, user:user_id (id, username, full_name, avatar_url)", { count: "exact" })
          .eq("listing_type", "seeking_job")
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
        listing_type: "seeking_job",
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        job_type: formData.job_type,
        city: formData.city.trim(),
        state: formData.state,
        is_remote: formData.is_remote,
        experience_level: formData.experience_level.trim() || null,
        skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        user_id: user.id,
        status: "approved"
      });

      if (error) throw error;

      setCreateSuccess(true);
      setFormData({
        title: "",
        description: "",
        category: "other",
        job_type: "fulltime",
        city: "",
        state: "",
        is_remote: false,
        experience_level: "",
        skills: "",
        contact_email: "",
        contact_phone: ""
      });

      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error("Error creating listing:", error);
      setCreateError(error.message || "Bir hata oluştu");
    } finally {
      setCreating(false);
    }
  };

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
                  <h1 className="text-3xl font-semibold text-[var(--color-ink)]">İş Arıyorum</h1>
                  <p className="text-[var(--color-ink-secondary)] mt-1">
                    {totalCount} aday profili
                  </p>
                </div>

                <Button
                  variant="primary"
                  onClick={() => user ? setShowCreateModal(true) : router.push("/login")}
                  className="gap-2"
                >
                  <Plus size={18} />
                  Profil Oluştur
                </Button>
              </div>
            </div>
          </section>

          {/* Filters */}
          <section className="sticky top-[72px] z-30 bg-[var(--color-surface)] border-b border-[var(--color-border-light)]">
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Pozisyon veya şehir ara..."
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
                  <User className="h-16 w-16 text-[var(--color-ink-faint)] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[var(--color-ink)] mb-2">
                    Henüz profil yok
                  </h3>
                  <p className="text-[var(--color-ink-secondary)] mb-6">
                    İlk profili siz oluşturun ve işverenlerin sizi bulmasını sağlayın.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => user ? setShowCreateModal(true) : router.push("/login")}
                    className="gap-2"
                  >
                    <Plus size={18} />
                    Profil Oluştur
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredListings.map((listing) => (
                  <SeekerCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card variant="elevated" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-[var(--color-border-light)]">
              <CardTitle>İş Arayan Profili Oluştur</CardTitle>
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
                  <h3 className="text-xl font-semibold mb-2">Profiliniz Oluşturuldu</h3>
                  <p className="text-[var(--color-ink-secondary)]">
                    Profiliniz onay için gönderildi. Onaylandıktan sonra yayınlanacaktır.
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
                    label="Başlık *"
                    placeholder="örn: Deneyimli Software Engineer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />

                  <Textarea
                    label="Kendinizi Tanıtın *"
                    placeholder="Deneyimleriniz, yetenekleriniz ve ne tür iş aradığınızı açıklayın..."
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
                      Uzaktan çalışmaya açığım
                    </label>
                  </div>

                  <Input
                    label="Deneyim Seviyesi"
                    placeholder="örn: 5+ yıl deneyim"
                    value={formData.experience_level}
                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  />

                  <Input
                    label="Yetenekler (virgülle ayırın)"
                    placeholder="örn: React, Node.js, TypeScript"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="E-posta"
                      type="email"
                      placeholder="iletisim@email.com"
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

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
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
                      {creating ? "Oluşturuluyor..." : "Profil Oluştur"}
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

function SeekerCard({ listing }: { listing: JobListing }) {
  const user = listing.user;

  return (
    <Card variant="elevated" className="hover:shadow-[var(--shadow-md)] transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-5">
          <Avatar
            src={user?.avatar_url || undefined}
            fallback={user?.full_name || user?.username || "?"}
            size="lg"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-ink)]">{listing.title}</h3>
                <p className="text-sm text-[var(--color-ink-secondary)]">
                  {user?.full_name || user?.username}
                </p>
              </div>
              <Badge variant="primary" size="sm">{JOB_CATEGORY_LABELS[listing.category]}</Badge>
            </div>

            <p className="text-[var(--color-ink-secondary)] mt-3 line-clamp-2">
              {listing.description}
            </p>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-[var(--color-ink-secondary)]">
              <span className="flex items-center gap-1.5">
                <MapPin size={15} />
                {listing.city}, {US_STATES_MAP[listing.state] || listing.state}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={15} />
                {JOB_TYPE_LABELS[listing.job_type]}
              </span>
              {listing.is_remote && (
                <Badge variant="info" size="sm">Uzaktan OK</Badge>
              )}
            </div>

            {listing.skills && listing.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {listing.skills.slice(0, 5).map((skill, idx) => (
                  <Badge key={idx} variant="outline" size="sm">{skill}</Badge>
                ))}
                {listing.skills.length > 5 && (
                  <Badge variant="outline" size="sm">+{listing.skills.length - 5}</Badge>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--color-border-light)]">
              {listing.contact_email && (
                <a href={`mailto:${listing.contact_email}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Mail size={15} />
                    E-posta
                  </Button>
                </a>
              )}
              {listing.contact_phone && (
                <a href={`tel:${listing.contact_phone}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Phone size={15} />
                    Ara
                  </Button>
                </a>
              )}
              <Button variant="primary" size="sm">
                Profili Görüntüle
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
