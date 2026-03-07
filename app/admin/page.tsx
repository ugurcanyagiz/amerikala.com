"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
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
type UserStatus = "active" | "pending" | "suspended" | "blocked";
type PanelTab = "summary" | "history" | "friends" | "actions";
type Toast = { type: "success" | "error"; message: string } | null;

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
    is_blocked?: boolean | null;
    blocked_reason?: string | null;
    blocked_at?: string | null;
    blocked_by?: string | null;
    created_at: string | null;
    updated_at: string | null;
  } | null;
};

type ActivityItem = {
  id: string;
  type: "post" | "listing" | "job_listing" | "marketplace_listing" | "comment" | "meetup";
  label: string;
  createdAt: string | null;
};

type FriendItem = {
  userId: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  followedAt: string | null;
};

type WarningItem = {
  id: string;
  user_id: string;
  created_at: string;
  created_by_admin_id: string;
  reason: string;
  severity: "low" | "medium" | "high";
  expires_at: string | null;
};

type AuditLogItem = {
  id: string;
  created_at: string;
  actor_user_id: string;
  target_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
};

type OverviewMetrics = {
  openReviews: number;
  pendingApprovals: number;
  activeModerators: number;
  escalatedCases: number;
};

type ModerationListingItem = {
  id: string;
  table: string;
  category: string;
  title: string;
  submittedBy: string | null;
  submittedByName: string | null;
  createdAt: string | null;
  status: string;
  detail: Record<string, unknown>;
};

type ContentItem = {
  id: string;
  table: string;
  text: string;
  authorId: string | null;
  authorName: string | null;
  createdAt: string | null;
  canHide: boolean;
  hidden: boolean;
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
  blocked: "Blocked",
};

