"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Users,
  TrendingUp,
  Plus,
  Star,
  ChevronRight,
  FileText,
  Target,
  Award,
  Filter
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

export default function IsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { value: "all", label: "Tümü", icon: "💼" },
    { value: "tech", label: "Teknoloji", icon: "💻" },
    { value: "healthcare", label: "Sağlık", icon: "🏥" },
    { value: "finance", label: "Finans", icon: "📊" },
    { value: "service", label: "Hizmet", icon: "🛎️" },
    { value: "restaurant", label: "Restoran", icon: "🍽️" },
    { value: "construction", label: "İnşaat", icon: "🔨" },
  ];

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          {/* HERO HEADER */}
          <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('/pattern.svg')]" />
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">İş İlanları</h1>
                  <p className="text-indigo-100 text-lg">
                    Amerika genelinde Türk topluluğundan iş fırsatları
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">{JOBS.length * 25}</div>
                  <div className="text-sm text-indigo-100">Açık Pozisyon</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">150+</div>
                  <div className="text-sm text-indigo-100">Şirket</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">45</div>
                  <div className="text-sm text-indigo-100">Eyalet</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">2.5K</div>
                  <div className="text-sm text-indigo-100">Başarılı Eşleşme</div>
                </div>
              </div>
            </div>
          </section>

          {/* QUICK LINKS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/is/ariyorum">
                <Card className="glass hover:shadow-xl transition-smooth group cursor-pointer border-2 border-transparent hover:border-indigo-500">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-smooth">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">İş Arıyorum</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                        CV&apos;nizi paylaşın, işverenler sizi bulsun
                      </p>
                    </div>
                    <ChevronRight className="h-6 w-6 text-neutral-400 group-hover:text-indigo-500 transition-smooth" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/is/isci-ariyorum">
                <Card className="glass hover:shadow-xl transition-smooth group cursor-pointer border-2 border-transparent hover:border-indigo-500">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center group-hover:scale-110 transition-smooth">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">İşçi Arıyorum</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                        İş ilanı verin, yetenekleri bulun
                      </p>
                    </div>
                    <ChevronRight className="h-6 w-6 text-neutral-400 group-hover:text-indigo-500 transition-smooth" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>

          {/* FILTERS */}
          <section className="sticky top-16 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 shadow-sm mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Pozisyon, şirket veya anahtar kelime ara..."
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
                  ]}
                />

                <Select
                  options={[
                    { value: "all", label: "Çalışma Şekli" },
                    { value: "fulltime", label: "Tam Zamanlı" },
                    { value: "parttime", label: "Yarı Zamanlı" },
                    { value: "remote", label: "Uzaktan" },
                  ]}
                />
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-smooth whitespace-nowrap ${
                      selectedCategory === cat.value
                        ? "bg-indigo-500 text-white shadow-lg"
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

          {/* JOBS LIST */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-bold">Öne Çıkan İlanlar</h2>
            </div>

            <div className="space-y-4">
              {JOBS.map((job) => (
                <Card key={job.id} className="glass hover:shadow-lg transition-smooth group">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="h-14 w-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-7 w-7 text-neutral-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-lg group-hover:text-indigo-600 transition-smooth">{job.title}</h3>
                            <p className="text-neutral-600 dark:text-neutral-400">{job.company}</p>
                          </div>
                          {job.featured && (
                            <Badge variant="warning" size="sm">
                              <Star size={12} className="mr-1" />
                              Öne Çıkan
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} />
                            <span>{job.salary}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{job.type}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {job.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" size="sm">{tag}</Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                          <span className="text-xs text-neutral-500">{job.posted}</span>
                          <Button variant="primary" size="sm">Başvur</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* INFO SECTION */}
          <section className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Neden AmerikaLa İş İlanları?</h2>
                <p className="text-neutral-600 dark:text-neutral-400">Türk topluluğu için güvenilir iş platformu</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="glass text-center">
                  <CardContent className="p-6">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Hedefli Eşleşme</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Türk topluluğu içinde doğrudan bağlantı
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass text-center">
                  <CardContent className="p-6">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-4">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Güvenilir İlanlar</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Topluluk tarafından doğrulanmış işverenler
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass text-center">
                  <CardContent className="p-6">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Kariyer Gelişimi</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Networking ve mentorluk fırsatları
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

const JOBS = [
  {
    id: 1,
    title: "Senior Software Engineer",
    company: "TechCorp NYC",
    location: "New York, NY",
    salary: "$120K - $180K",
    type: "Tam Zamanlı",
    tags: ["React", "Node.js", "AWS"],
    posted: "2 gün önce",
    featured: true,
  },
  {
    id: 2,
    title: "Restaurant Manager",
    company: "Istanbul Grill",
    location: "Los Angeles, CA",
    salary: "$55K - $70K",
    type: "Tam Zamanlı",
    tags: ["F&B", "Management", "Turkish"],
    posted: "1 hafta önce",
    featured: true,
  },
  {
    id: 3,
    title: "Marketing Specialist",
    company: "Turkish Media Group",
    location: "Chicago, IL",
    salary: "$50K - $65K",
    type: "Tam Zamanlı",
    tags: ["Digital Marketing", "Social Media"],
    posted: "3 gün önce",
    featured: false,
  },
  {
    id: 4,
    title: "Construction Foreman",
    company: "Anatolian Builders",
    location: "Houston, TX",
    salary: "$60K - $80K",
    type: "Tam Zamanlı",
    tags: ["Construction", "Leadership"],
    posted: "5 gün önce",
    featured: false,
  },
  {
    id: 5,
    title: "Part-Time Cashier",
    company: "Turkish Market",
    location: "Jersey City, NJ",
    salary: "$18 - $22/saat",
    type: "Yarı Zamanlı",
    tags: ["Retail", "Turkish Speaking"],
    posted: "1 gün önce",
    featured: false,
  },
];
