"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search,
  MapPin,
  MessageCircle,
  UserPlus,
  Sparkles,
  Heart,
  Star,
  CheckCircle2
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { PageHero, ResponsiveCardGrid, StickyFilterBar } from "../components/ui/SectionPrimitives";

type Interest = "all" | "coffee" | "sports" | "career" | "social" | "food";

export default function PeoplePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterest, setSelectedInterest] = useState<Interest>("all");
  const [selectedState, setSelectedState] = useState("all");
  const [openToMeet, setOpenToMeet] = useState(false);

  const interests = [
    { value: "all", label: "Tümü", icon: "👥" },
    { value: "coffee", label: "Kahve", icon: "☕" },
    { value: "sports", label: "Spor", icon: "⚽" },
    { value: "career", label: "Kariyer", icon: "💼" },
    { value: "social", label: "Sosyal", icon: "🎉" },
    { value: "food", label: "Yemek", icon: "🍽️" },
  ];

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-[var(--color-surface)] text-[var(--color-ink)]">
          <PageHero
            title="İnsanlar"
            description="Amerika&apos;daki Türklerle tanış, arkadaşlık kur"
            stats={(
              <ResponsiveCardGrid cols="compact">
                <div className="bg-[color:var(--color-surface-raised)]/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">{PEOPLE.length * 30}</div>
                  <div className="text-sm text-white/85">Kayıtlı Üye</div>
                </div>
                <div className="bg-[color:var(--color-surface-raised)]/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">450+</div>
                  <div className="text-sm text-white/85">Tanışmaya Açık</div>
                </div>
                <div className="bg-[color:var(--color-surface-raised)]/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">45</div>
                  <div className="text-sm text-white/85">Eyalet</div>
                </div>
                <div className="bg-[color:var(--color-surface-raised)]/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">1.2K</div>
                  <div className="text-sm text-white/85">Bu Hafta Aktif</div>
                </div>
              </ResponsiveCardGrid>
            )}
          />

          <StickyFilterBar>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="İsim veya şehir ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={18} />}
                  />
                </div>

                <Select
                  options={[
                    { value: "all", label: "Tüm Eyaletler" },
                    { value: "NY", label: "New York" },
                    { value: "CA", label: "California" },
                    { value: "TX", label: "Texas" },
                    { value: "FL", label: "Florida" },
                    { value: "NJ", label: "New Jersey" },
                  ]}
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                />

                <button
                  onClick={() => setOpenToMeet(!openToMeet)}
                  className={`h-10 flex items-center gap-2 px-4 rounded-xl font-medium text-sm transition-smooth ${
                    openToMeet
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-surface-raised)] border border-[var(--color-border-light)] text-[var(--color-ink-secondary)]"
                  }`}
                >
                  <Heart size={18} className={openToMeet ? "fill-white" : ""} />
                  Tanışmaya Açık
                </button>
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {interests.map((interest) => (
                  <button
                    key={interest.value}
                    onClick={() => setSelectedInterest(interest.value as Interest)}
                    className={`h-10 flex items-center gap-2 px-4 rounded-full font-medium text-sm transition-smooth whitespace-nowrap ${
                      selectedInterest === interest.value
                        ? "bg-[var(--color-primary)] text-white shadow-lg"
                        : "bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] border border-[var(--color-border-light)]"
                    }`}
                  >
                    <span>{interest.icon}</span>
                    <span>{interest.label}</span>
                  </button>
                ))}
              </div>
          </StickyFilterBar>

          {/* FEATURED SECTION */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-bold">Öne Çıkan Üyeler</h2>
            </div>

            <ResponsiveCardGrid cols="compact" className="mb-12">
              {PEOPLE.filter(p => p.featured).map((person) => (
                <FeaturedPersonCard key={person.id} person={person} />
              ))}
            </ResponsiveCardGrid>

            {/* ALL PEOPLE */}
            <h2 className="text-2xl font-bold mb-6">Tüm Üyeler</h2>
            <ResponsiveCardGrid>
              {PEOPLE.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </ResponsiveCardGrid>
          </section>

          {/* CTA SECTION */}
          <section className="bg-[var(--color-surface-sunken)] py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Profilini Güncelle</h2>
              <p className="text-[var(--color-ink-secondary)] mb-6 max-w-2xl mx-auto">
                İlgi alanlarını ekle, &quot;tanışmaya açığım&quot; seçeneğini aktifleştir ve 
                yakınındaki Türklerle tanışmaya başla!
              </p>
              <Link href="/ayarlar">
                <Button variant="primary" size="lg" className="gap-2">
                  <Star className="h-5 w-5" />
                  Profilimi Düzenle
                </Button>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function FeaturedPersonCard({ person }: { person: typeof PEOPLE[0] }) {
  return (
    <Card className="glass hover:shadow-xl transition-smooth text-center group bg-[var(--color-surface-raised)] border border-[var(--color-border-light)]">
      <CardContent className="p-5">
        <div className="relative inline-block mb-3">
          <Avatar 
            src={person.avatar} 
            fallback={person.name} 
            size="xl"
            className="ring-4 ring-[var(--color-warning-light)]"
          />
          {person.isOnline && (
            <div className="absolute bottom-1 right-1 h-4 w-4 bg-[var(--color-success)] rounded-full border-2 border-[var(--color-surface-raised)]" />
          )}
        </div>
        <h3 className="font-bold">{person.name}</h3>
        <p className="text-sm text-[var(--color-ink-secondary)] flex items-center justify-center gap-1 mt-1">
          <MapPin size={12} />
          {person.city}
        </p>
        {person.openToMeet && (
          <Badge variant="success" size="sm" className="mt-2">
            <Heart size={10} className="mr-1 fill-current" />
            Tanışmaya Açık
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function PersonCard({ person }: { person: typeof PEOPLE[0] }) {
  const [following, setFollowing] = useState(false);

  return (
    <Card className="glass hover:shadow-lg transition-smooth bg-[var(--color-surface-raised)] border border-[var(--color-border-light)]">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar src={person.avatar} fallback={person.name} size="lg" />
            {person.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-[var(--color-success)] rounded-full border-2 border-[var(--color-surface-raised)]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold truncate">{person.name}</h3>
              {person.verified && (
                <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-[var(--color-ink-secondary)] flex items-center gap-1">
              <MapPin size={12} />
              {person.city}, {person.state}
            </p>
          </div>

          {person.openToMeet && (
            <Badge variant="success" size="sm">
              <Heart size={10} className="fill-current" />
            </Badge>
          )}
        </div>

        <p className="text-sm text-[var(--color-ink)] mt-3 line-clamp-2">
          {person.bio}
        </p>

        <div className="flex flex-wrap gap-2 mt-3">
          {person.interests.slice(0, 3).map((interest, idx) => (
            <Badge key={idx} variant="outline" size="sm">{interest}</Badge>
          ))}
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border-light)]">
          <Button variant="secondary" size="sm" className="flex-1 gap-1">
            <MessageCircle size={16} />
            Mesaj
          </Button>
          <Button 
            variant={following ? "outline" : "primary"} 
            size="sm" 
            className="flex-1 gap-1"
            onClick={() => setFollowing(!following)}
          >
            <UserPlus size={16} />
            {following ? "Takipte" : "Takip Et"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const PEOPLE = [
  {
    id: 1,
    name: "Zeynep Kaya",
    avatar: "/avatars/zeynep.jpg",
    city: "Manhattan",
    state: "NY",
    bio: "NYC'de marketing manager. Kahve, networking ve outdoor aktiviteler ilgimi çekiyor!",
    interests: ["☕ Kahve", "🏃 Koşu", "💼 Kariyer"],
    isOnline: true,
    openToMeet: true,
    verified: true,
    featured: true,
  },
  {
    id: 2,
    name: "Ahmet Yılmaz",
    avatar: "/avatars/ahmet.jpg",
    city: "San Francisco",
    state: "CA",
    bio: "Software engineer @ tech startup. Yeni insanlarla tanışmayı ve tecrübe paylaşmayı seviyorum.",
    interests: ["💻 Tech", "🎮 Gaming", "📚 Kitap"],
    isOnline: true,
    openToMeet: true,
    verified: true,
    featured: true,
  },
  {
    id: 3,
    name: "Elif Demir",
    avatar: "/avatars/elif.jpg",
    city: "Los Angeles",
    state: "CA",
    bio: "Grafik tasarımcı. Sanat, müzik ve yeni lezzetler keşfetmek benim tutkum.",
    interests: ["🎨 Sanat", "🎵 Müzik", "🍽️ Yemek"],
    isOnline: false,
    openToMeet: true,
    verified: false,
    featured: true,
  },
  {
    id: 4,
    name: "Mehmet Şahin",
    avatar: "/avatars/mehmet.jpg",
    city: "Boston",
    state: "MA",
    bio: "Doktora öğrencisi @ Harvard. Akademik dünyadan ve günlük hayattan sohbet etmeyi severim.",
    interests: ["📖 Akademi", "☕ Kahve", "🎾 Tenis"],
    isOnline: true,
    openToMeet: false,
    verified: true,
    featured: true,
  },
  {
    id: 5,
    name: "Ayşe Kara",
    avatar: "/avatars/ayse.jpg",
    city: "Chicago",
    state: "IL",
    bio: "Hemşire. Sağlıklı yaşam, yoga ve doğa yürüyüşleri favorilerim.",
    interests: ["🧘 Yoga", "🥗 Sağlık", "🏔️ Hiking"],
    isOnline: false,
    openToMeet: true,
    verified: false,
    featured: false,
  },
  {
    id: 6,
    name: "Can Özdemir",
    avatar: "/avatars/can.jpg",
    city: "Seattle",
    state: "WA",
    bio: "Amazon'da çalışıyorum. Outdoor aktiviteler, fotoğrafçılık ve seyahat tutkum.",
    interests: ["📸 Fotoğraf", "⛰️ Doğa", "✈️ Seyahat"],
    isOnline: true,
    openToMeet: true,
    verified: true,
    featured: false,
  },
  {
    id: 7,
    name: "Selin Yıldız",
    avatar: "/avatars/selin.jpg",
    city: "Austin",
    state: "TX",
    bio: "Girişimci. Startup ekosistemi, networking ve BBQ partileri ilgimi çekiyor!",
    interests: ["🚀 Startup", "🍖 BBQ", "🎸 Müzik"],
    isOnline: true,
    openToMeet: true,
    verified: false,
    featured: false,
  },
  {
    id: 8,
    name: "Burak Aydın",
    avatar: "/avatars/burak.jpg",
    city: "Miami",
    state: "FL",
    bio: "Finans sektöründe çalışıyorum. Plaj voleybolu ve Latin dansları öğreniyorum.",
    interests: ["🏐 Voleybol", "💃 Dans", "🌴 Plaj"],
    isOnline: false,
    openToMeet: false,
    verified: true,
    featured: false,
  },
  {
    id: 9,
    name: "Deniz Aksoy",
    avatar: "/avatars/deniz.jpg",
    city: "Denver",
    state: "CO",
    bio: "Outdoor enthusiast! Kayak, hiking ve kamp benim için vazgeçilmez.",
    interests: ["⛷️ Kayak", "🏕️ Kamp", "🚴 Bisiklet"],
    isOnline: true,
    openToMeet: true,
    verified: false,
    featured: false,
  },
];
