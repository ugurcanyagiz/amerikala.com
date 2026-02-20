"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  ChevronRight,
  FileText,
  LayoutDashboard,
  RefreshCcw,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import { useAuth } from "@/app/contexts/AuthContext";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "moderation", label: "Moderation", icon: Shield },
  { key: "content", label: "Content", icon: FileText },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "audit-log", label: "Audit Log", icon: Activity },
] as const;

type AdminTab = (typeof NAV_ITEMS)[number]["key"];

const KPI_CARDS = [
  { label: "Open Reviews", value: "128", delta: "+12% vs week" },
  { label: "Pending Approvals", value: "34", delta: "-8% vs week" },
  { label: "Active Moderators", value: "9", delta: "+1 this month" },
  { label: "Escalated Cases", value: "6", delta: "2 resolved today" },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, isModerator, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isModerator) {
        router.push("/");
      }
    }
  }, [authLoading, isModerator, router, user]);

  const roleLabel = useMemo(() => {
    if (profile?.role === "admin") return "Admin";
    if (profile?.role === "moderator") return "Moderator";
    return "User";
  }, [profile?.role]);

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <RefreshCcw className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!user || !isModerator) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-neutral-600">
            You do not have permission to access this console.
            <div className="mt-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                Return to homepage
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 min-h-[calc(100vh-65px)]">
      <div className="max-w-[1400px] mx-auto px-4 py-6 lg:px-6 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 h-fit lg:sticky lg:top-20">
            <div className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Admin Console</p>
              <h1 className="mt-1 text-lg font-semibold">AmerikaLa</h1>
              <Badge variant="primary" size="sm" className="mt-3">{roleLabel}</Badge>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="space-y-6">
            <header className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Workspace</p>
                  <h2 className="text-2xl font-semibold mt-1">{NAV_ITEMS.find((item) => item.key === activeTab)?.label}</h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative min-w-[240px]">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      placeholder="Search users, tickets, content..."
                      className="w-full h-10 rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
                    />
                  </div>
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Bell className="w-4 h-4" />
                    Quick Actions
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <RefreshCcw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {KPI_CARDS.map((card) => (
                <Card key={card.label} className="border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-neutral-500">{card.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold tracking-tight">{card.value}</p>
                    <p className="mt-1 text-xs text-neutral-500">{card.delta}</p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
              <Card className="border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                          <th className="px-2 py-3 font-medium">Actor</th>
                          <th className="px-2 py-3 font-medium">Action</th>
                          <th className="px-2 py-3 font-medium">Target</th>
                          <th className="px-2 py-3 font-medium">Date</th>
                          <th className="px-2 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map((row) => (
                          <tr key={row} className="border-b border-neutral-100 dark:border-neutral-800/80">
                            <td className="px-2 py-3">admin_{row}</td>
                            <td className="px-2 py-3">Updated moderation queue</td>
                            <td className="px-2 py-3">Content Item #{1000 + row}</td>
                            <td className="px-2 py-3 text-neutral-500">2026-01-1{row}</td>
                            <td className="px-2 py-3">
                              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader>
                  <CardTitle>Panel Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                  <p>
                    This is a UI-only admin console skeleton. Navigation, spacing, and hierarchy are now aligned to a
                    professional enterprise layout.
                  </p>
                  <p>
                    Active section: <span className="font-medium text-neutral-900 dark:text-neutral-100">{activeTab}</span>
                  </p>
                  <div className="rounded-lg border border-dashed border-neutral-300 p-3 text-xs text-neutral-500 dark:border-neutral-700">
                    Future data widgets and workflows can be mounted here without changing the main shell.
                  </div>
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
