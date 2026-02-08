(cd "$(git rev-parse --show-toplevel)" && git apply--3way << 'EOF'
diff--git a / app / components / Navbar.tsx b / app / components / Navbar.tsx
index de2ba0ae1f08465d68b3aa47b3f0cb637f9edb89..8fd54b512311bf6bd80cb9de9b8d1c25b35aa948 100644
--- a / app / components / Navbar.tsx
+++ b / app / components / Navbar.tsx
@@ -1, 27 + 1, 28 @@
"use client";

+import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
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
@@ - 421, 56 + 422, 59 @@ export default function Navbar() {

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
                            -                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                                -                                <span className="text-white font-bold text-lg">A</span>
                                -                            </div>
                            -                            <span className="font-bold text-xl hidden sm:block">
                                -                                amerika<span className="text-red-500">la</span>
                                -                            </span>
                            +                            <Image
+                                src="/logo.png"
                            +                                alt="amerikala logo"
                            +                                width={36}
                            +                                height={36}
                            +                                className="h-9 w-9"
                            +                                priority
+                            />
                            +                            <span className="sr-only">amerikala</span>
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
                                @@ - 565, 26 + 569, 26 @@ export default function Navbar() {
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
        </div >
             </header >

        {/* Mobile Menu Sheet */ }
        < MobileMenuSheet isOpen = { mobileMenuOpen } onClose = {() => setMobileMenuOpen(false)
} />

{/* Mobile Bottom Navigation */ }
<MobileBottomNav />
         </>
     );
-}
\ No newline at end of file
    +}

EOF
)