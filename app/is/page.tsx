"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import {
  JobListing,
  JOB_CATEGORY_LABELS,
  JOB_CATEGORY_ICONS,
  JOB_TYPE_LABELS,
  US_STATES_MAP
} from "@/lib/types";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
  Briefcase,
  FileText,
  Users,
  MapPin,
  DollarSign,
  Clock,
  ArrowRight,
  Loader2,
  Search,
  Plus
} from "lucide-react";

export default function IsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [recentJobs, setRecentJobs] = useState<JobListing[]>([]);
  const [recentSeekers, setRecentSeekers] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ jobs: 0, seekers: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch recent job postings (hiring)
        const { data: jobsData, count: jobsCount } = await supabase
          .from("job_listings")
          .select("*, user:user_id (id, username, full_name, avatar_url)", { count: "exact" })
          .eq("listing_type", "hiring")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch recent job seekers
        const { data: seekersData, count: seekersCount } = await supabase
          .from("job_listings")
          .select("*, user:user_id (id, username, full_name, avatar_url)", { count: "exact" })
          .eq("listing_type", "seeking_job")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(3);

        setRecentJobs(jobsData || []);
        setRecentSeekers(seekersData || []);
        setStats({
          jobs: jobsCount || 0,
          seekers: seekersCount || 0
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatSalary = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return "Belirtilmemiş";
    const suffix = type === "hourly" ? "/saat" : "/yıl";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}${suffix}`;
    if (min) return `$${min.toLocaleString()}+${suffix}`;
    if (max) return `$${max.toLocaleString()}'a kadar${suffix}`;
    return "Belirtilmemiş";
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-16 lg:py-20 bg-[var(--color-surface-sunken)]">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                <p className="text-sm font-medium text-[var(--color-primary)] tracking-wide uppercase mb-4">
                  Kariyer Fırsatları
                </p>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--color-ink)] leading-[1.1] mb-6">
                  İş İlanları
                </h1>
                <p className="text-lg text-[var(--color-ink-secondary)] leading-relaxed mb-10">
                  Amerika'daki Türk topluluğundan iş fırsatları ve yetenekler.
                  Güvenilir bağlantılar, gerçek fırsatlar.
                </p>

                {/* Stats */}
                <div className="flex items-center justify-center gap-12 pt-8 border-t border-[var(--color-border-light)]">
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-[var(--color-ink)]">{stats.jobs}</div>
                    <div className="text-sm text-[var(--color-ink-secondary)] mt-1">İş İlanı</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-[var(--color-ink)]">{stats.seekers}</div>
                    <div className="text-sm text-[var(--color-ink-secondary)] mt-1">İş Arayan</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Links */}
          <section className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
            <div className="grid md:grid-cols-2 gap-6">
              {/* İş Arıyorum */}
              <Link href="/is/ariyorum" className="group">
                <Card variant="interactive" className="h-full">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="h-7 w-7 text-[var(--color-primary)]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[var(--color-ink)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                          İş Arıyorum
                        </h3>
                        <p className="text-[var(--color-ink-secondary)] text-[15px] leading-relaxed">
                          Profilinizi oluşturun, işverenler sizi bulsun. CV'nizi paylaşın ve fırsatları yakalayın.
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[var(--color-ink-faint)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* İşçi Arıyorum */}
              <Link href="/is/isci-ariyorum" className="group">
                <Card variant="interactive" className="h-full">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Users className="h-7 w-7 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[var(--color-ink)] mb-2 group-hover:text-green-600 transition-colors">
                          İşçi Arıyorum
                        </h3>
                        <p className="text-[var(--color-ink-secondary)] text-[15px] leading-relaxed">
                          İş ilanı verin, yetenekleri bulun. Türk topluluğundan güvenilir çalışanlar.
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[var(--color-ink-faint)] group-hover:text-green-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>

          {/* Recent Listings */}
          <section className="max-w-5xl mx-auto px-6 lg:px-8 pb-16">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Job Postings */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-[var(--color-ink)]">Son İş İlanları</h2>
                    <Link href="/is/isci-ariyorum">
                      <Button variant="ghost" size="sm" className="gap-1">
                        Tümü <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>

                  {recentJobs.length === 0 ? (
                    <Card variant="default">
                      <CardContent className="p-8 text-center">
                        <Briefcase className="h-12 w-12 text-[var(--color-ink-faint)] mx-auto mb-4" />
                        <p className="text-[var(--color-ink-secondary)]">Henüz ilan yok</p>
                        <Link href="/is/isci-ariyorum">
                          <Button variant="primary" size="sm" className="mt-4 gap-2">
                            <Plus size={16} /> İlan Ver
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {recentJobs.map((job) => (
                        <JobCard key={job.id} job={job} formatSalary={formatSalary} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Job Seekers */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-[var(--color-ink)]">Son İş Arayanlar</h2>
                    <Link href="/is/ariyorum">
                      <Button variant="ghost" size="sm" className="gap-1">
                        Tümü <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>

                  {recentSeekers.length === 0 ? (
                    <Card variant="default">
                      <CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 text-[var(--color-ink-faint)] mx-auto mb-4" />
                        <p className="text-[var(--color-ink-secondary)]">Henüz profil yok</p>
                        <Link href="/is/ariyorum">
                          <Button variant="primary" size="sm" className="mt-4 gap-2">
                            <Plus size={16} /> Profil Oluştur
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {recentSeekers.map((seeker) => (
                        <SeekerCard key={seeker.id} seeker={seeker} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function JobCard({ job, formatSalary }: { job: JobListing; formatSalary: (min: number | null, max: number | null, type: string | null) => string }) {
  return (
    <Card variant="elevated" className="hover:shadow-[var(--shadow-md)] transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-[var(--color-surface-sunken)] flex items-center justify-center flex-shrink-0">
            <span className="text-xl">{JOB_CATEGORY_ICONS[job.category]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--color-ink)] truncate">{job.title}</h3>
            {job.company_name && (
              <p className="text-sm text-[var(--color-ink-secondary)]">{job.company_name}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-[var(--color-ink-secondary)]">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {job.city}, {US_STATES_MAP[job.state] || job.state}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign size={14} />
                {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" size="sm">{JOB_TYPE_LABELS[job.job_type]}</Badge>
              <Badge variant="outline" size="sm">{JOB_CATEGORY_LABELS[job.category]}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SeekerCard({ seeker }: { seeker: JobListing }) {
  return (
    <Card variant="elevated" className="hover:shadow-[var(--shadow-md)] transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center flex-shrink-0">
            <span className="text-xl">{JOB_CATEGORY_ICONS[seeker.category]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--color-ink)] truncate">{seeker.title}</h3>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-[var(--color-ink-secondary)]">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {seeker.city}, {US_STATES_MAP[seeker.state] || seeker.state}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {JOB_TYPE_LABELS[seeker.job_type]}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" size="sm">{JOB_CATEGORY_LABELS[seeker.category]}</Badge>
              {seeker.is_remote && <Badge variant="info" size="sm">Uzaktan OK</Badge>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
