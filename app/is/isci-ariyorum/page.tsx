"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users,
  Search,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Plus,
  Star,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { Modal } from "../../components/ui/Modal";

export default function IsciAriyorumPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = [
    { value: "all", label: "Tümü", icon: "💼" },
    { value: "tech", label: "Teknoloji", icon: "💻" },
    { value: "healthcare", label: "Sağlık", icon: "🏥" },
    { value: "service", label: "Hizmet", icon: "🛎️" },
    { value: "restaurant", label: "Restoran", icon: "🍽️" },
    { value: "construction", label: "İnşaat", icon: "🔨" },
  ];

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          {/* HERO */}
          <section className="relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('/pattern.svg')]" />
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <Link href="/is" className="inline-flex items-center gap-2 text-green-100 hover:text-white mb-4 transition-smooth">
                <ArrowLeft size={20} />
                İş İlanlarına Dön
              </Link>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl font-bold">İşçi Arıyorum</h1>
                  </div>
                  <p className="text-green-100 text-lg">
                    İş ilanı verin, Türk topluluğundan yetenekleri bulun
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="gap-2 shadow-xl"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                  İlan Ver
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">{JOB_POSTINGS.length * 15}</div>
                  <div className="text-sm text-green-100">Açık Pozisyon</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-sm text-green-100">Başvuru/Hafta</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">48 Saat</div>
                  <div className="text-sm text-green-100">Ort. Yanıt</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">92%</div>
                  <div className="text-sm text-green-100">Memnuniyet</div>
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
                    placeholder="Pozisyon veya şirket ara..."
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
                        ? "bg-green-500 text-white shadow-lg"
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

          {/* JOB POSTINGS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Güncel İş İlanları</h2>
              <div className="text-sm text-neutral-500">{JOB_POSTINGS.length} ilan</div>
            </div>

            <div className="space-y-4">
              {JOB_POSTINGS.map((job) => (
                <Card key={job.id} className="glass hover:shadow-lg transition-smooth">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="h-14 w-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-7 w-7 text-neutral-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-lg">{job.title}</h3>
                            <p className="text-neutral-600 dark:text-neutral-400">{job.company}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {job.urgent && (
                              <Badge variant="destructive" size="sm">Acil</Badge>
                            )}
                            {job.featured && (
                              <Badge variant="warning" size="sm">
                                <Star size={12} className="mr-1" />
                                Öne Çıkan
                              </Badge>
                            )}
                          </div>
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
                          <div className="flex items-center gap-1">
                            <Briefcase size={14} />
                            <span>{job.experience}</span>
                          </div>
                        </div>

                        <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-3 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {job.requirements.slice(0, 4).map((req, idx) => (
                            <Badge key={idx} variant="outline" size="sm">{req}</Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                          <div className="flex items-center gap-4 text-sm text-neutral-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{job.posted}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users size={14} />
                              <span>{job.applicants} başvuru</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Detay</Button>
                            <Button variant="primary" size="sm">Başvur</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* POST JOB MODAL */}
          <Modal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Yeni İş İlanı"
            description="İş ilanınızı oluşturun ve yetenekleri bulun"
            size="lg"
          >
            <div className="space-y-4">
              <Input label="Pozisyon Başlığı" placeholder="örn: Software Engineer" />
              <Input label="Şirket Adı" placeholder="Şirketinizin adı" />
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Eyalet"
                  options={[
                    { value: "NY", label: "New York" },
                    { value: "CA", label: "California" },
                    { value: "TX", label: "Texas" },
                  ]}
                />
                <Select
                  label="Çalışma Şekli"
                  options={[
                    { value: "fulltime", label: "Tam Zamanlı" },
                    { value: "parttime", label: "Yarı Zamanlı" },
                    { value: "remote", label: "Uzaktan" },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Maaş Aralığı" placeholder="örn: $50K - $70K" />
                <Select
                  label="Deneyim"
                  options={[
                    { value: "entry", label: "Deneyimsiz" },
                    { value: "1-3", label: "1-3 Yıl" },
                    { value: "3-5", label: "3-5 Yıl" },
                    { value: "5+", label: "5+ Yıl" },
                  ]}
                />
              </div>

              <Textarea 
                label="İş Tanımı" 
                placeholder="Pozisyon hakkında detaylı bilgi..."
                rows={4}
              />

              <Input label="Gereksinimler" placeholder="React, Node.js, AWS (virgülle ayırın)" />

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
                <Button variant="primary">İlan Yayınla</Button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  );
}

const JOB_POSTINGS = [
  {
    id: 1,
    title: "Full Stack Developer",
    company: "Turkish Tech NYC",
    location: "New York, NY",
    salary: "$100K - $140K",
    type: "Tam Zamanlı",
    experience: "3+ Yıl",
    description: "Modern web uygulamaları geliştirmek için deneyimli bir full stack developer arıyoruz. Türkçe bilmek tercih sebebi.",
    requirements: ["React", "Node.js", "PostgreSQL", "AWS"],
    posted: "2 gün önce",
    applicants: 24,
    featured: true,
    urgent: false,
  },
  {
    id: 2,
    title: "Restaurant Manager",
    company: "Anatolia Restaurant",
    location: "Los Angeles, CA",
    salary: "$55K - $70K",
    type: "Tam Zamanlı",
    experience: "5+ Yıl",
    description: "Yoğun bir Türk restoranını yönetecek deneyimli müdür arıyoruz. Türkçe ve İngilizce akıcı olmalı.",
    requirements: ["F&B Management", "Turkish Speaking", "Leadership"],
    posted: "1 hafta önce",
    applicants: 18,
    featured: true,
    urgent: true,
  },
  {
    id: 3,
    title: "Dental Assistant",
    company: "Smile Dental Clinic",
    location: "Chicago, IL",
    salary: "$20 - $25/saat",
    type: "Tam Zamanlı",
    experience: "1+ Yıl",
    description: "Türk doktorumuzun yanında çalışacak deneyimli diş asistanı aranıyor.",
    requirements: ["Dental Experience", "X-Ray Certified", "Turkish Preferred"],
    posted: "3 gün önce",
    applicants: 12,
    featured: false,
    urgent: false,
  },
  {
    id: 4,
    title: "Truck Driver",
    company: "Anatolian Logistics",
    location: "Houston, TX",
    salary: "$60K - $80K",
    type: "Tam Zamanlı",
    experience: "2+ Yıl",
    description: "CDL lisanslı uzun yol şoförü arıyoruz. Rekabetçi maaş ve yan haklar.",
    requirements: ["CDL License", "Clean Record", "Long Haul Experience"],
    posted: "5 gün önce",
    applicants: 8,
    featured: false,
    urgent: true,
  },
  {
    id: 5,
    title: "Part-Time Server",
    company: "Istanbul Cafe",
    location: "Jersey City, NJ",
    salary: "$15/saat + tips",
    type: "Yarı Zamanlı",
    experience: "Deneyimsiz",
    description: "Hafta sonları çalışabilecek garson/garson arıyoruz. Türkçe tercih sebebi.",
    requirements: ["Customer Service", "Weekend Availability"],
    posted: "1 gün önce",
    applicants: 15,
    featured: false,
    urgent: false,
  },
];
