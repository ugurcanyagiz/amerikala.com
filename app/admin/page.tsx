"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  RefreshCcw,
  Search,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/app/contexts/AuthContext";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { ROLE_LABELS, UserRole } from "@/lib/types";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "moderation", label: "Moderation", icon: Shield },
  { key: "content", label: "Content", icon: FileText },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "audit-log", label: "Audit Log", icon: Activity },
] as const;

type AdminTab = (typeof NAV_ITEMS)[number]["key"];
type UserStatus = "active" | "pending" | "suspended";

type AdminUserListItem = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole | string;
  status: UserStatus;
  createdAt: string | null;
  lastSeen: string | null;
};

type AdminUserDetail = {
  id: string;
  email: string | null;
  createdAt: string | null;
  lastSeen: string | null;
  status: UserStatus;
  profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole | string | null;
    is_verified: boolean | null;
    created_at: string | null;
    updated_at: string | null;
  } | null;
};

const KPI_CARDS = [
  { label: "Open Reviews", value: "128", delta: "+12% vs week" },
  { label: "Pending Approvals", value: "34", delta: "-8% vs week" },
  { label: "Active Moderators", value: "9", delta: "+1 this month" },
  { label: "Escalated Cases", value: "6", delta: "2 resolved today" },
];

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
};

const STATUS_COLORS: Record<UserStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  suspended: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

const ROLE_FILTERS = ["all", "user", "moderator", "admin", "ultra_admin"] as const;
const STATUS_FILTERS = ["all", "active", "pending", "suspended"] as const;

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, isModerator, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_FILTERS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [page, setPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);

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
    if (profile?.role === "ultra_admin") return "Ultra Admin";
    if (profile?.role === "admin") return "Admin";
    if (profile?.role === "moderator") return "Moderator";
    return "User";
  }, [profile?.role]);

  const activeLabel = NAV_ITEMS.find((item) => item.key === activeTab)?.label;

  const loadUsers = React.useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        role: roleFilter,
        status: statusFilter,
        page: String(page),
        pageSize: "10",
      });

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Users could not be loaded.");
      }

      setUsers(result.users ?? []);
      setTotalUsers(result.total ?? 0);
      setTotalPages(result.totalPages ?? 1);
      setPage(result.page ?? 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Users could not be loaded.";
      setUsersError(message);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [page, roleFilter, searchQuery, statusFilter]);

  const loadUserDetail = React.useCallback(async (userId: string) => {
    setSelectedUserLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "GET",
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "User detail could not be loaded.");
      }

      setSelectedUser(result.user as AdminUserDetail);
    } catch {
      setSelectedUser(null);
    } finally {
      setSelectedUserLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "users") return;
    if (!user || !isModerator) return;
    loadUsers();
  }, [activeTab, isModerator, loadUsers, user]);

  useEffect(() => {
    if (!selectedUserId) return;
    loadUserDetail(selectedUserId);
  }, [loadUserDetail, selectedUserId]);

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
                const isActive = activeTab === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
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
                  <h2 className="text-2xl font-semibold mt-1">{activeLabel}</h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative min-w-[240px]">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => {
                        setPage(1);
                        setSearchQuery(event.target.value);
                      }}
                      placeholder={activeTab === "users" ? "Search by email or name..." : "Search..."}
                      className="w-full h-10 rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
                    />
                  </div>
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Bell className="w-4 h-4" />
                    Quick Actions
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      if (activeTab === "users") {
                        loadUsers();
                      }
                    }}
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </header>

            {activeTab === "overview" && (
              <>
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
              </>
            )}

            {activeTab === "users" && (
              <Card className="border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>Users</CardTitle>
                    <span className="text-xs text-neutral-500">Total: {totalUsers}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <select
                      value={roleFilter}
                      onChange={(event) => {
                        setRoleFilter(event.target.value as (typeof ROLE_FILTERS)[number]);
                        setPage(1);
                      }}
                      className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                    >
                      {ROLE_FILTERS.map((role) => (
                        <option key={role} value={role}>
                          {role === "all" ? "All Roles" : role}
                        </option>
                      ))}
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(event) => {
                        setStatusFilter(event.target.value as (typeof STATUS_FILTERS)[number]);
                        setPage(1);
                      }}
                      className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                    >
                      {STATUS_FILTERS.map((status) => (
                        <option key={status} value={status}>
                          {status === "all" ? "All Statuses" : STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-neutral-500 flex items-center md:justify-end">
                      Page {page} / {totalPages}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersError && <p className="text-sm text-rose-600 mb-3">{usersError}</p>}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                          <th className="px-2 py-3">User</th>
                          <th className="px-2 py-3">Email</th>
                          <th className="px-2 py-3">Role</th>
                          <th className="px-2 py-3">Status</th>
                          <th className="px-2 py-3">Created</th>
                          <th className="px-2 py-3">Last Seen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersLoading ? (
                          <tr>
                            <td className="px-2 py-6 text-neutral-500" colSpan={6}>
                              Loading users...
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td className="px-2 py-6 text-neutral-500" colSpan={6}>
                              No users found for current filters.
                            </td>
                          </tr>
                        ) : (
                          users.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer dark:border-neutral-800/80 dark:hover:bg-neutral-800/40"
                              onClick={() => {
                                setSelectedUserId(item.id);
                                setSelectedUser(null);
                              }}
                            >
                              <td className="px-2 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                                    {item.avatarUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={item.avatarUrl} alt={item.name ?? "Avatar"} className="h-full w-full object-cover" />
                                    ) : (
                                      <span>{(item.name ?? "U").slice(0, 2).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <span className="font-medium">{item.name ?? "Unknown"}</span>
                                </div>
                              </td>
                              <td className="px-2 py-3 text-neutral-600">{item.email ?? "—"}</td>
                              <td className="px-2 py-3">
                                <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                  {ROLE_LABELS[(item.role as UserRole)] ?? item.role}
                                </span>
                              </td>
                              <td className="px-2 py-3">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                                  {STATUS_LABELS[item.status]}
                                </span>
                              </td>
                              <td className="px-2 py-3 text-neutral-600">{formatDate(item.createdAt)}</td>
                              <td className="px-2 py-3 text-neutral-600">{formatDate(item.lastSeen)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      disabled={page <= 1 || usersLoading}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      disabled={page >= totalPages || usersLoading}
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>

      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-sm" onClick={() => setSelectedUserId(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-lg bg-white p-6 shadow-2xl dark:bg-neutral-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">User Management Panel</h3>
              <button
                onClick={() => setSelectedUserId(null)}
                className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedUserLoading ? (
              <p className="text-sm text-neutral-500">Loading user details...</p>
            ) : !selectedUser ? (
              <p className="text-sm text-rose-600">Unable to load user details.</p>
            ) : (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-neutral-500">Name</p>
                  <p className="font-medium">{selectedUser.profile?.full_name ?? selectedUser.profile?.username ?? "Unknown"}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Email</p>
                  <p className="font-medium">{selectedUser.email ?? "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-neutral-500">Role</p>
                    <p className="font-medium">{selectedUser.profile?.role ?? "user"}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Status</p>
                    <p className="font-medium">{STATUS_LABELS[selectedUser.status]}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-neutral-500">Created</p>
                    <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Last Seen</p>
                    <p className="font-medium">{formatDate(selectedUser.lastSeen)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
