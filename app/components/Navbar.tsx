"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import {
  Home,
  Rss,
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
    id: "feed",
    label: "Feed",
    href: "/feed",
    icon: Rss,
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

// Dropdown Component
function NavDropdown({ 
  item, 
  isOpen, 
  onToggle, 
  onClose 
}: { 
  item: typeof NAV_ITEMS[number]; 
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
    { href: "/feed", icon: Rss, label: "Feed" },
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
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.full_name ||
    profile?.username ||
    user?.email?.split("@")[0] ||
    "Kullanıcı";
  const displayHandle = profile?.username || user?.email?.split("@")[0] || "user";

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
          {user && (
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
              <Link href="/profile" onClick={onClose} className="flex items-center gap-3">
                <Avatar
                  src={profile.avatar_url || undefined}
                  fallback={displayName}
                  size="lg"
                />
                <div>
                  <div className="font-semibold">{displayName}</div>
                  <div className="text-sm text-neutral-500">@{displayHandle}</div>
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
                <Link href="/profile" onClick={onClose}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <User size={18} />
                    Profilim
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
  const { user, profile, signOut, loading } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.full_name ||
    profile?.username ||
    user?.email?.split("@")[0] ||
    "Kullanıcı";
  const displayHandle = profile?.username || user?.email?.split("@")[0] || "user";

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
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

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl hidden sm:block">
                amerika<span className="text-red-500">la</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
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
                  <button className="hidden sm:flex p-2.5 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  </button>

                  {/* Messages */}
                  <button className="hidden sm:flex p-2.5 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors">
                    <MessageSquare size={20} />
                  </button>

                  {/* User Menu */}
                  <div ref={userMenuRef} className="relative hidden md:block">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Avatar
                        src={profile?.avatar_url || undefined}
                        fallback={displayName}
                        size="sm"
                      />
                      <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                          <div className="font-semibold truncate">{displayName}</div>
                          <div className="text-sm text-neutral-500 truncate">
                            @{displayHandle}
                          </div>
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
