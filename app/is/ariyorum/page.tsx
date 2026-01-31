"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileText,
  Search,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  Plus,
  Star,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Download
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";

export default function IsAriyorumPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState("all");

  const fields = [
    { value: "all", label: "Tümü", icon: "💼" },
    { value: "tech", label: "Teknoloji", icon: "💻" },
    { value: "healthcare", label: "Sağlık", icon: "🏥" },
    { value: "finance", label: "Finans", icon: "📊" },
    { value: "service", label: "Hizmet", icon: "🛎️" },
    { value: "restaurant", label: "Restoran", icon: "🍽️" },
  ];

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          {/* HERO */}
          <section className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('/pattern.svg')]" />
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <Link href="/is" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-smooth">
                <ArrowLeft size={20} />
                İş İlanlarına Dön
              </Link>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl font-bold">İş Arıyorum</h1>
                  </div>
                  <p className="text-blue-100 text-lg">
                    Profilinizi oluşturun, işverenler sizi bulsun
                  </p>
                </div>
                <Link href="/is/ariyorum/profil-olustur">
                  <Button variant="secondary" size="lg" className="gap-2 shadow-xl">
                    <Plus className="h-5 w-5" />
                    Profil Oluştur
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">{JOB_SEEKERS.length * 20}</div>
                  <div className="text-sm text-blue-100">İş Arayan</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">85%</div>
                  <div className="text-sm text-blue-100">İşe Yerleşme</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">2 Hafta</div>
                  <div className="text-sm text-blue-100">Ort. Süre</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">150+</div>
                  <div className="text-sm text-blue-100">Aktif İşveren</div>
                </div>
              </div>
            </div>
          </section>

          {/* FILTERS */}
          <section className="sticky top-16 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="İsim, pozisyon veya yetenek ara..."
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
                    { value: "all", label: "Deneyim" },
                    { value: "entry", label: "Yeni Mezun" },
                    { value: "mid", label: "3-5 Yıl" },
                    { value: "senior", label: "5+ Yıl" },
                  ]}
                />
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {fields.map((field) => (
                  <button
                    key={field.value}
                    onClick={() => setSelectedField(field.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-smooth whitespace-nowrap ${
                      selectedField === field.value
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <span>{field.icon}</span>
                    <span>{field.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* JOB SEEKERS LIST */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">İş Arayanlar</h2>
              <div className="text-sm text-neutral-500">{JOB_SEEKERS.length} profil</div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {JOB_SEEKERS.map((seeker) => (
                <Card key={seeker.id} className="glass hover:shadow-xl transition-smooth">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar src={seeker.avatar} fallback={seeker.name} size="lg" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{seeker.name}</h3>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm">{seeker.title}</p>
                        <div className="flex items-center gap-1 text-sm text-neutral-500 mt-1">
                          <MapPin size={14} />
                          <span>{seeker.location}</span>
                        </div>
                      </div>
                      {seeker.available && (
                        <Badge variant="success" size="sm">Müsait</Badge>
                      )}
                    </div>

                    <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4 line-clamp-2">
                      {seeker.summary}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {seeker.skills.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="outline" size="sm">{skill}</Badge>
                      ))}
                      {seeker.skills.length > 3 && (
                        <Badge variant="outline" size="sm">+{seeker.skills.length - 3}</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                      <Briefcase size={14} />
                      <span>{seeker.experience} deneyim</span>
                      <span>•</span>
                      <GraduationCap size={14} />
                      <span>{seeker.education}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" className="flex-1">
                        İletişime Geç
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

const JOB_SEEKERS = [
  {
    id: 1,
    name: "Ahmet Yılmaz",
    title: "Software Engineer",
    avatar: "/avatars/ahmet.jpg",
    location: "New York, NY",
    summary: "5+ yıl full-stack geliştirme deneyimi. React, Node.js ve AWS konularında uzman.",
    skills: ["React", "Node.js", "AWS", "TypeScript", "MongoDB"],
    experience: "5+ Yıl",
    education: "Bilgisayar Müh.",
    available: true,
  },
  {
    id: 2,
    name: "Zeynep Kaya",
    title: "Marketing Manager",
    avatar: "/avatars/zeynep.jpg",
    location: "Los Angeles, CA",
    summary: "Dijital pazarlama ve marka yönetimi konusunda 7 yıl deneyim.",
    skills: ["Digital Marketing", "Brand Strategy", "SEO", "Analytics"],
    experience: "7 Yıl",
    education: "İşletme",
    available: true,
  },
  {
    id: 3,
    name: "Mehmet Şahin",
    title: "Chef",
    avatar: "/avatars/mehmet.jpg",
    location: "Chicago, IL",
    summary: "Türk ve Akdeniz mutfağında 10+ yıl deneyimli şef.",
    skills: ["Turkish Cuisine", "Mediterranean", "Menu Development"],
    experience: "10+ Yıl",
    education: "Aşçılık",
    available: false,
  },
  {
    id: 4,
    name: "Elif Demir",
    title: "Registered Nurse",
    avatar: "/avatars/elif.jpg",
    location: "Houston, TX",
    summary: "Acil servis ve yoğun bakım deneyimli hemşire. İngilizce ve Türkçe akıcı.",
    skills: ["Emergency Care", "ICU", "Patient Care", "Bilingual"],
    experience: "4 Yıl",
    education: "Hemşirelik",
    available: true,
  },
  {
    id: 5,
    name: "Can Özdemir",
    title: "Financial Analyst",
    avatar: "/avatars/can.jpg",
    location: "Boston, MA",
    summary: "Yatırım analizi ve portföy yönetimi konularında deneyimli.",
    skills: ["Financial Analysis", "Excel", "Bloomberg", "Risk Management"],
    experience: "3 Yıl",
    education: "Finans",
    available: true,
  },
  {
    id: 6,
    name: "Ayşe Kara",
    title: "Graphic Designer",
    avatar: "/avatars/ayse.jpg",
    location: "San Francisco, CA",
    summary: "UI/UX tasarımı ve marka kimliği oluşturma konusunda uzman.",
    skills: ["Figma", "Adobe Suite", "UI/UX", "Branding"],
    experience: "5 Yıl",
    education: "Grafik Tasarım",
    available: true,
  },
];
