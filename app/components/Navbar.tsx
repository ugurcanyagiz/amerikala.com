"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getTimeAgo, useNotifications } from "../contexts/NotificationContext";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
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
  MapPin,
  Clock,
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
      { href: "/emlak/ev-arkadasi", label: "Ev Arkadaşı", icon: Users, description: "Oda arkadaşı bul" },
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

type MessagePreview = {
  id: number;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastMessage: string;
  timestamp: string;
  unread: number;
};

const MESSAGE_PREVIEWS: MessagePreview[] = [
  {
    id: 1,
    name: "Ayşe Karaca",
    avatar: "/avatars/ayse.jpg",
    isOnline: true,
    lastMessage: "Bu akşam meetup'a geliyor musun?",
    timestamp: "2 dk",
    unread: 2,
  },
  {
    id: 2,
    name: "Mehmet Şahin",
    avatar: "/avatars/mehmet.jpg",
    isOnline: false,
    lastMessage: "İlan detaylarını gönderdim, bakabilir misin?",
    timestamp: "18 dk",
    unread: 1,
  },
  {
    id: 3,
    name: "Elif Demir",
    avatar: "/avatars/elif.jpg",
    isOnline: true,
    lastMessage: "Yarın kahve için uygunsan haber ver 😊",
    timestamp: "1 sa",
    unread: 0,
  },
];



function getDisplayName(profile: { first_name?: string | null; last_name?: string | null; username?: string | null } | null | undefined) {
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return fullName || profile?.username || "Kullanıcı";
}

function getUsernameLabel(profile: { username?: string | null } | null | undefined, fallbackEmail?: string | null) {
  if (profile?.username) return `@${profile.username}`;
  if (fallbackEmail) return fallbackEmail;
  return "@user";
}

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
            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
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
            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
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
        <div className="absolute top-full left-0 mt-2 w-64 py-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  }
                `}
              >
                <ChildIcon size={18} className={child.accent ? "text-white" : ""} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{child.label}</div>
                  {child.description && (
                    <div className={`text-xs truncate ${child.accent ? "text-blue-100" : "text-neutral-400"}`}>
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
    { href: "/", icon: Home, label: "Ana" },
    { href: "/meetups", icon: Calendar, label: "Etkinlik" },
    { href: "/emlak", icon: Building2, label: "Emlak" },
    { href: "/alisveris", icon: ShoppingBag, label: "Market" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
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
                flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl
                transition-all duration-200
                ${isActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-neutral-500 dark:text-neutral-500"
                }
              `}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Mobile Menu Sheet
function MobileMenuSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const router = useRouter();
  const displayName = getDisplayName(profile);
  const usernameLabel = getUsernameLabel(profile, user?.email);

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
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
            <span className="font-bold text-lg">Menü</span>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Info */}
          {user && profile && (
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
              <Link href="/profile" onClick={onClose} className="flex items-center gap-3">
                <Avatar
                  src={profile.avatar_url || undefined}
                  fallback={profile.first_name || profile.username || "U"}
                  size="lg"
                />
                <div>
                  <div className="font-semibold">{displayName}</div>
                  <div className="text-sm text-neutral-500">{usernameLabel}</div>
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
                    className="flex items-center gap-3 px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              }

              return (
                <div key={item.id} className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
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
                            : "text-neutral-600 dark:text-neutral-400"
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
  const displayName = getDisplayName(profile);
  const usernameLabel = getUsernameLabel(profile, user?.email);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading: notificationLoading } = useNotifications();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [messagePanelOpen, setMessagePanelOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const messagePanelRef = useRef<HTMLDivElement>(null);
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

      if (messagePanelRef.current && !messagePanelRef.current.contains(e.target as Node)) {
        setMessagePanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    router.push("/");
  };

  const latestNotifications = notifications.slice(0, 6);
  const totalMessageUnread = MESSAGE_PREVIEWS.reduce((total, item) => total + item.unread, 0);

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case "likes":
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      case "comments":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "events":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Amerikala"
                width={140}
                height={36}
                priority
                className="h-9 w-auto"
              />
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
              <button className="p-2.5 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors">
                <Search size={20} />
              </button>

              {loading ? (
                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              ) : user ? (
                <>
                  {/* Notifications */}
                  <div ref={notificationPanelRef} className="relative hidden sm:block">
                    <button
                      onClick={() => {
                        setNotificationPanelOpen((prev) => !prev);
                        setUserMenuOpen(false);
                      }}
                      className="flex p-2.5 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors relative"
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
                      <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[86vw] bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Bildirimler</h3>
                            <p className="text-xs text-neutral-500">{unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={markAllAsRead}
                              className="text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
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
                            <div className="p-6 text-sm text-neutral-500">Bildirimler yükleniyor...</div>
                          ) : latestNotifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <Bell className="w-10 h-10 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                              <p className="text-sm text-neutral-500">Yeni bildirimin yok.</p>
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
                                className={`flex items-start gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors ${
                                  !notification.isRead ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                                }`}
                              >
                                <Avatar
                                  src={notification.user.avatar || undefined}
                                  fallback={notification.user.name}
                                  size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm leading-5 text-neutral-700 dark:text-neutral-200">
                                    <span className="font-semibold">{notification.user.name}</span> {notification.message}
                                  </p>
                                  {notification.content && (
                                    <p className="text-xs text-neutral-500 truncate mt-0.5">{notification.content}</p>
                                  )}
                                  <p className="text-xs text-neutral-400 mt-1">{getTimeAgo(notification.createdAt)}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${getNotificationIconColor(notification.type)}`}>
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
                  <div ref={messagePanelRef} className="relative hidden sm:block">
                    <button
                      onClick={() => {
                        setMessagePanelOpen((prev) => !prev);
                        setUserMenuOpen(false);
                        setNotificationPanelOpen(false);
                      }}
                      className="flex p-2.5 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors relative"
                      aria-label="Mesaj panelini aç"
                      aria-expanded={messagePanelOpen}
                    >
                      <MessageSquare size={20} />
                      {totalMessageUnread > 0 && (
                        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-semibold leading-[18px] text-center">
                          {totalMessageUnread > 99 ? "99+" : totalMessageUnread}
                        </span>
                      )}
                    </button>

                    {messagePanelOpen && (
                      <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[86vw] bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Mesajlar</h3>
                            <p className="text-xs text-neutral-500">{totalMessageUnread > 0 ? `${totalMessageUnread} okunmamış mesaj` : "Tüm mesajlar okundu"}</p>
                          </div>
                          <Link
                            href="/messages"
                            onClick={() => setMessagePanelOpen(false)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Tümünü gör
                          </Link>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto">
                          {MESSAGE_PREVIEWS.map((conversation) => (
                            <Link
                              key={conversation.id}
                              href="/messages"
                              onClick={() => setMessagePanelOpen(false)}
                              className="flex items-start gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
                            >
                              <div className="relative">
                                <Avatar src={conversation.avatar} fallback={conversation.name} size="sm" />
                                {conversation.isOnline && (
                                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border border-white dark:border-neutral-900" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">{conversation.name}</p>
                                  <span className="text-[11px] text-neutral-400 whitespace-nowrap">{conversation.timestamp}</span>
                                </div>
                                <p className="text-xs text-neutral-500 truncate mt-0.5">{conversation.lastMessage}</p>
                              </div>
                              {conversation.unread > 0 && (
                                <span className="text-[10px] min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white font-semibold leading-[18px] text-center">
                                  {conversation.unread}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div ref={userMenuRef} className="relative hidden md:block">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-full border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Avatar
                        src={profile?.avatar_url || undefined}
                        fallback={profile?.first_name || profile?.username || "U"}
                        size="sm"
                      />
                      <div className="hidden lg:block text-left max-w-[140px]">
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{displayName}</div>
                        <div className="text-xs text-neutral-500 truncate">{usernameLabel}</div>
                      </div>
                      <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                          <div className="font-semibold truncate">{displayName}</div>
                          <div className="text-sm text-neutral-500 truncate">{usernameLabel}</div>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <User size={18} />
                            Profilim
                          </Link>
                          <Link
                            href="/ayarlar"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
                        <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
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
                    className="md:hidden p-2.5 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
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
                    className="sm:hidden p-2.5 rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
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
