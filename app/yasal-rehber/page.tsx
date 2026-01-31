"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Scale, Search, BookOpen, FileText, Shield, Users, ChevronRight, 
  ExternalLink, Download, Star, Clock, Eye, CheckCircle2
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";

type Category = "all" | "visa" | "work" | "housing" | "health" | "finance" | "legal";

export default function YasalRehberPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  const categories = [
    { value: "all", label: "Tümü", icon: "📚" },
    { value: "visa", label: "Vize & Göçmenlik", icon: "🛂" },
    { value: "work", label: "Çalışma", icon: "💼" },
    { value: "housing", label: "Konut", icon: "🏠" },
    { value: "health", label: "Sağlık", icon: "🏥" },
    { value: "finance", label: "Finans", icon: "💰" },
    { value: "legal", label: "Hukuk", icon: "⚖️" },
  ];

  const filteredGuides = selectedCategory === "all" 
    ? GUIDES 
    : GUIDES.filter(g => g.category === selectedCategory);

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          {/* HERO */}
          <section className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 text-white">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('/pattern.svg')]" />
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                    <Scale className="h-10 w-10" />
                    Yasal Rehber
                  </h1>
                  <p className="text-slate-300 text-lg">
                    Amerika&apos;da yaşam için kapsamlı hukuki bilgi ve rehberler
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">{GUIDES.length}+</div>
                  <div className="text-sm text-slate-300">Rehber</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">6</div>
                  <div className="text-sm text-slate-300">Kategori</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">50K+</div>
                  <div className="text-sm text-slate-300">Okuyucu</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">Haftalık</div>
                  <div className="text-sm text-slate-300">Güncelleme</div>
                </div>
              </div>
            </div>
          </section>

          {/* DISCLAIMER */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
            <Card className="glass border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4 flex items-start gap-3">
                <Shield className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">Önemli Uyarı</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Bu rehberler yalnızca bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz. 
                    Önemli kararlar için mutlaka bir avukata danışın.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* FILTERS */}
          <section className="sticky top-16 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 shadow-sm mt-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input placeholder="Rehber ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} icon={<Search size={18} />} />
                </div>
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value as Category)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-smooth whitespace-nowrap ${
                      selectedCategory === cat.value
                        ? "bg-slate-800 text-white shadow-lg"
                        : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURED GUIDES */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-bold">Popüler Rehberler</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredGuides.filter(g => g.featured).map((guide) => (
                <GuideCard key={guide.id} guide={guide} featured />
              ))}
            </div>

            {/* ALL GUIDES */}
            <h2 className="text-2xl font-bold mb-6">
              {selectedCategory === "all" ? "Tüm Rehberler" : categories.find(c => c.value === selectedCategory)?.label}
            </h2>

            <div className="space-y-4">
              {filteredGuides.map((guide) => (
                <GuideListItem key={guide.id} guide={guide} />
              ))}
            </div>
          </section>

          {/* RESOURCES */}
          <section className="bg-slate-50 dark:bg-slate-900/50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold mb-6">Faydalı Kaynaklar</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {RESOURCES.map((resource, idx) => (
                  <a key={idx} href={resource.url} target="_blank" rel="noopener noreferrer">
                    <Card className="glass hover:shadow-lg transition-smooth h-full">
                      <CardContent className="p-5 flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <ExternalLink className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-bold">{resource.name}</h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">{resource.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function GuideCard({ guide, featured }: { guide: typeof GUIDES[0]; featured?: boolean }) {
  return (
    <Card className="glass hover:shadow-xl transition-smooth group h-full">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <Badge variant={guide.category === "visa" ? "info" : guide.category === "work" ? "success" : "default"}>
            {guide.categoryLabel}
          </Badge>
          {featured && <Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
        </div>

        <h3 className="font-bold text-xl mb-3 group-hover:text-red-600 transition-smooth">{guide.title}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 flex-1">{guide.description}</p>

        <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
          <div className="flex items-center gap-1"><Clock size={14} />{guide.readTime}</div>
          <div className="flex items-center gap-1"><Eye size={14} />{guide.views}</div>
        </div>

        <Button variant="primary" className="w-full gap-2">
          Rehberi Oku <ChevronRight size={18} />
        </Button>
      </CardContent>
    </Card>
  );
}

function GuideListItem({ guide }: { guide: typeof GUIDES[0] }) {
  return (
    <Card className="glass hover:shadow-md transition-smooth">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-slate-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold truncate">{guide.title}</h3>
              <Badge variant="outline" size="sm">{guide.categoryLabel}</Badge>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">{guide.description}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <div className="flex items-center gap-1"><Clock size={14} />{guide.readTime}</div>
            <Button variant="outline" size="sm" className="gap-1">
              Oku <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const GUIDES = [
  { id: 1, title: "Green Card Başvuru Rehberi 2025", description: "Aile, iş veya çekilişle Green Card başvurusu yapmanın tüm yolları ve adım adım süreç.", category: "visa", categoryLabel: "Vize", readTime: "20 dk", views: "15K", featured: true },
  { id: 2, title: "H1B Vize Başvuru Süreci", description: "H1B vizesi için başvuru, loterya ve onay sürecinde bilmeniz gerekenler.", category: "visa", categoryLabel: "Vize", readTime: "15 dk", views: "12K", featured: true },
  { id: 3, title: "Amerika'da Ev Kiralama Rehberi", description: "Lease anlaşması, depozito, haklar ve sorumluluklar hakkında kapsamlı bilgi.", category: "housing", categoryLabel: "Konut", readTime: "12 dk", views: "8K", featured: true },
  { id: 4, title: "SSN (Sosyal Güvenlik Numarası) Alma", description: "SSN başvurusu, gerekli belgeler ve süreç hakkında rehber.", category: "work", categoryLabel: "Çalışma", readTime: "8 dk", views: "10K", featured: false },
  { id: 5, title: "Sağlık Sigortası Seçim Rehberi", description: "HMO, PPO, deductible gibi kavramlar ve doğru sigorta seçimi.", category: "health", categoryLabel: "Sağlık", readTime: "15 dk", views: "7K", featured: false },
  { id: 6, title: "Vergi Beyannamesi Nasıl Verilir?", description: "W-2, 1099 formları, tax filing ve önemli tarihler.", category: "finance", categoryLabel: "Finans", readTime: "18 dk", views: "9K", featured: false },
  { id: 7, title: "Kredi Skoru Nasıl Yükseltilir?", description: "Kredi skoru nedir, nasıl hesaplanır ve yükseltme stratejileri.", category: "finance", categoryLabel: "Finans", readTime: "10 dk", views: "11K", featured: false },
  { id: 8, title: "İş Arama ve Mülakat Rehberi", description: "Resume hazırlama, networking ve mülakat teknikleri.", category: "work", categoryLabel: "Çalışma", readTime: "14 dk", views: "6K", featured: false },
  { id: 9, title: "Kiracı Hakları", description: "Kiracı olarak haklarınız, ev sahibi sorunları ve çözüm yolları.", category: "housing", categoryLabel: "Konut", readTime: "10 dk", views: "5K", featured: false },
  { id: 10, title: "Ehliyet Alma Rehberi", description: "Eyaletlere göre ehliyet başvurusu, sınav ve gerekli belgeler.", category: "legal", categoryLabel: "Hukuk", readTime: "8 dk", views: "8K", featured: false },
];

const RESOURCES = [
  { name: "USCIS", description: "Resmi göçmenlik ve vatandaşlık servisleri", url: "https://www.uscis.gov" },
  { name: "IRS", description: "Vergi dairesi ve tax filing", url: "https://www.irs.gov" },
  { name: "Healthcare.gov", description: "Sağlık sigortası marketplace", url: "https://www.healthcare.gov" },
  { name: "Social Security", description: "Sosyal güvenlik hizmetleri", url: "https://www.ssa.gov" },
  { name: "DMV", description: "Ehliyet ve araç tescil işlemleri", url: "https://www.dmv.org" },
  { name: "USA.gov", description: "ABD resmi hükümet portalı", url: "https://www.usa.gov" },
];
