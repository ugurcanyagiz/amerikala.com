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
import UserProfileCardModal, { UserProfileCardData } from "../../components/UserProfileCardModal";
import MobileFilterSheet from "../components/MobileFilterSheet";
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
  Phone,
  MessageCircle,
  ExternalLink,
  UserCheck,
  UserPlus,
  UserX
} from "lucide-react";

type JobFilterDraft = {
  searchQuery: string;
  selectedCategory: string;
  selectedState: string;
  selectedJobType: string;
};

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
        status: "pending"
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
    } catch (error) {
      console.error("Error creating listing:", error);
      const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu";
      setCreateError(errorMessage);
    } finally {
      setCreating(false);
    }
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
              placeholder="Pozisyon veya şehir ara..."
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
  const router = useRouter();
  const { user } = useAuth();
  const listingUser = listing.user;

  const [relationshipStatus, setRelationshipStatus] = useState<
    "guest" | "self" | "none" | "pending_sent" | "pending_received" | "following"
  >("guest");
  const [followLoading, setFollowLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);

  useEffect(() => {
    const checkRelationship = async () => {
      if (!listingUser?.id) {
        setRelationshipStatus("none");
        return;
      }

      if (!user) {
        setRelationshipStatus("guest");
        return;
      }

      if (user.id === listingUser.id) {
        setRelationshipStatus("self");
        return;
      }

      const { data: followData, error: followError } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", listingUser.id)
        .limit(1);

      if (!followError && (followData?.length || 0) > 0) {
        setRelationshipStatus("following");
        return;
      }

      const { data: outgoing, error: outgoingError } = await supabase
        .from("friend_requests")
        .select("status")
        .eq("requester_id", user.id)
        .eq("receiver_id", listingUser.id)
        .limit(1)
        .maybeSingle();

      if (!outgoingError && outgoing?.status === "pending") {
        setRelationshipStatus("pending_sent");
        return;
      }

      const { data: incoming, error: incomingError } = await supabase
        .from("friend_requests")
        .select("status")
        .eq("requester_id", listingUser.id)
        .eq("receiver_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!incomingError && incoming?.status === "pending") {
        setRelationshipStatus("pending_received");
        return;
      }

      setRelationshipStatus("none");
    };

    checkRelationship();
  }, [listingUser?.id, user]);

  const upsertFollow = async (targetUserId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetUserId });

    return !error;
  };

  const deleteFollow = async (targetUserId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);

    return !error;
  };

  const handleToggleFollow = async () => {
    if (!listingUser?.id) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.id === listingUser.id) return;

    setFollowLoading(true);
    try {
      if (relationshipStatus === "following") {
        const removed = await deleteFollow(listingUser.id);
        if (removed) setRelationshipStatus("none");
        return;
      }

      if (relationshipStatus === "pending_sent") {
        const { error } = await supabase
          .from("friend_requests")
          .delete()
          .eq("requester_id", user.id)
          .eq("receiver_id", listingUser.id)
          .eq("status", "pending");

        if (!error) setRelationshipStatus("none");
        return;
      }

      if (relationshipStatus === "pending_received") {
        const { error } = await supabase
          .from("friend_requests")
          .update({ status: "accepted", responded_at: new Date().toISOString() })
          .eq("requester_id", listingUser.id)
          .eq("receiver_id", user.id)
          .eq("status", "pending");

        if (!error) {
          await upsertFollow(listingUser.id);
          setRelationshipStatus("following");
        }
        return;
      }

      const { error: requestError } = await supabase
        .from("friend_requests")
        .upsert(
          { requester_id: user.id, receiver_id: listingUser.id, status: "pending" },
          { onConflict: "requester_id,receiver_id" }
        );

      if (!requestError) {
        setRelationshipStatus("pending_sent");
        return;
      }

      const followed = await upsertFollow(listingUser.id);
      if (followed) setRelationshipStatus("following");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!listingUser?.id) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.id === listingUser.id) return;

    setDmLoading(true);
    try {
      const { data: rpcConversationId } = await supabase
        .rpc("create_direct_conversation", { target_user_id: listingUser.id });

      if (rpcConversationId) {
        router.push(`/messages?conversation=${rpcConversationId}`);
        return;
      }

      const { data: myRows } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      const myConversationIds = ((myRows as Array<{ conversation_id: string }> | null) || [])
        .map((row) => row.conversation_id);

      if (myConversationIds.length > 0) {
        const { data: targetRows } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", listingUser.id)
          .in("conversation_id", myConversationIds);

        const existingConversationId =
          (targetRows as Array<{ conversation_id: string }> | null)?.[0]?.conversation_id;

        if (existingConversationId) {
          router.push(`/messages?conversation=${existingConversationId}`);
          return;
        }
      }

      let conversationId = "";
      for (const payload of [{ is_group: false, created_by: user.id }, { is_group: false }, {}]) {
        const { data, error } = await supabase
          .from("conversations")
          .insert(payload)
          .select("id")
          .single();

        if (!error && data?.id) {
          conversationId = data.id as string;
          break;
        }
      }

      if (!conversationId) {
        router.push("/messages");
        return;
      }

      await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: user.id },
        { conversation_id: conversationId, user_id: listingUser.id },
      ]);

      router.push(`/messages?conversation=${conversationId}`);
    } finally {
      setDmLoading(false);
    }
  };

  const getFollowButtonLabel = () => {
    if (relationshipStatus === "following") return "Takiptesin";
    if (relationshipStatus === "pending_sent") return "İstek Gönderildi";
    if (relationshipStatus === "pending_received") return "İsteği Kabul Et";
    return "Arkadaşlık İsteği Gönder";
  };

  const getFollowIcon = () => {
    if (relationshipStatus === "following") return <UserCheck size={15} />;
    if (relationshipStatus === "pending_sent") return <UserX size={15} />;
    return <UserPlus size={15} />;
  };

  const modalProfile: UserProfileCardData | null = listingUser?.id
    ? {
        id: listingUser.id,
        username: listingUser.username,
        full_name: listingUser.full_name,
        avatar_url: listingUser.avatar_url,
      }
    : null;

  return (
    <>
      <Card variant="elevated" className="hover:shadow-[var(--shadow-md)] transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar
              src={listingUser?.avatar_url || undefined}
              fallback={listingUser?.full_name || listingUser?.username || "?"}
              size="lg"
              className={listingUser?.id ? "cursor-pointer" : undefined}
              onClick={() => {
                if (!listingUser?.id) return;
                setShowProfileCard(true);
              }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-ink)]">{listing.title}</h3>
                  <button
                    type="button"
                    className="text-sm text-[var(--color-ink-secondary)] hover:underline"
                    onClick={() => {
                      if (!listingUser?.id) return;
                      setShowProfileCard(true);
                    }}
                  >
                    {listingUser?.full_name || listingUser?.username}
                  </button>
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

              <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-[var(--color-border-light)]">
                {listing.contact_email && (
                  <a href={`mailto:${listing.contact_email}`}>
                    <Button variant="secondary" size="sm" className="gap-2">
                      <Mail size={15} />
                      E-posta
                    </Button>
                  </a>
                )}
                {listing.contact_phone && (
                  <a href={`tel:${listing.contact_phone}`}>
                    <Button variant="secondary" size="sm" className="gap-2">
                      <Phone size={15} />
                      Ara
                    </Button>
                  </a>
                )}

                <Button
                  variant={relationshipStatus === "following" ? "secondary" : "primary"}
                  size="sm"
                  className="gap-2"
                  onClick={handleToggleFollow}
                  disabled={followLoading || relationshipStatus === "self"}
                >
                  {getFollowIcon()}
                  {getFollowButtonLabel()}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={handleSendMessage}
                  disabled={dmLoading || user?.id === listingUser?.id}
                >
                  <MessageCircle size={15} />
                  Özel Mesaj
                </Button>

                <Link href={listingUser?.id ? `/profile/${listingUser.id}` : "#"}>
                  <Button variant="secondary" size="sm" className="gap-2" disabled={!listingUser?.id}>
                    <ExternalLink size={15} />
                    Profili Görüntüle
                  </Button>
                </Link>

                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => router.push(user ? "/groups/create" : "/login")}
                >
                  Birlikte Grup Oluştur
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserProfileCardModal
        profile={modalProfile}
        open={showProfileCard}
        onClose={() => setShowProfileCard(false)}
      />
    </>
  );
}
