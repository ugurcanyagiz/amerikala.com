"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getTimeAgo, useNotifications } from "../contexts/NotificationContext";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { getMessagePreviews, markConversationMessagesAsRead, type MessagePreview } from "@/lib/messages";
import { supabase } from "@/lib/supabase/client";
import { searchSiteContent, type SiteSearchResult } from "@/lib/siteSearch";
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
    label: "Buluşmalar",
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

function getNotificationTypeClasses(type: "likes" | "comments" | "events") {
  if (type === "likes") return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-200";
  if (type === "comments") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200";
  return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200";
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

function formatMessageTime(dateString: string) {
  const createdAt = new Date(dateString);
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
          flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium
          transition-all duration-200
          ${isActive 
            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" 
            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-neutral-800"
          }
        `}
      >
        <Icon size={18} />
        <span className="hidden lg:inline">{item.label}</span>
      </Link>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={onToggle}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium
          transition-all duration-200
          ${isActive || isOpen
            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" 
            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-neutral-800"
          }
        `}
      >
        <Icon size={18} />
        <span className="hidden lg:inline">{item.label}</span>
        <ChevronDown 
          size={14} 
          className={`hidden lg:block transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 py-2 bg-white rounded-2xl shadow-xl border border-sky-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      : "text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  }
                `}
              >
                <ChildIcon size={18} className={child.accent ? "text-white" : ""} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{child.label}</div>
                  {child.description && (
                    <div className={`text-xs truncate ${child.accent ? "text-blue-100" : "text-slate-400"}`}>
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 z-50 safe-area-inset-bottom">
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
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-slate-500 dark:text-slate-500"
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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-neutral-900 shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sky-100">
            <span className="font-bold text-lg">Menü</span>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-sky-100">
              <Link href="/profile" onClick={onClose} className="flex items-center gap-3">
                <Avatar
                  src={getAvatarUrl(profile, user)}
                  fallback={displayName}
                  size="lg"
                />
                <div>
                  <div className="font-semibold">{displayName}</div>
                  <div className="text-sm text-slate-500">{usernameLabel}</div>
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
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-sky-50"
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              }

              return (
                <div key={item.id} className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                            ? "text-blue-600 dark:text-blue-400" 
                            : "text-neutral-600 dark:text-slate-400"
                          }
                          hover:bg-neutral-100 dark:hover:bg-neutral-800
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
            <div className="border-t border-neutral-200 dark:border-neutral-800 py-2">
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Shield size={20} />
                <span className="font-medium">Admin Paneli</span>
              </Link>
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
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
  const { user, profile, signOut, loading, isAdmin } = useAuth();
  const displayName = getDisplayName(profile, user);
  const usernameLabel = getUsernameLabel(profile, user);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading: notificationLoading } = useNotifications();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SiteSearchResult[]>([]);
  const [messagePreviews, setMessagePreviews] = useState<MessagePreview[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
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
    const loadMessagePreviews = async () => {
      if (!user) {
        setMessagePreviews([]);
        return;
      }

      setMessagesLoading(true);
      setMessagesError(null);

      try {
        const previews = await getMessagePreviews(user.id);
        setMessagePreviews(previews);
      } catch (error) {
        console.error("Mesaj önizlemeleri alınamadı:", error);
        setMessagesError("Mesajlar yüklenemedi.");
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessagePreviews();

    if (!user) {
      return;
    }

    const channel = supabase
      .channel(`navbar-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        async () => {
          try {
            const previews = await getMessagePreviews(user.id);
            setMessagePreviews(previews);
          } catch (error) {
            console.error("Realtime mesaj güncelleme hatası:", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
      <header className="hidden md:block sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xl border-b border-sky-100 shadow-[0_10px_25px_-20px_rgba(37,99,235,0.5)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
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
              <span className="text-lg font-semibold tracking-tight text-slate-900">amerikala</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
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

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <div ref={searchRef} className="relative hidden sm:block">
                <button
                  onClick={() => setSearchOpen((prev) => !prev)}
                  className="p-2.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-sky-50 transition-colors"
                  aria-label="Sitede ara"
                  aria-expanded={searchOpen}
                >
                  <Search size={20} />
                </button>

                {searchOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[420px] max-w-[90vw] rounded-2xl border border-sky-100 bg-white shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-sky-100">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                          <Search size={16} className="text-slate-400" />
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
                            className="w-full border-none bg-transparent text-sm outline-none"
                            autoFocus
                          />
                        </div>
                        <Link
                          href={`/search${searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : ""}`}
                          onClick={() => setSearchOpen(false)}
                          className="h-10 px-3 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 inline-flex items-center"
                        >
                          Detaylı Ara
                        </Link>
                      </div>
                    </div>

                    <div className="max-h-[340px] overflow-y-auto">
                      {searchLoading ? (
                        <p className="p-4 text-sm text-slate-500">Aranıyor...</p>
                      ) : searchQuery.trim().length < 2 ? (
                        <p className="p-4 text-sm text-slate-500">Aramaya başlamak için en az 2 karakter girin.</p>
                      ) : searchResults.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500">Sonuç bulunamadı.</p>
                      ) : (
                        searchResults.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 hover:bg-sky-50"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                              <p className="text-xs text-slate-500 truncate">{item.subtitle || "Detaylar için tıklayın"}</p>
                            </div>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                              {SEARCH_TYPE_LABELS[item.type]}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="w-9 h-9 rounded-full bg-sky-100 animate-pulse" />
              ) : user ? (
                <>
                  {/* Notifications */}
                  <div ref={notificationPanelRef} className="relative hidden sm:block">
                    <button
                      onClick={() => {
                        setNotificationPanelOpen(!notificationPanelOpen);
                        setUserMenuOpen(false);
                      }}
                      className="flex p-2.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-sky-50 transition-colors relative"
                      aria-label="Bildirim panelini aç"
                      aria-expanded={notificationPanelOpen}
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-[18px] text-center">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {notificationPanelOpen && (
                      <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[86vw] bg-white rounded-2xl shadow-xl border border-sky-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-sky-100 flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Bildirimler</h3>
                            <p className="text-xs text-slate-500">{unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={markAllAsRead}
                              className="text-xs font-medium text-slate-500 hover:text-slate-900"
                            >
                              Tümünü okundu yap
                            </button>
                            <Link
                              href="/notifications"
                              onClick={() => setNotificationPanelOpen(false)}
                              className="text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                              Tümünü gör
                            </Link>
                          </div>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto">
                          {notificationLoading ? (
                            <div className="p-6 text-sm text-slate-500">Bildirimler yükleniyor...</div>
                          ) : latestNotifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <Bell className="w-10 h-10 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                              <p className="text-sm text-slate-500">Yeni bildirimin yok.</p>
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
                                className={`flex items-start gap-3 px-4 py-3 border-b border-sky-100 hover:bg-sky-50 transition-colors ${
                                  !notification.isRead ? "bg-sky-50" : ""
                                }`}
                              >
                                <Avatar
                                  src={notification.user.avatar || undefined}
                                  fallback={notification.user.name}
                                  size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm leading-5 text-slate-700">
                                    <span className="font-semibold">{notification.user.name}</span> {notification.message}
                                  </p>
                                  {notification.content && (
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{notification.content}</p>
                                  )}
                                  <p className="text-xs text-slate-400 mt-1">{getTimeAgo(notification.createdAt)}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${getNotificationTypeClasses(notification.type)}`}>
                                  {notification.type === "likes" ? "Beğeni" : notification.type === "comments" ? "Yorum" : "Etkinlik"}
                                </span>
                              </Link>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  <div ref={messagesRef} className="relative hidden sm:block">
                    <button
                      onClick={() => setMessagesOpen((prev) => !prev)}
                      className="flex p-2.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-sky-50 transition-colors relative"
                      aria-label="Mesajlar"
                    >
                      <MessageSquare size={20} />
                      {totalUnreadMessages > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center">
                          {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                        </span>
                      )}
                    </button>

                    {messagesOpen && (
                      <div className="absolute right-0 top-full mt-2 w-[370px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-sky-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-sky-100 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Mesajlar</p>
                            <p className="text-xs text-slate-500">{totalUnreadMessages} okunmamış mesaj</p>
                          </div>
                          <Link
                            href="/messages"
                            onClick={() => setMessagesOpen(false)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Tümünü Gör
                          </Link>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto">
                          {messagesLoading ? (
                            <div className="p-4 text-sm text-slate-500">Mesajlar yükleniyor...</div>
                          ) : messagesError ? (
                            <div className="p-4 text-sm text-red-500">{messagesError}</div>
                          ) : messagePreviews.length === 0 ? (
                            <div className="p-4 text-sm text-slate-500">Henüz bir mesajınız yok.</div>
                          ) : (
                            messagePreviews.slice(0, 8).map((conversation) => (
                              <button
                                key={conversation.conversationId}
                                onClick={async () => {
                                  setMessagesOpen(false);
                                  if (user && conversation.unreadCount > 0) {
                                    try {
                                      await markConversationMessagesAsRead(conversation.conversationId, user.id);
                                    } catch (error) {
                                      console.error("Mesajlar okundu işaretlenemedi:", error);
                                    }
                                  }
                                  router.push(`/messages?conversation=${conversation.conversationId}`);
                                }}
                                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/70 transition-colors text-left border-b last:border-b-0 border-neutral-100 dark:border-neutral-800"
                              >
                                <Avatar
                                  src={conversation.otherUserAvatar || undefined}
                                  fallback={conversation.otherUserName}
                                  size="md"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                      {conversation.otherUserName}
                                    </p>
                                    <span className="text-xs text-slate-500 flex-shrink-0">
                                      {formatMessageTime(conversation.lastMessageCreatedAt)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm text-neutral-600 dark:text-slate-400 truncate">
                                      {conversation.lastMessageText}
                                    </p>
                                    {conversation.unreadCount > 0 && (
                                      <span className="min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center">
                                        {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div ref={userMenuRef} className="relative hidden md:block">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-full border border-transparent hover:border-sky-200 hover:bg-sky-50 transition-colors"
                    >
                      <Avatar
                        src={getAvatarUrl(profile, user)}
                        fallback={displayName}
                        size="sm"
                      />
                      <div className="text-left max-w-[140px]">
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{usernameLabel}</div>
                      </div>
                      <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-white rounded-2xl shadow-xl border border-sky-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-sky-100">
                          <div className="font-semibold truncate">{displayName}</div>
                          <div className="text-sm text-slate-500 truncate">{usernameLabel}</div>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-sky-50"
                          >
                            <User size={18} />
                            Profilim
                          </Link>
                          <Link
                            href="/ayarlar"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-sky-50"
                          >
                            <Settings size={18} />
                            Ayarlar
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Shield size={18} />
                              Admin Paneli
                            </Link>
                          )}
                        </div>
                        <div className="pt-1 border-t border-sky-100">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <LogOut size={18} />
                            Çıkış Yap
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden p-2.5 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-neutral-800"
                  >
                    <Menu size={20} />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:block">
                    <Button variant="ghost" size="sm">Giriş</Button>
                  </Link>
                  <Link href="/register" className="hidden sm:block">
                    <Button variant="primary" size="sm">Kayıt Ol</Button>
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="sm:hidden p-2.5 rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-slate-400 dark:hover:bg-neutral-800"
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
