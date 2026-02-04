"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Bell,
    MessageCircle,
    Search,
    Menu,
    X,
    ChevronDown,
    LogOut,
    Settings,
    User,
    Shield,
} from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

const STATES = [
    "ALL",
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const sp = useSearchParams();
    const { t } = useLanguage();
    const { user, profile, isModerator, signOut } = useAuth();

    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    const profileMenuRef = useRef<HTMLDivElement | null>(null);

    const selectedState = sp.get("state") ?? "ALL";

    // ✅ "Yasal Rehber" kaldırıldı
    const navItems = useMemo(() => [
        { href: "/", label: "Anasayfa" },
        { href: "/meetups", label: "Buluşmalar" },
        { href: "/emlak", label: "Emlak İlanları" },
        { href: "/is", label: "İş İlanları" },
        { href: "/alisveris", label: "Alışveriş" },
    ], []);

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

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        // UI'ı hemen güncelle
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);

        console.log("Navbar: Starting sign out...");

        try {
            await signOut();
            console.log("Navbar: Sign out completed");
        } catch (error) {
            console.error("Navbar: Sign out error:", error);
        }

        // Her durumda login sayfasına yönlendir
        console.log("Navbar: Redirecting to login...");
        window.location.href = "/login";
    };

    const stateOptions = user ? STATES : ["ALL"];

    return (
        <>
            <header className="sticky top-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border-light)]">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-[72px]">

                        {/* ✅ Logo: sadece /logo.png (A ve amerikala yazısı kaldırıldı) */}
                        <Link href="/" className="flex items-center flex-shrink-0">
                            <img
                                src="/logo.png"
                                alt="Amerikala"
                                className="h-10 w-auto"
                            />
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden xl:flex items-center gap-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`
                      px-4 py-2.5 text-[15px] font-medium rounded-xl whitespace-nowrap
                      transition-colors duration-150
                      ${isActive
                                                ? "text-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
                                                : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
                                            }
                    `}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}

                            {isModerator && (
                                <Link
                                    href="/admin"
                                    className={`
                    px-4 py-2.5 text-[15px] font-medium rounded-xl whitespace-nowrap
                    transition-colors duration-150
                    ${pathname === "/admin"
                                            ? "text-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
                                            : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
                                        }
                  `}
                                >
                                    Admin
                                </Link>
                            )}
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center gap-1">
                            {/* Search Toggle */}
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)] transition-colors"
                                aria-label="Ara"
                            >
                                <Search className="h-5 w-5" />
                            </button>

                            {/* Messages */}
                            <Link
                                href="/messages"
                                className={`hidden md:flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${pathname.startsWith("/messages")
                                        ? "bg-[var(--color-surface-sunken)] text-[var(--color-ink)]"
                                        : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)]"
                                    }`}
                                aria-label="Mesajlar"
                            >
                                <MessageCircle className="h-5 w-5" />
                            </Link>

                            {/* Notifications */}
                            <Link
                                href="/notifications"
                                className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)] transition-colors relative"
                                aria-label="Bildirimler"
                            >
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                            </Link>

                            {/* Divider */}
                            <div className="hidden xl:block h-8 w-px bg-[var(--color-border-light)] mx-3" />

                            {/* State Selector */}
                            <div className="hidden xl:flex items-center">
                                <select
                                    className="
                    h-10 px-4 pr-9
                    text-[15px] font-medium
                    bg-[var(--color-surface)]
                    border border-[var(--color-border)]
                    rounded-xl
                    text-[var(--color-ink-secondary)]
                    appearance-none
                    cursor-pointer
                    transition-colors duration-150
                    hover:border-[var(--color-border-strong)]
                    focus:outline-none focus:border-[var(--color-primary)]
                  "
                                    value={selectedState}
                                    onChange={(e) => setStateParam(e.target.value)}
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 10px center',
                                    }}
                                >
                                    {stateOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s === "ALL" ? "Tüm Eyaletler" : s}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Auth Section */}
                            {!user ? (
                                <div className="hidden xl:flex items-center gap-3 ml-3">
                                    <Link href="/login">
                                        <Button variant="ghost" size="md" className="text-[15px] px-4">
                                            Login
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button variant="primary" size="md" className="text-[15px] px-5">
                                            Register
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="relative ml-2" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                        className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--color-surface-sunken)] transition-colors"
                                    >
                                        <Avatar
                                            src={profile?.avatar_url || undefined}
                                            fallback={profile?.username || "U"}
                                            size="sm"
                                        />
                                        <ChevronDown className={`h-4 w-4 text-[var(--color-ink-tertiary)] hidden sm:block transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Profile Dropdown */}
                                    {profileMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-xl shadow-[var(--shadow-lg)] py-2 animate-fade-in">
                                            <div className="px-4 py-3 border-b border-[var(--color-border-light)]">
                                                <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                                                    {profile?.full_name || profile?.username || "User"}
                                                </p>
                                                <p className="text-xs text-[var(--color-ink-tertiary)] truncate">
                                                    @{profile?.username}
                                                </p>
                                            </div>

                                            <div className="py-1">
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setProfileMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)] transition-colors"
                                                >
                                                    <User className="h-4 w-4" />
                                                    Profilim
                                                </Link>
                                                <Link
                                                    href="/ayarlar"
                                                    onClick={() => setProfileMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)] transition-colors"
                                                >
                                                    <Settings className="h-4 w-4" />
                                                    Ayarlar
                                                </Link>
                                                {isModerator && (
                                                    <Link
                                                        href="/admin"
                                                        onClick={() => setProfileMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
                                                    >
                                                        <Shield className="h-4 w-4" />
                                                        Admin Panel
                                                    </Link>
                                                )}
                                            </div>

                                            <div className="border-t border-[var(--color-border-light)] pt-1 mt-1">
                                                <button
                                                    onClick={handleSignOut}
                                                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error-light)] transition-colors"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Çıkış Yap
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="xl:hidden h-10 w-10 flex items-center justify-center rounded-xl text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)] transition-colors"
                                aria-label="Menü"
                            >
                                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    {searchOpen && (
                        <div className="pb-4 animate-slide-down">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-ink-tertiary)]" />
                                <input
                                    type="text"
                                    placeholder={t("common.search")}
                                    className="
                    w-full h-12 pl-12 pr-4
                    bg-[var(--color-surface-sunken)]
                    border border-[var(--color-border-light)]
                    rounded-lg
                    text-[var(--color-ink)]
                    placeholder:text-[var(--color-ink-tertiary)]
                    focus:outline-none focus:border-[var(--color-primary)]
                    transition-colors
                  "
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="xl:hidden fixed inset-0 top-[72px] z-40 bg-[var(--color-surface)] animate-fade-in overflow-y-auto">
                    <div className="p-6 space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`
                    flex items-center px-5 py-4 rounded-xl text-[17px] font-medium
                    transition-colors
                    ${isActive
                                            ? "text-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
                                            : "text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
                                        }
                  `}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}

                        {isModerator && (
                            <Link
                                href="/admin"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-5 py-4 rounded-xl text-[17px] font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
                            >
                                <Shield className="h-5 w-5" />
                                Admin Panel
                            </Link>
                        )}

                        {/* Mobile Auth */}
                        {!user ? (
                            <div className="pt-6 mt-6 border-t border-[var(--color-border-light)] space-y-3">
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full h-12 text-[16px]">
                                        Giriş Yap
                                    </Button>
                                </Link>
                                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="primary" className="w-full h-12 text-[16px]">
                                        Kayıt Ol
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="pt-6 mt-6 border-t border-[var(--color-border-light)]">
                                <button
                                    onClick={() => {
                                        handleSignOut();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="flex items-center gap-3 w-full px-5 py-4 rounded-xl text-[17px] font-medium text-[var(--color-error)] hover:bg-[var(--color-error-light)] transition-colors"
                                >
                                    <LogOut className="h-5 w-5" />
                                    Çıkış Yap
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
