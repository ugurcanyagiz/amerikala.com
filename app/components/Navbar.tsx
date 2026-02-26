"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState, useRef, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getTimeAgo, useNotifications } from "../contexts/NotificationContext";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { getMessagePreviews, markConversationMessagesAsRead, type MessagePreview } from "@/lib/messages";
import { supabase } from "@/lib/supabase/client";
import { searchSiteContent, type SiteSearchResult } from "@/lib/siteSearch";
import { devLog } from "@/lib/debug/devLogger";
import {
  Home,
  Calendar,
  Building2,
  Briefcase,
  ShoppingBag,
  User,
  Settings,
  LogOut,
  Bell,
  MessageSquare,
  Search,
  Menu,
  X,
  ChevronDown,
  Plus,
  List,
  Users,
  Shield,
  Package,
} from "lucide-react";

// Navigation structure
const NAV_ITEMS = [
  {
    id: "home",
    label: "Anasayfa",
    href: "/",
    icon: Home,
  },
  {
    id: "meetups",
    label: "Etkinlikler",
    icon: Calendar,
    children: [
      { href: "/meetups", label: "Etkinlikler", icon: Calendar, description: "Yaklaşan etkinlikler" },
      { href: "/groups", label: "Gruplar", icon: Users, description: "Topluluklar" },
      { href: "/meetups/create", label: "Etkinlik Oluştur", icon: Plus, accent: true },
      { href: "/meetups/my-events", label: "Etkinliklerim", icon: List },
    ],
  },
  {
    id: "emlak",
    label: "Emlak",
    icon: Building2,
    children: [
      { href: "/emlak/kiralik", label: "Kiralık", icon: Building2, description: "Kiralık ilanlar" },
      { href: "/emlak/satilik", label: "Satılık", icon: Building2, description: "Satılık ilanlar" },
      { href: "/emlak/ilan-ver", label: "İlan Ver", icon: Plus, accent: true },
      { href: "/emlak/ilanlarim", label: "İlanlarım", icon: List },
    ],
  },
  {
    id: "is",
    label: "İş",
    icon: Briefcase,
    children: [
      { href: "/is/ariyorum", label: "İş Arayanlar", icon: User, description: "İş arayan profilleri" },
      { href: "/is/isci-ariyorum", label: "İşçi Arayanlar", icon: Briefcase, description: "Açık pozisyonlar" },
      { href: "/is/ilan-ver", label: "İlan Ver", icon: Plus, accent: true },
      { href: "/is/ilanlarim", label: "İlanlarım", icon: List },
    ],
  },
  {
    id: "alisveris",
    label: "Alışveriş",
    icon: ShoppingBag,
    children: [
      { href: "/alisveris", label: "Tüm İlanlar", icon: Package, description: "Ürün ve hizmetler" },
      { href: "/alisveris/ilan-ver", label: "İlan Ver", icon: Plus, accent: true },
      { href: "/alisveris/ilanlarim", label: "İlanlarım", icon: List },
    ],
  },
];


function getRoleBadge(role?: string | null) {
  if (role === "admin") {
    return { label: "Admin", variant: "error" as const };
  }

  if (role === "moderator") {
    return { label: "Moderator", variant: "warning" as const };
  }

  return { label: "User", variant: "default" as const };
}

function getDisplayName(
  profile: { first_name?: string | null; last_name?: string | null; full_name?: string | null; username?: string | null } | null | undefined,
  user?: { email?: string | null; user_metadata?: unknown } | null
) {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataFullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const metadataName = typeof metadata.name === "string" ? metadata.name.trim() : "";

  const explicitFullName = profile?.full_name?.trim();
  if (explicitFullName) return explicitFullName;
  if (metadataFullName) return metadataFullName;
  if (metadataName) return metadataName;

  const profileName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  if (profileName) return profileName;

  const metadataFirstName = typeof metadata.first_name === "string" ? metadata.first_name.trim() : "";
  const metadataLastName = typeof metadata.last_name === "string" ? metadata.last_name.trim() : "";
  const metadataCombinedName = [metadataFirstName, metadataLastName].filter(Boolean).join(" ").trim();
  if (metadataCombinedName) return metadataCombinedName;

  const metadataUsername = typeof metadata.username === "string" ? metadata.username.trim() : "";
  const emailLocalPart = user?.email?.split("@")[0]?.trim();

  return profile?.username || metadataUsername || emailLocalPart || "Kullanıcı";
}

