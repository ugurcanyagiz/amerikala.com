"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import {
  JobListing,
  JOB_CATEGORY_LABELS,
  JOB_CATEGORY_ICONS,
  JOB_TYPE_LABELS,
  US_STATES_MAP
} from "@/lib/types";
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
  Plus
} from "lucide-react";

export default function IsPage() {
  const { user } = useAuth();
  const [recentJobs, setRecentJobs] = useState<JobListing[]>([]);
  const [recentSeekers, setRecentSeekers] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ jobs: 0, seekers: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: jobsData, count: jobsCount } = await supabase
          .from("job_listings")
          .select("*, user:user_id (id, username, full_name, avatar_url)", { count: "exact" })
          .eq("listing_type", "hiring")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(3);

        const { data: seekersData, count: seekersCount } = await supabase
          .from("job_listings")
          .select("*, user:user_id (id, username, full_name, avatar_url)", { count: "exact" })
          .eq("listing_type", "seeking_job")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(3);

        setRecentJobs(jobsData || []);
        setRecentSeekers(seekersData || []);
        setStats({ jobs: jobsCount || 0, seekers: seekersCount || 0 });
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
    <div className="ak-page pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="relative py-12 lg:py-16 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20">
        <div className="ak-shell">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-sm font-medium mb-4">
              <Briefcase size={16} />
              Kariyer Fırsatları
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              İş İlanları
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Amerika'daki Türk topluluğundan iş fırsatları ve yetenekler.
            </p>

            <Link href={user ? "/is/ilan-ver" : "/login?redirect=/is/ilan-ver"}>
              <Button variant="primary" size="lg" className="gap-2">
                <Plus size={20} />
                İlan Ver
              </Button>
            </Link>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.jobs}</div>
                <div className="text-sm text-neutral-500">İş İlanı</div>
              </div>
              <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.seekers}</div>
                <div className="text-sm text-neutral-500">İş Arayan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="ak-shell py-8">
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/is/ariyorum" className="group">
            <Card className="h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-blue-600 transition-colors">
                      İş Arıyorum
                    </h3>
                    <p className="text-sm text-neutral-500">
                      Profilinizi oluşturun, işverenler sizi bulsun.
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/is/isci-ariyorum" className="group">
            <Card className="h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-green-200 dark:hover:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-green-600 transition-colors">
                      İşçi Arıyorum
                    </h3>
                    <p className="text-sm text-neutral-500">
                      İş ilanı verin, yetenekleri bulun.
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="ak-shell pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Job Postings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Son İş İlanları</h2>
                <Link href="/is/isci-ariyorum">
                  <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                    Tümü <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>

              {recentJobs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Briefcase className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500 mb-4">Henüz ilan yok</p>
                    <Link href="/is/ilan-ver">
                      <Button variant="primary" size="sm" className="gap-2">
                        <Plus size={16} /> İlan Ver
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <JobCard key={job.id} job={job} formatSalary={formatSalary} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Job Seekers */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Son İş Arayanlar</h2>
                <Link href="/is/ariyorum">
                  <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                    Tümü <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>

              {recentSeekers.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500 mb-4">Henüz profil yok</p>
                    <Link href="/is/ilan-ver">
                      <Button variant="primary" size="sm" className="gap-2">
                        <Plus size={16} /> Profil Oluştur
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {recentSeekers.map((seeker) => (
                    <SeekerCard key={seeker.id} seeker={seeker} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function JobCard({ job, formatSalary }: { job: JobListing; formatSalary: (min: number | null, max: number | null, type: string | null) => string }) {
  return (
    <Link href={`/is/ilan/${job.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">{JOB_CATEGORY_ICONS[job.category]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{job.title}</h3>
              {job.company_name && (
                <p className="text-sm text-neutral-500">{job.company_name}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {job.city}, {US_STATES_MAP[job.state] || job.state}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={12} />
                  {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" size="sm">{JOB_TYPE_LABELS[job.job_type]}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SeekerCard({ seeker }: { seeker: JobListing }) {
  return (
    <Link href={`/is/ilan/${seeker.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">{JOB_CATEGORY_ICONS[seeker.category]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{seeker.title}</h3>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {seeker.city}, {US_STATES_MAP[seeker.state] || seeker.state}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {JOB_TYPE_LABELS[seeker.job_type]}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" size="sm">{JOB_CATEGORY_LABELS[seeker.category]}</Badge>
                {seeker.is_remote && <Badge variant="info" size="sm">Uzaktan OK</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
