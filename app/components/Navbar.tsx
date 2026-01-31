"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  Bell, 
  MessageCircle, 
  Search, 
  Menu, 
  X, 
  Home,
  Users,
  Calendar,
  User,
  Shield,
  LogOut,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { cx } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const STATES = [
  "ALL",
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { t } = useLanguage();
  const { user, profile, isModerator, signOut } = useAuth();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const selectedState = sp.get("state") ?? "ALL";

  const NAV_ITEMS: NavItem[] = useMemo(() => [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/events", label: t("nav.events"), icon: Calendar },
    { href: "/groups", label: t("nav.groups"), icon: Users },
    { href: "/people", label: t("nav.people"), icon: User },
  ], [t]);

  const setStateParam = useCallback((nextState: string) => {
    const qs = new URLSearchParams(sp.toString());
    if (nextState === "ALL") qs.delete("state");
    else qs.set("state", nextState);
    router.replace(`${pathname}${qs.toString() ? `?${qs.toString()}` : ""}`);
  }, [sp, pathname, router]);

  // Set state from profile on first load
  useEffect(() => {
    const urlHasState = sp.has("state");
    const profState = profile?.state?.toUpperCase() ?? "ALL";
    if (!urlHasState && profState !== "ALL" && user) {
      setStateParam(profState);
    }
  }, [profile, user, sp, setStateParam]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(t)) setNotifOpen(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(t)) setProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const stateOptions = useMemo(() => {
    if (!user) return ["ALL"];
    return STATES;
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <>
      <header className="glass border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-smooth">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gradient">AmerikaLa</h1>
                <p className="text-xs text-neutral-500">Connect • Discover • Grow</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth text-sm font-medium",
                      isActive 
                        ? "bg-red-500 text-white shadow-md" 
                        : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-50"
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Admin Panel Link (only for moderators/admins) */}
              {isModerator && (
                <Link
                  href="/admin"
                  className={cx(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth text-sm font-medium",
                    pathname === "/admin"
                      ? "bg-red-500 text-white shadow-md" 
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-50"
                  )}
                >
                  <Shield size={18} />
                  <span>Admin</span>
                </Link>
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden md:flex"
              >
                <Search size={20} />
              </Button>

              {/* Messages */}
              <Link href="/messages">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cx(pathname.startsWith("/messages") && "bg-neutral-100 dark:bg-neutral-900")}
                >
                  <MessageCircle size={20} />
                </Button>
              </Link>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className={cx(notifOpen && "bg-neutral-100 dark:bg-neutral-900")}
                >
                  <Bell size={20} />
                  <Badge 
                    variant="error" 
                    size="sm" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    3
                  </Badge>
                </Button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-96 glass rounded-2xl shadow-2xl p-4 animate-scale-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">{t("nav.notifications")}</h3>
                      <Button variant="ghost" size="sm" onClick={() => setNotifOpen(false)}>
                        <X size={16} />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-smooth cursor-pointer">
                        <p className="text-sm font-medium">Yeni etkinlik daveti</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          John seni &quot;NYC Turkish Meetup&quot; etkinliğine davet etti
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800 mx-1 hidden lg:block" />

              {/* State Selector */}
              <select
                className="hidden lg:block px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm font-medium transition-smooth hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={selectedState}
                onChange={(e) => setStateParam(e.target.value)}
              >
                {stateOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Auth Buttons / Avatar */}
              {!user ? (
                <div className="hidden lg:flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">{t("nav.login")}</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">{t("nav.signup")}</Button>
                  </Link>
                </div>
              ) : (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="focus:outline-none"
                  >
                    <Avatar
                      src={profile?.avatar_url || undefined}
                      fallback={profile?.username || "U"}
                      size="md"
                      status="online"
                      className="cursor-pointer hover:scale-105 transition-smooth"
                    />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass rounded-2xl shadow-2xl p-2 animate-scale-in">
                      <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 mb-2">
                        <p className="font-medium truncate">{profile?.full_name || profile?.username || "Kullanıcı"}</p>
                        <p className="text-sm text-neutral-500 truncate">@{profile?.username}</p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-smooth"
                      >
                        <User size={18} className="text-neutral-500" />
                        <span>Profilim</span>
                      </Link>

                      <Link
                        href="/ayarlar"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-smooth"
                      >
                        <Settings size={18} className="text-neutral-500" />
                        <span>Ayarlar</span>
                      </Link>

                      {isModerator && (
                        <Link
                          href="/admin"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-smooth"
                        >
                          <Shield size={18} className="text-red-500" />
                          <span className="text-red-600 font-medium">Admin Panel</span>
                        </Link>
                      )}

                      <div className="border-t border-neutral-200 dark:border-neutral-800 mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-smooth w-full text-left text-red-600"
                        >
                          <LogOut size={18} />
                          <span>Çıkış Yap</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>

          {/* Search Bar (Expanded) */}
          {searchOpen && (
            <div className="pb-4 animate-slide-up">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                <input
                  type="text"
                  placeholder={t("common.search")}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-red-500 transition-smooth"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 glass backdrop-blur-xl animate-fade-in">
          <div className="p-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth text-base font-medium",
                    isActive 
                      ? "bg-red-500 text-white shadow-lg" 
                      : "text-neutral-900 dark:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  )}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Admin Panel Link (Mobile) */}
            {isModerator && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={cx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth text-base font-medium",
                  pathname === "/admin"
                    ? "bg-red-500 text-white shadow-lg" 
                    : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                )}
              >
                <Shield size={20} />
                <span>Admin Panel</span>
              </Link>
            )}

            {/* Mobile Auth */}
            {!user ? (
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">{t("nav.login")}</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">{t("nav.signup")}</Button>
                </Link>
              </div>
            ) : (
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                >
                  <LogOut size={20} />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