function getAvatarUrl(
  profile: { avatar_url?: string | null } | null | undefined,
  user?: { user_metadata?: unknown } | null
) {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataAvatar = typeof metadata.avatar_url === "string" ? metadata.avatar_url : typeof metadata.picture === "string" ? metadata.picture : null;

  return profile?.avatar_url || metadataAvatar || "/logo.png";
}

function getUsernameLabel(
  profile: { username?: string | null } | null | undefined,
  user?: { email?: string | null; user_metadata?: unknown } | null
) {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataUsername = typeof metadata.username === "string" ? metadata.username.trim() : "";
  const username = profile?.username?.trim() || metadataUsername;

  if (username) return username.startsWith("@") ? username : `@${username}`;

  const emailLocalPart = user?.email?.split("@")[0]?.trim();
  if (emailLocalPart) return `@${emailLocalPart}`;

  return "@user";
}

function formatMessageTime(dateString: string | null | undefined) {
  if (!dateString) return "Bilinmiyor";

  const createdAt = new Date(dateString);
  if (Number.isNaN(createdAt.getTime())) return "Bilinmiyor";

  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Şimdi";
  if (minutes < 60) return `${minutes} dk`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;

  return createdAt.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

const SEARCH_TYPE_LABELS: Record<SiteSearchResult["type"], string> = {
  event: "Etkinlik",
  realEstate: "Emlak",
  job: "İş",
  marketplace: "Alışveriş",
  group: "Grup",
  profile: "Profil",
  post: "Feed",
};

// Dropdown Component
function NavDropdown({
  item, 
  isOpen, 
  onToggle, 
  onClose 
}: { 
  item: {
    id: string;
    label: string;
    href?: string;
    icon: typeof Home;
    children?: {
      href: string;
      label: string;
      icon: typeof Home;
      description?: string;
      accent?: boolean;
    }[];
  };
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const Icon = item.icon;
  
  const hasChildren = 'children' in item && item.children;
  const isActive = hasChildren 
    ? item.children?.some(child => pathname.startsWith(child.href))
    : pathname === item.href;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!hasChildren) {
    return (
      <Link
        href={item.href!}
        className={`
          group relative flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold uppercase tracking-wide
          transition-colors duration-200 hover:bg-[rgba(var(--color-trust-rgb),0.05)]
          ${isActive
            ? "text-[var(--color-ink)]"
            : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
          }
        `}
      >
        <Icon size={16} className="hidden xl:block" />
        <span className="inline">{item.label}</span>
        <span
          aria-hidden="true"
          className={`absolute bottom-0 left-3 right-3 h-0.5 origin-center rounded-full bg-[var(--color-primary)] transition-transform duration-200 ${
            isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
        />
      </Link>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={onToggle}
        className={`
          group relative flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold uppercase tracking-wide
          transition-colors duration-200 hover:bg-[rgba(var(--color-trust-rgb),0.05)]
          ${isActive || isOpen
            ? "text-[var(--color-ink)]"
            : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
          }
        `}
      >
        <Icon size={16} className="hidden xl:block" />
        <span className="inline">{item.label}</span>
        <ChevronDown 
          size={14} 
          className={`hidden lg:block transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
        <span
          aria-hidden="true"
          className={`absolute bottom-0 left-3 right-3 h-0.5 origin-center rounded-full bg-[var(--color-primary)] transition-transform duration-200 ${
            isActive || isOpen ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 py-2 bg-[var(--color-surface-raised)] rounded-2xl shadow-xl border border-[var(--color-border-light)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {item.children?.map((child) => {
            const ChildIcon = child.icon;
            const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/");
            
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl
                  transition-all duration-150
                  ${child.accent 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 my-2" 
                    : isChildActive
                      ? "bg-[var(--color-surface-sunken)] text-[var(--color-ink)]"
                      : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)]"
                  }
                `}
              >
                <ChildIcon size={18} className={child.accent ? "text-white" : ""} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{child.label}</div>
                  {child.description && (
                    <div className={`text-xs truncate ${child.accent ? "text-blue-100" : "text-[var(--color-ink-tertiary)]"}`}>
                      {child.description}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const POPOVER_PANEL_CLASSNAME = "absolute right-0 top-full mt-2 z-50 overflow-hidden border border-[var(--color-border-light)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] shadow-[var(--shadow-raised)] animate-in fade-in slide-in-from-top-2 duration-200";

function SearchPanel({ children }: { children: ReactNode }) {
  return <div className={`${POPOVER_PANEL_CLASSNAME} w-[420px] max-w-[90vw]`}>{children}</div>;
}

function NotificationsPanel({ children }: { children: ReactNode }) {
  return <div className={`${POPOVER_PANEL_CLASSNAME} w-[380px] max-w-[86vw]`}>{children}</div>;
}

function MessagesPanel({ children }: { children: ReactNode }) {
  return <div className={`${POPOVER_PANEL_CLASSNAME} w-[370px] max-w-[90vw]`}>{children}</div>;
}

function ProfileMenuPanel({ children }: { children: ReactNode }) {
  return <div className={`${POPOVER_PANEL_CLASSNAME} w-56 py-2`}>{children}</div>;
}

// Mobile Bottom Navigation
function MobileBottomNav() {
  const pathname = usePathname();

  const mobileItems = [
    { href: "/", icon: null, label: "amerikala", isLogo: true },
    { href: "/emlak", icon: Building2, label: "Emlak" },
    { href: "/is", icon: Briefcase, label: "İş" },
    { href: "/alisveris", icon: ShoppingBag, label: "Market" },
    { href: "/meetups", icon: Calendar, label: "Etkinlik" },
    { href: "/profile", icon: User, label: "Profil" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)]/90 backdrop-blur-xl border-t border-[var(--color-border-light)] z-50 safe-area-inset-bottom">
      <div className="h-16 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 min-w-max px-2 h-full">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" 
            ? pathname === "/" 
            : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center justify-center gap-2 h-11 px-4 rounded-xl shrink-0
                transition-all duration-200
                ${isActive 
                  ? "text-[var(--color-primary)]" 
                  : "text-[var(--color-ink-tertiary)] "
                }
              `}
            >
              {item.isLogo ? (
                <Image
                  src="/logo.png"
                  alt="Amerikala"
                  width={18}
                  height={18}
                  className="h-[18px] w-auto"
                />
              ) : Icon ? (
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              ) : null}
              <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
        </div>
      </div>
    </nav>
  );
}

// Mobile Menu Sheet
function MobileMenuSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const roleBadge = getRoleBadge(profile?.role);
  const router = useRouter();
  const displayName = getDisplayName(profile, user);
  const usernameLabel = getUsernameLabel(profile, user);

  const handleSignOut = async () => {
    await signOut();
    onClose();
    router.push("/");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[rgba(var(--color-trust-rgb),0.5)] backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[var(--color-surface-raised)] shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-light)]">
            <span className="font-bold text-lg">Menü</span>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--color-surface-sunken)]"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-[var(--color-border-light)]">
              <Link href="/profile" onClick={onClose} className="flex items-center gap-3">
                <Avatar
                  src={getAvatarUrl(profile, user)}
                  fallback={displayName}
                  size="lg"
                />
                <div>
                  <div className="font-semibold">{displayName}</div>
                  <div className="text-sm text-[var(--color-ink-tertiary)]">{usernameLabel}</div>
                  <Badge variant={roleBadge.variant} size="sm" className="mt-1">{roleBadge.label}</Badge>
                </div>
              </Link>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const hasChildren = 'children' in item && item.children;

              if (!hasChildren) {
                return (
                  <Link
                    key={item.id}
                    href={item.href!}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)]"
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              }

              return (
                <div key={item.id} className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-[var(--color-ink-tertiary)] uppercase tracking-wider">
                    {item.label}
                  </div>
                  {item.children?.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-6 py-2.5
                          ${child.accent 
                            ? "text-[var(--color-primary)]" 
                            : "text-[var(--color-ink-secondary)]"
                          }
                          hover:bg-[var(--color-surface-sunken)]
                        `}
                      >
                        <ChildIcon size={18} />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {isAdmin && (
            <div className="border-t border-[var(--color-border-light)] py-2">
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-[var(--color-error)] hover:bg-[var(--color-error-light)]"
              >
                <Shield size={20} />
                <span className="font-medium">Admin Paneli</span>
              </Link>
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-4 border-t border-[var(--color-border-light)]">
            {user ? (
              <div className="space-y-2">
                <Link href="/ayarlar" onClick={onClose}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Settings size={18} />
                    Ayarlar
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-2 text-red-600"
                  onClick={handleSignOut}
                >
                  <LogOut size={18} />
                  Çıkış Yap
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" onClick={onClose}>
                  <Button variant="primary" className="w-full">Giriş Yap</Button>
                </Link>
                <Link href="/register" onClick={onClose}>
                  <Button variant="outline" className="w-full">Kayıt Ol</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Navbar Component
export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, signOut, loading, isAdmin } = useAuth();
  const userId = user?.id ?? null;
  const roleBadge = getRoleBadge(profile?.role);
  const displayName = getDisplayName(profile, user);
  const usernameLabel = getUsernameLabel(profile, user);
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications, loading: notificationLoading } = useNotifications();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SiteSearchResult[]>([]);
  const timeHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [messagePreviews, setMessagePreviews] = useState<MessagePreview[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const previewsInFlightRef = useRef(false);
  const previewsQueuedRef = useRef(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const desktopNavItems = isAdmin
    ? [
        ...NAV_ITEMS,
        {
          id: "admin",
          label: "Admin Paneli",
          href: "/admin",
          icon: Shield,
        },
      ]
    : NAV_ITEMS;

  const refreshMessagePreviews = useCallback(async ({ background = false }: { background?: boolean } = {}) => {
    if (previewsInFlightRef.current) {
      previewsQueuedRef.current = true;
      return;
    }

    if (!userId) {
      setMessagePreviews([]);
      return;
    }

    if (!background) {
      setMessagesLoading(true);
      setMessagesError(null);
    }

    devLog("navbar", "message-previews:fetch-start", { userId, background });
    previewsInFlightRef.current = true;

    try {
      const previews = await getMessagePreviews(userId);
      setMessagePreviews(previews);
      devLog("navbar", "message-previews:set", { count: previews.length });
    } catch (error) {
      const isAbortError = (() => {
        if (!error) return false;
        if (error instanceof DOMException) {
          return error.name === "AbortError" || error.name === "TimeoutError";
        }

        if (typeof error !== "object") return false;

        const maybeError = error as { name?: string; message?: string; details?: string; code?: string };
        const combinedText = `${maybeError.name || ""} ${maybeError.message || ""} ${maybeError.details || ""} ${maybeError.code || ""}`.toLowerCase();

        return (
          maybeError.name === "AbortError" ||
          maybeError.name === "TimeoutError" ||
          combinedText.includes("aborterror") ||
          combinedText.includes("signal is aborted") ||
          combinedText.includes("request aborted")
        );
      })();

      if (isAbortError) {
        return;
      }

      console.error("Mesaj önizlemeleri alınamadı:", error);
      if (!background) {
        setMessagesError("Mesajlar yüklenemedi.");
      }
    } finally {
      previewsInFlightRef.current = false;
      if (!background) {
        setMessagesLoading(false);
      }
      devLog("navbar", "message-previews:fetch-end", { userId, background });

      if (previewsQueuedRef.current) {
        previewsQueuedRef.current = false;
        void refreshMessagePreviews({ background });
      }
    }
  }, [userId]);

  // Close menu/panels on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }

      if (notificationPanelRef.current && !notificationPanelRef.current.contains(e.target as Node)) {
        setNotificationPanelOpen(false);
      }

      if (messagesRef.current && !messagesRef.current.contains(e.target as Node)) {
        setMessagesOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    devLog("navbar", "startup-refresh:run", { userId });
    void refreshMessagePreviews({ background: true });

    if (!userId) {
      return;
    }

    const channel = supabase
      .channel(`navbar-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          void refreshMessagePreviews({ background: true });
        }
      )
      .subscribe();

    const handleFocus = () => {
      void refreshMessagePreviews({ background: true });
      void refreshNotifications();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      supabase.removeChannel(channel);
    };
  }, [refreshMessagePreviews, refreshNotifications, userId]);

  useEffect(() => {
    void refreshMessagePreviews({ background: true });
    void refreshNotifications();
  }, [pathname, refreshMessagePreviews, refreshNotifications]);

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();

    if (!searchOpen || normalizedQuery.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchSiteContent(normalizedQuery, 4);
        setSearchResults(results.slice(0, 8));
      } catch (error) {
        console.error("Navbar arama hatası:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchOpen, searchQuery]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    router.push("/");
  };

  const totalUnreadMessages = messagePreviews.reduce((sum, item) => sum + item.unreadCount, 0);
  const latestNotifications = notifications.slice(0, 12);

  return (
    <>
      <header className="hidden md:block sticky top-0 z-40 w-full h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-xl">
        <div className="mx-auto h-full max-w-7xl px-6">
          <div className="flex h-full items-center">
            <div className="flex flex-1 items-center justify-start">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Amerikala ana sayfa">
                <Image
                  src="/logo.png"
                  alt="Amerikala logosu"
                  width={36}
                  height={36}
                  priority
                  className="h-9 w-9"
                />
                <span className="text-lg font-bold tracking-[0.12em] text-[var(--color-ink)] uppercase">amerikala</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden flex-1 items-center justify-center md:flex">
              <nav className="flex items-center gap-2 lg:gap-4">
                {desktopNavItems.map((item) => (
                  <NavDropdown
                    key={item.id}
                    item={item}
                    isOpen={openDropdown === item.id}
                    onToggle={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                    onClose={() => setOpenDropdown(null)}
                  />
                ))}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex flex-1 items-center justify-end gap-2">
              {/* Search Button */}
              <div ref={searchRef} className="relative hidden sm:block">
                <button
                  onClick={() => setSearchOpen((prev) => !prev)}
                  className="rounded-full p-2.5 text-[var(--color-ink-secondary)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)]"
                  aria-label="Sitede ara"
                  aria-expanded={searchOpen}
                >
                  <Search size={20} />
                </button>

                {searchOpen && (
                  <SearchPanel>
                    <div className="p-3 border-b border-[var(--color-border-light)]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 rounded-xl border border-[var(--color-border-light)] px-3 py-2">
                          <Search size={16} className="text-[var(--color-ink-tertiary)]" />
                          <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                                setSearchOpen(false);
                              }
                            }}
                            placeholder="Sitede ara..."
                            className="w-full border-none bg-[var(--color-surface-raised)] text-sm outline-none"
                            autoFocus
                          />
                        </div>
                        <Link
                          href={`/search${searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : ""}`}
                          onClick={() => setSearchOpen(false)}
                          >
                          <Button variant="primary" size="sm" className="h-10 rounded-xl px-3 text-xs font-semibold">
                            Detaylı Ara
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="max-h-[340px] overflow-y-auto">
                      {searchLoading ? (
                        <p className="p-4 text-sm text-[var(--color-ink-tertiary)]">Aranıyor...</p>
                      ) : searchQuery.trim().length < 2 ? (
                        <p className="p-4 text-sm text-[var(--color-ink-tertiary)]">Aramaya başlamak için en az 2 karakter girin.</p>
                      ) : searchResults.length === 0 ? (
                        <p className="p-4 text-sm text-[var(--color-ink-tertiary)]">Sonuç bulunamadı.</p>
                      ) : (
                        searchResults.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--color-border-light)] hover:bg-[var(--color-surface-sunken)]"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[var(--color-ink)] truncate">{item.title}</p>
                              <p className="text-xs text-[var(--color-ink-tertiary)] truncate">{item.subtitle || "Detaylar için tıklayın"}</p>
                            </div>
                            <Badge variant="default" size="sm">{SEARCH_TYPE_LABELS[item.type]}</Badge>
                          </Link>
                        ))
                      )}
                    </div>
                  </SearchPanel>
                )}
              </div>

              {loading ? (
                <div className="w-9 h-9 rounded-full bg-[var(--color-surface-sunken)] animate-pulse" />
              ) : user ? (
                <>
                  {/* Notifications */}
                  <div ref={notificationPanelRef} className="relative hidden sm:block">
                    <button
                      onClick={() => {
                        const nextState = !notificationPanelOpen;
                        setNotificationPanelOpen(nextState);
                        setUserMenuOpen(false);
                        if (nextState) {
                          void refreshNotifications();
                        }
                      }}
                      className="flex p-2.5 rounded-full text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] transition-colors relative"
                      aria-label="Bildirim panelini aç"
                      aria-expanded={notificationPanelOpen}
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <Badge variant="error" size="sm" className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 text-[10px] leading-[18px] justify-center">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </button>

                    {notificationPanelOpen && (
                      <NotificationsPanel>
                        <div className="px-4 py-3 border-b border-[var(--color-border-light)] flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-[var(--color-ink)]">Bildirimler</h3>
                            <p className="text-xs text-[var(--color-ink-tertiary)]">{unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                              markAllAsRead();
                            }}
                              className="text-xs font-medium text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                            >
                              Tümünü okundu yap
                            </button>
                            <Link
                              href="/notifications"
                              onClick={() => setNotificationPanelOpen(false)}
                              className="text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                            >
                              Tümünü gör
                            </Link>
                          </div>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto">
                          {notificationLoading ? (
                            <div className="p-6 text-sm text-[var(--color-ink-tertiary)]">Bildirimler yükleniyor...</div>
                          ) : latestNotifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <Bell className="w-10 h-10 mx-auto mb-3 text-[var(--color-ink-faint)]" />
                              <p className="text-sm text-[var(--color-ink-tertiary)]">Yeni bildirimin yok.</p>
                            </div>
                          ) : (
                            latestNotifications.map((notification) => (
                              <Link
                                key={notification.id}
                                href={notification.actionUrl || "/notifications"}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  setNotificationPanelOpen(false);
                                }}
                                className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--color-border-light)] hover:bg-[var(--color-surface-sunken)] transition-colors ${
                                  !notification.isRead ? "bg-[var(--color-primary-subtle)]" : ""
                                }`}
                              >
                                <Avatar
                                  src={notification.user.avatar || undefined}
                                  fallback={notification.user.name}
                                  size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm leading-5 text-[var(--color-ink-secondary)]">
                                    <span className="font-semibold">{notification.user.name}</span> {notification.message}
                                  </p>
                                  {notification.content && (
                                    <p className="text-xs text-[var(--color-ink-tertiary)] truncate mt-0.5">{notification.content}</p>
                                  )}
                                  <p className="text-xs text-[var(--color-ink-tertiary)] mt-1" suppressHydrationWarning>
                                    {timeHydrated ? getTimeAgo(notification.createdAt) : "..."}
                                  </p>
                                </div>
                                <Badge
                                  variant={notification.type === "comments" ? "success" : notification.type === "follows" ? "warning" : "info"}
                                  size="sm"
                                >
                                  {notification.type === "mentions" ? "Bahsetme" : notification.type === "comments" ? "Yorum" : notification.type === "follows" ? "Takip" : "Sistem"}
                                </Badge>
                              </Link>
                            ))
                          )}
                        </div>
                      </NotificationsPanel>
                    )}
                  </div>

                  {/* Messages */}
                  <div ref={messagesRef} className="relative hidden sm:block">
                    <button
                      onClick={() => {
                      const nextState = !messagesOpen;
                      setMessagesOpen(nextState);
                      if (nextState) {
                        void refreshMessagePreviews();
                      }
                    }}
                      className="flex p-2.5 rounded-full text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] transition-colors relative"
                      aria-label="Mesajlar"
                    >
                      <MessageSquare size={20} />
                      {totalUnreadMessages > 0 && (
                        <Badge variant="primary" size="sm" className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 text-[10px] justify-center">
                          {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                        </Badge>
                      )}
                    </button>

                    {messagesOpen && (
                      <MessagesPanel>
                        <div className="px-4 py-3 border-b border-[var(--color-border-light)] flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-ink)]">Mesajlar</p>
                            <p className="text-xs text-[var(--color-ink-tertiary)]">{totalUnreadMessages} okunmamış mesaj</p>
                          </div>
                          <Link
                            href="/messages"
                            onClick={() => setMessagesOpen(false)}
                            className="text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                          >
                            Tümünü Gör
                          </Link>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto">
                          {messagesLoading ? (
                            <div className="p-4 text-sm text-[var(--color-ink-tertiary)]">Mesajlar yükleniyor...</div>
                          ) : messagesError ? (
                            <div className="p-4 text-sm text-[var(--color-error)]">{messagesError}</div>
                          ) : messagePreviews.length === 0 ? (
                            <div className="p-4 text-sm text-[var(--color-ink-tertiary)]">Henüz bir mesajınız yok.</div>
                          ) : (
                            messagePreviews.slice(0, 8).map((conversation) => (
                              <button
                                key={conversation.conversationId}
                                onClick={async () => {
                                  setMessagesOpen(false);
                                  if (user && conversation.unreadCount > 0) {
                                    setMessagePreviews((prev) =>
                                      prev.map((item) =>
                                        item.conversationId === conversation.conversationId
                                          ? { ...item, unreadCount: 0 }
                                          : item
                                      )
                                    );

                                    try {
                                      await markConversationMessagesAsRead(conversation.conversationId, user.id);
                                    } catch (error) {
                                      console.error("Mesajlar okundu işaretlenemedi:", error);
                                    } finally {
                                      void refreshMessagePreviews();
                                    }
                                  }
                                  router.push(`/messages?conversation=${conversation.conversationId}`);
                                }}
                                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[var(--color-surface-sunken)] transition-colors text-left border-b last:border-b-0 border-[var(--color-border-light)]"
                              >
                                <Avatar
                                  src={conversation.otherUserAvatar || undefined}
                                  fallback={conversation.otherUserName}
                                  size="md"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                                      {conversation.otherUserName}
                                    </p>
                                    <span className="text-xs text-[var(--color-ink-tertiary)] flex-shrink-0">
                                      <span suppressHydrationWarning>{timeHydrated ? formatMessageTime(conversation.lastMessageCreatedAt) : "..."}</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm text-[var(--color-ink-secondary)] truncate">
                                      {conversation.lastMessageText}
                                    </p>
                                    {conversation.unreadCount > 0 && (
                                      <Badge variant="primary" size="sm" className="min-w-5 h-5 px-1 text-[10px] justify-center">
                                        {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </MessagesPanel>
                    )}
                  </div>

                  {/* User Menu */}
                  <div ref={userMenuRef} className="relative hidden md:block">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-full border border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surface-sunken)] transition-colors"
                    >
                      <Avatar
                        src={getAvatarUrl(profile, user)}
                        fallback={displayName}
                        size="sm"
                      />
                      <div className="text-left max-w-[140px]">
                        <div className="text-sm font-medium text-[var(--color-ink)] truncate">{usernameLabel}</div>
                      </div>
                      <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {userMenuOpen && (
                      <ProfileMenuPanel>
                        <div className="px-4 py-3 border-b border-[var(--color-border-light)]">
                          <div className="font-semibold truncate">{displayName}</div>
                          <div className="text-sm text-[var(--color-ink-tertiary)] truncate">{usernameLabel}</div>
                          <Badge variant={roleBadge.variant} size="sm" className="mt-1">{roleBadge.label}</Badge>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)]"
                          >
                            <User size={18} />
                            Profilim
                          </Link>
                          <Link
                            href="/ayarlar"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)]"
                          >
                            <Settings size={18} />
                            Ayarlar
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-[var(--color-error)] hover:bg-[var(--color-error-light)]"
                            >
                              <Shield size={18} />
                              Admin Paneli
                            </Link>
                          )}
                        </div>
                        <div className="pt-1 border-t border-[var(--color-border-light)]">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-[var(--color-error)] hover:bg-[var(--color-error-light)]"
                          >
                            <LogOut size={18} />
                            Çıkış Yap
                          </button>
                        </div>
                      </ProfileMenuPanel>
                    )}
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden p-2.5 rounded-full text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
                  >
                    <Menu size={20} />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:block">
                    <Button variant="ghost" size="sm" className="h-10 rounded-lg border border-[#D9CDC3] bg-[var(--color-surface-raised)] px-4 text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)]">
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link href="/#son-ilanlar" className="hidden sm:block">
                    <Button variant="primary" size="sm" className="h-10 rounded-lg bg-[var(--color-primary)] px-4 text-white hover:bg-[var(--color-primary-hover)]">
                      Paylaşımları Gör
                    </Button>
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="sm:hidden p-2.5 rounded-full text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)]"
                  >
                    <Menu size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <MobileMenuSheet isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  );
}