const STATUS_COLORS: Record<UserStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  suspended: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ROLE_FILTERS = ["all", "user", "moderator", "admin"] as const;
const STATUS_FILTERS = ["all", "active", "pending", "suspended", "blocked"] as const;

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin, profile } = useAuth();

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
  const [panelTab, setPanelTab] = useState<PanelTab>("summary");
  const [toast, setToast] = useState<Toast>(null);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<ActivityItem[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [friendsImplemented, setFriendsImplemented] = useState(true);
  const [friendsMessage, setFriendsMessage] = useState<string | null>(null);
  const [warnReason, setWarnReason] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [warnSeverity, setWarnSeverity] = useState<"low" | "medium" | "high">("medium");
  const [warnExpiresAt, setWarnExpiresAt] = useState("");
  const [warningsLoading, setWarningsLoading] = useState(false);
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [actionLoading, setActionLoading] = useState<"warn" | "block" | "unblock" | "role" | "revoke_warning" | "remove_connection" | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>("user");

  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics>({ openReviews: 0, pendingApprovals: 0, activeModerators: 0, escalatedCases: 0 });
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationItems, setModerationItems] = useState<ModerationListingItem[]>([]);
  const [moderationStatusFilter, setModerationStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selectedModerationItem, setSelectedModerationItem] = useState<ModerationListingItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [contentLoading, setContentLoading] = useState(false);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isAdmin) {
        router.push("/");
      }
    }
  }, [authLoading, isAdmin, router, user]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const roleLabel = useMemo(() => {
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
      const nextRole = result.user?.profile?.role as UserRole | undefined;
      if (nextRole && ["user", "moderator", "admin"].includes(nextRole)) {
        setTargetRole(nextRole);
      }
    } catch {
      setSelectedUser(null);
    } finally {
      setSelectedUserLoading(false);
    }
  }, []);

  const loadHistory = React.useCallback(async (userId: string) => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/activity`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error();
      setHistory(result.activities ?? []);
    } catch {
      setHistory([]);
      setToast({ type: "error", message: "Failed to load usage history." });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadFriends = React.useCallback(async (userId: string) => {
    setFriendsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/friends`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Failed");

      setFriendsImplemented(result.implemented !== false);
      setFriendsMessage(result.message ?? null);
      setFriends(result.friends ?? []);
    } catch {
      setFriendsImplemented(false);
      setFriendsMessage("Friends feature not implemented.");
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  async function removeConnection(friendUserId: string) {
    if (!selectedUserId) return;
    if (!window.confirm("Remove this connection?")) return;

    setActionLoading("remove_connection");
    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}/friends`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendUserId }),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to remove connection");

      setToast({ type: "success", message: result.message ?? "Connection removed." });
      await loadFriends(selectedUserId);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Action failed." });
    } finally {
      setActionLoading(null);
    }
  }

  const loadWarnings = React.useCallback(async (userId: string) => {
    setWarningsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/warnings`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Failed to load warnings");
      setWarnings(result.warnings ?? []);
    } catch {
      setWarnings([]);
      setToast({ type: "error", message: "Failed to load warnings." });
    } finally {
      setWarningsLoading(false);
    }
  }, []);

  async function createWarning() {
    if (!selectedUserId) return;
    if (!warnReason.trim()) {
      setToast({ type: "error", message: "Warning reason is required." });
      return;
    }
    if (!window.confirm("Create warning for this user?")) return;

    setActionLoading("warn");
    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}/warnings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: warnReason,
          severity: warnSeverity,
          expiresAt: warnExpiresAt || null,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to create warning");

      setToast({ type: "success", message: result.message ?? "Warning created." });
      setWarnReason("");
      setWarnExpiresAt("");
      await loadWarnings(selectedUserId);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Action failed." });
    } finally {
      setActionLoading(null);
    }
  }

  async function revokeWarning(warningId: string) {
    if (!selectedUserId) return;
    if (!window.confirm("Revoke this warning?")) return;

    setActionLoading("revoke_warning");
    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}/warnings/${warningId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to revoke warning");

      setToast({ type: "success", message: result.message ?? "Warning revoked." });
      await loadWarnings(selectedUserId);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Action failed." });
    } finally {
      setActionLoading(null);
    }
  }

  const loadAuditLogs = React.useCallback(async () => {
    setAuditLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(auditPage), pageSize: "20" });
      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to load audit logs.");
      setAuditLogs(result.logs ?? []);
      setAuditPage(result.page ?? 1);
      setAuditTotalPages(result.totalPages ?? 1);
    } catch (error) {
      setAuditLogs([]);
      setToast({ type: "error", message: error instanceof Error ? error.message : "Unable to load audit logs." });
    } finally {
      setAuditLogsLoading(false);
    }
  }, [auditPage]);

  const loadOverviewMetrics = React.useCallback(async () => {
    setOverviewLoading(true);
    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to load overview metrics.");
      setOverviewMetrics(result.metrics ?? { openReviews: 0, pendingApprovals: 0, activeModerators: 0, escalatedCases: 0 });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Unable to load overview metrics." });
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadModerationItems = React.useCallback(async () => {
    setModerationLoading(true);
    try {
      const params = new URLSearchParams({ status: moderationStatusFilter, q: searchQuery, page: "1", pageSize: "50" });
      const response = await fetch(`/api/admin/moderation?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to load moderation queue.");
      setModerationItems(result.items ?? []);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Unable to load moderation queue." });
      setModerationItems([]);
    } finally {
      setModerationLoading(false);
    }
  }, [moderationStatusFilter, searchQuery]);

  async function runModerationAction(item: ModerationListingItem, action: "approve" | "reject") {
    if (action === "reject" && !rejectionReason.trim()) {
      setToast({ type: "error", message: "Rejection reason is required." });
      return;
    }

    const previous = moderationItems;
    setModerationItems((current) => current.map((entry) => (entry.id === item.id && entry.table === item.table ? { ...entry, status: action === "approve" ? "approved" : "rejected" } : entry)));

    try {
      const response = await fetch(`/api/admin/moderation/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: item.table, action, rejectionReason: action === "reject" ? rejectionReason : undefined }),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Action failed.");
      setToast({ type: "success", message: action === "approve" ? "Listing approved." : "Listing rejected." });
      setRejectionReason("");
      await Promise.all([loadOverviewMetrics(), loadModerationItems()]);
    } catch (error) {
      setModerationItems(previous);
      setToast({ type: "error", message: error instanceof Error ? error.message : "Action failed." });
    }
  }

  const loadContentItems = React.useCallback(async () => {
    setContentLoading(true);
    try {
      const params = new URLSearchParams({ q: searchQuery });
      const response = await fetch(`/api/admin/content?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to load content.");
      setContentItems(result.items ?? []);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Unable to load content." });
      setContentItems([]);
    } finally {
      setContentLoading(false);
    }
  }, [searchQuery]);

  async function runContentAction(item: ContentItem, action: "hide" | "unhide" | "delete") {
    try {
      const response = await fetch(`/api/admin/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: item.table, action }),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Action failed.");
      setToast({ type: "success", message: `Content ${action} successful.` });
      await Promise.all([loadContentItems(), loadOverviewMetrics()]);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Action failed." });
    }
  }

  const runAction = async (action: "block" | "unblock" | "role") => {
    if (!selectedUserId) return;

    const actionName =
      action === "block"
        ? "block user"
        : action === "unblock"
          ? "unblock user"
          : "change role";

    if (!window.confirm(`Are you sure you want to ${actionName}?`)) {
      return;
    }

    setActionLoading(action);
    try {
      const body =
        action === "block"
          ? { action: "block", reason: blockReason }
          : action === "unblock"
            ? { action: "unblock" }
            : { action: "change_role", role: targetRole };

      const response = await fetch(`/api/admin/users/${selectedUserId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Action failed");
      }

      setToast({ type: "success", message: result.message ?? "Action completed." });
      await Promise.all([loadUsers(), loadUserDetail(selectedUserId)]);
      if (action === "block" || action === "unblock") setBlockReason("");
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Action failed." });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (activeTab !== "users") return;
    if (!user || !isAdmin) return;
    loadUsers();
  }, [activeTab, isAdmin, loadUsers, user]);

  useEffect(() => {
    if (activeTab !== "audit-log") return;
    if (!user || !isAdmin) return;
    loadAuditLogs();
  }, [activeTab, isAdmin, loadAuditLogs, user]);

  useEffect(() => {
    if (activeTab !== "overview") return;
    if (!user || !isAdmin) return;
    loadOverviewMetrics();
  }, [activeTab, isAdmin, loadOverviewMetrics, user]);

  useEffect(() => {
    if (activeTab !== "moderation") return;
    if (!user || !isAdmin) return;
    loadModerationItems();
  }, [activeTab, isAdmin, loadModerationItems, user]);

  useEffect(() => {
    if (activeTab !== "content") return;
    if (!user || !isAdmin) return;
    loadContentItems();
  }, [activeTab, isAdmin, loadContentItems, user]);

  useEffect(() => {
    if (!selectedUserId) return;
    loadUserDetail(selectedUserId);
    setPanelTab("summary");
  }, [loadUserDetail, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) return;
    if (panelTab === "history") loadHistory(selectedUserId);
    if (panelTab === "friends") loadFriends(selectedUserId);
    if (panelTab === "actions") loadWarnings(selectedUserId);
  }, [loadFriends, loadHistory, loadWarnings, panelTab, selectedUserId]);

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <RefreshCcw className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!user || !isAdmin) {
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
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 lg:px-12 lg:py-8">
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
              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Open Reviews", value: String(overviewMetrics.openReviews), delta: "Unresolved reports" },
                  { label: "Pending Approvals", value: String(overviewMetrics.pendingApprovals), delta: "Across listing categories" },
                  { label: "Active Moderators", value: String(overviewMetrics.activeModerators), delta: "Admin + moderator roles" },
                  { label: "Escalated Cases", value: String(overviewMetrics.escalatedCases), delta: "High priority reports" },
                ].map((card) => (
                  <Card key={card.label} className="border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-neutral-500">{card.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-semibold tracking-tight">{overviewLoading ? "…" : card.value}</p>
                      <p className="mt-1 text-xs text-neutral-500">{card.delta}</p>
                    </CardContent>
                  </Card>
                ))}
              </section>
            )}

            {activeTab === "moderation" && (
              <Card className="border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>Moderation Queue</CardTitle>
                    <select value={moderationStatusFilter} onChange={(event) => setModerationStatusFilter(event.target.value as "all" | "pending" | "approved" | "rejected")} className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950">
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                          <th className="px-2 py-3">Listing</th>
                          <th className="px-2 py-3">Submitted By</th>
                          <th className="px-2 py-3">Created</th>
                          <th className="px-2 py-3">Status</th>
                          <th className="px-2 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {moderationLoading ? (
                          <tr><td className="px-2 py-6 text-neutral-500" colSpan={5}>Loading moderation queue...</td></tr>
                        ) : moderationItems.length === 0 ? (
                          <tr><td className="px-2 py-6 text-neutral-500" colSpan={5}>No listings found.</td></tr>
                        ) : (
                          moderationItems.map((item) => (
                            <tr key={`${item.table}:${item.id}`} className="border-b border-neutral-100 dark:border-neutral-800/80">
                              <td className="px-2 py-3">
                                <button className="text-left" onClick={() => setSelectedModerationItem(item)}>
                                  <p className="font-medium">{item.title}</p>
                                  <p className="text-xs text-neutral-500">{item.category}</p>
                                </button>
                              </td>
                              <td className="px-2 py-3 text-neutral-600">{item.submittedByName ?? item.submittedBy ?? "—"}</td>
                              <td className="px-2 py-3 text-neutral-600">{formatDate(item.createdAt)}</td>
                              <td className="px-2 py-3">
                                <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{item.status}</span>
                              </td>
                              <td className="px-2 py-3">
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => void runModerationAction(item, "approve")}>Approve</Button>
                                  <Button variant="ghost" size="sm" onClick={() => void runModerationAction(item, "reject")}>Reject</Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3">
                    <input value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Rejection reason (required for reject)" className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950" />
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "content" && (
              <Card className="border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader>
                  <CardTitle>Content Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                          <th className="px-2 py-3">Type</th>
                          <th className="px-2 py-3">Content</th>
                          <th className="px-2 py-3">Author</th>
                          <th className="px-2 py-3">Created</th>
                          <th className="px-2 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contentLoading ? (
                          <tr><td className="px-2 py-6 text-neutral-500" colSpan={5}>Loading content...</td></tr>
                        ) : contentItems.length === 0 ? (
                          <tr><td className="px-2 py-6 text-neutral-500" colSpan={5}>No content found.</td></tr>
                        ) : (
                          contentItems.map((item) => (
                            <tr key={`${item.table}:${item.id}`} className="border-b border-neutral-100 dark:border-neutral-800/80">
                              <td className="px-2 py-3">{item.table}</td>
                              <td className="px-2 py-3 max-w-[460px] truncate">{item.text}</td>
                              <td className="px-2 py-3">{item.authorName ?? item.authorId ?? "—"}</td>
                              <td className="px-2 py-3">{formatDate(item.createdAt)}</td>
                              <td className="px-2 py-3">
                                <div className="flex gap-2">
                                  {item.canHide && (
                                    <Button variant="ghost" size="sm" onClick={() => void runContentAction(item, item.hidden ? "unhide" : "hide")}>{item.hidden ? "Unhide" : "Hide"}</Button>
                                  )}
                                  <Button variant="ghost" size="sm" onClick={() => void runContentAction(item, "delete")}>Delete</Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
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
                    <div className="text-xs text-neutral-500 flex items-center md:justify-end">Page {page} / {totalPages}</div>
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
                          <tr><td className="px-2 py-6 text-neutral-500" colSpan={6}>Loading users...</td></tr>
                        ) : users.length === 0 ? (
                          <tr><td className="px-2 py-6 text-neutral-500" colSpan={6}>No users found for current filters.</td></tr>
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
                                  {ROLE_LABELS[item.role as UserRole] ?? item.role}
                                </span>
                              </td>
                              <td className="px-2 py-3">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status]}`}>{STATUS_LABELS[item.status]}</span>
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
                    <Button variant="ghost" size="sm" className="gap-1" disabled={page <= 1 || usersLoading} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1" disabled={page >= totalPages || usersLoading} onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}>
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "audit-log" && (
              <Card className="border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Audit Log</CardTitle>
                    <span className="text-xs text-neutral-500">Page {auditPage} / {auditTotalPages}</span>
                  </div>
                  <p className="text-xs text-neutral-500">Server-side admin actions and reads.</p>
                </CardHeader>
                <CardContent>
                  {auditLogsLoading ? (
                    <div className="space-y-2">
                      {[1,2,3,4].map((i)=> (
                        <div key={i} className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                      ))}
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-4 text-sm text-neutral-500">
                      No audit logs found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-sm">
                        <thead>
                          <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                            <th className="px-2 py-3">Time</th>
                            <th className="px-2 py-3">Actor</th>
                            <th className="px-2 py-3">Action</th>
                            <th className="px-2 py-3">Target</th>
                            <th className="px-2 py-3">Entity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="border-b border-neutral-100 dark:border-neutral-800/80">
                              <td className="px-2 py-3 text-neutral-600">{formatDate(log.created_at)}</td>
                              <td className="px-2 py-3">{log.actor_user_id}</td>
                              <td className="px-2 py-3">{log.action}</td>
                              <td className="px-2 py-3">{log.target_user_id ?? "—"}</td>
                              <td className="px-2 py-3">{log.entity_type}{log.entity_id ? `:${log.entity_id}` : ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" disabled={auditPage <= 1 || auditLogsLoading} onClick={() => setAuditPage((p) => Math.max(1, p - 1))}>
                      Prev
                    </Button>
                    <Button variant="ghost" size="sm" disabled={auditPage >= auditTotalPages || auditLogsLoading} onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}>
                      Next
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
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">User Management Panel</h3>
              <button onClick={() => setSelectedUserId(null)} className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              {([
                ["summary", "Profile Summary"],
                ["history", "Usage History"],
                ["friends", "Friends"],
                ["actions", "Admin Actions"],
              ] as Array<[PanelTab, string]>).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPanelTab(key)}
                  className={`px-3 py-1.5 text-sm rounded-md ${panelTab === key ? "bg-blue-600 text-white" : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {selectedUserLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-4 w-56 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              </div>
            ) : !selectedUser ? (
              <p className="text-sm text-rose-600">Unable to load user details.</p>
            ) : (
              <>
                {panelTab === "summary" && (
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-neutral-500">Name</p>
                      <p className="font-medium">{selectedUser.profile?.full_name ?? selectedUser.profile?.username ?? "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Email</p>
                      <p className="font-medium">{selectedUser.email ?? "—"}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><p className="text-neutral-500">Role</p><p className="font-medium">{selectedUser.profile?.role ?? "user"}</p></div>
                      <div><p className="text-neutral-500">Status</p><p className="font-medium">{STATUS_LABELS[selectedUser.status]}</p></div>
                      <div><p className="text-neutral-500">Created</p><p className="font-medium">{formatDate(selectedUser.createdAt)}</p></div>
                    </div>
                    {selectedUser.profile?.is_blocked && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                        <p className="font-medium">Blocked</p>
                        <p className="mt-1">Reason: {selectedUser.profile?.blocked_reason || "—"}</p>
                        <p className="mt-1">Blocked at: {formatDate(selectedUser.profile?.blocked_at ?? null)}</p>
                      </div>
                    )}
                  </div>
                )}

                {panelTab === "history" && (
                  <div>
                    {historyLoading ? (
                      <p className="text-sm text-neutral-500">Loading usage history...</p>
                    ) : history.length === 0 ? (
                      <p className="text-sm text-neutral-500">No activity found.</p>
                    ) : (
                      <div className="space-y-2">
                        {history.map((item) => (
                          <div key={item.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium">{item.type.replace("_", " ")}</p>
                              <span className="text-xs text-neutral-500">{formatDate(item.createdAt)}</span>
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {panelTab === "friends" && (
                  <div>
                    {friendsLoading ? (
                      <p className="text-sm text-neutral-500">Loading friends...</p>
                    ) : !friendsImplemented ? (
                      <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-3 text-sm text-neutral-500">
                        {friendsMessage ?? "Friends feature not implemented."}
                      </div>
                    ) : friends.length === 0 ? (
                      <p className="text-sm text-neutral-500">No friends found.</p>
                    ) : (
                      <div className="space-y-2">
                        {friends.map((friend) => (
                          <div key={friend.userId} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">{friend.fullName ?? friend.username ?? "Unknown"}</p>
                              <p className="text-xs text-neutral-500">@{friend.username ?? "unknown"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-neutral-500">{formatDate(friend.followedAt)}</span>
                              {profile?.role === "admin" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={actionLoading !== null}
                                  onClick={() => removeConnection(friend.userId)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {panelTab === "actions" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Warnings</p>
                      <textarea
                        value={warnReason}
                        onChange={(event) => setWarnReason(event.target.value)}
                        rows={3}
                        placeholder="Reason for warning"
                        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <select
                          value={warnSeverity}
                          onChange={(event) => setWarnSeverity(event.target.value as "low" | "medium" | "high")}
                          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                        <input
                          type="datetime-local"
                          value={warnExpiresAt}
                          onChange={(event) => setWarnExpiresAt(event.target.value)}
                          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={actionLoading !== null || !isAdmin}
                          onClick={createWarning}
                          className="gap-2"
                        >
                          <AlertTriangle className="w-4 h-4" /> Create Warning
                        </Button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {warningsLoading ? (
                          <p className="text-sm text-neutral-500">Loading warnings...</p>
                        ) : warnings.length === 0 ? (
                          <p className="text-sm text-neutral-500">No warnings found.</p>
                        ) : (
                          warnings.map((warning) => (
                            <div key={warning.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium">{warning.reason}</p>
                                  <p className="text-xs text-neutral-500 mt-1">
                                    Severity: {warning.severity.toUpperCase()} · Created: {formatDate(warning.created_at)} · Expires: {formatDate(warning.expires_at)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={actionLoading !== null || !isAdmin}
                                  onClick={() => revokeWarning(warning.id)}
                                >
                                  Revoke
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Block Controls</p>
                      <input
                        type="text"
                        value={blockReason}
                        onChange={(event) => setBlockReason(event.target.value)}
                        placeholder="Block reason"
                        className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                      />
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" disabled={actionLoading !== null || !isAdmin} onClick={() => runAction("block")}>
                          Block
                        </Button>
                        <Button variant="ghost" size="sm" disabled={actionLoading !== null || !isAdmin} onClick={() => runAction("unblock")}>
                          Unblock
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Role Change (Admin Only)</p>
                      <div className="flex gap-2 items-center">
                        <select
                          value={targetRole}
                          onChange={(event) => setTargetRole(event.target.value as UserRole)}
                          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                        >
                          {(["user", "moderator", "admin"] as UserRole[]).map((role) => (
                            <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                          ))}
                        </select>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={actionLoading !== null || profile?.role !== "admin"}
                          onClick={() => runAction("role")}
                        >
                          Update Role
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {selectedModerationItem && (
        <div className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm" onClick={() => setSelectedModerationItem(null)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white p-6 shadow-2xl dark:bg-neutral-900 overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Listing Details</h3>
              <button onClick={() => setSelectedModerationItem(null)} className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-neutral-500">Title:</span> {selectedModerationItem.title}</p>
              <p><span className="text-neutral-500">Category:</span> {selectedModerationItem.category}</p>
              <p><span className="text-neutral-500">Status:</span> {selectedModerationItem.status}</p>
              <p><span className="text-neutral-500">Submitted by:</span> {selectedModerationItem.submittedByName ?? selectedModerationItem.submittedBy ?? "—"}</p>
              <p><span className="text-neutral-500">Created:</span> {formatDate(selectedModerationItem.createdAt)}</p>
            </div>
            <pre className="mt-4 rounded-lg bg-neutral-100 p-3 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 overflow-auto">
              {JSON.stringify(selectedModerationItem.detail, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed right-4 top-4 z-[60] rounded-lg px-4 py-3 text-sm text-white shadow-lg ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
