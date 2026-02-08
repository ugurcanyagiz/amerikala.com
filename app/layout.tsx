 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/app/layout.tsx b/app/layout.tsx
index effe61e4397c1f56b88e72b96f651d13313d0848..6664673a0171e58072c3a5f62413a6f3bc93d29f 100644
--- a/app/layout.tsx
+++ b/app/layout.tsx
@@ -1,127 +1,135 @@
 import type { Metadata } from "next";
+import Image from "next/image";
 import { Inter, Plus_Jakarta_Sans } from "next/font/google";
 import { Suspense } from "react";
 import "./globals.css";
 import Navbar from "./components/Navbar";
 import { LanguageProvider } from "./contexts/LanguageContext";
 import { AuthProvider } from "./contexts/AuthContext";
 import FloatingLanguageSwitcher from "./components/FloatingLanguageSwitcher";
 
 const inter = Inter({
   subsets: ["latin"],
   variable: "--font-inter",
   display: "swap",
 });
 
 const jakarta = Plus_Jakarta_Sans({
   subsets: ["latin"],
   variable: "--font-jakarta",
   display: "swap",
 });
 
 export const metadata: Metadata = {
   title: "amerikala - Connect with Turks in the USA",
   description:
     "The premier platform for Turkish community in America. Discover events, join groups, make friends, and find opportunities.",
   keywords: [
     "Turkish community",
     "USA",
     "events",
     "meetups",
     "social network",
     "Turkish Americans",
   ],
   authors: [{ name: "amerikala" }],
   openGraph: {
     title: "amerikala - Connect with Turks in the USA",
     description: "The premier platform for Turkish community in America",
     type: "website",
   },
 };
 
 function NavbarFallback() {
   return (
     <header className="sticky top-0 z-50 h-16 bg-[var(--color-surface)] border-b border-[var(--color-border-light)]">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
         <div className="flex items-center justify-between h-full">
           <div className="flex items-center gap-3">
-            <div className="h-9 w-9 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
-              <span className="text-white font-semibold text-lg">a</span>
-            </div>
-            <span className="hidden sm:block text-lg font-semibold tracking-tight">
-              amerikala
-            </span>
+            <Image
+              src="/logo.png"
+              alt="amerikala logo"
+              width={36}
+              height={36}
+              className="h-9 w-9"
+              priority
+            />
+            <span className="sr-only">amerikala</span>
           </div>
           <div className="h-8 w-24 bg-[var(--color-surface-sunken)] rounded-lg animate-pulse" />
         </div>
       </div>
     </header>
   );
 }
 
 export default function RootLayout({
   children,
 }: {
   children: React.ReactNode;
 }) {
   return (
     <html lang="tr" suppressHydrationWarning>
       <head>
         <meta
           name="viewport"
           content="width=device-width, initial-scale=1, maximum-scale=5"
         />
         <meta name="theme-color" content="#C45C4A" />
       </head>
       <body
         className={`${inter.variable} ${jakarta.variable} font-sans min-h-screen antialiased`}
       >
         <AuthProvider>
           <LanguageProvider>
             {/* Floating Language Switcher */}
             <FloatingLanguageSwitcher />
 
             {/* Main Layout */}
             <div className="relative min-h-screen flex flex-col bg-[var(--color-surface)]">
               <Suspense fallback={<NavbarFallback />}>
                 <Navbar />
               </Suspense>
 
               <main className="flex-1">{children}</main>
 
               {/* Footer */}
               <footer className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)] mt-auto">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                     {/* Brand */}
                     <div className="col-span-2 md:col-span-1">
                       <div className="flex items-center gap-2 mb-4">
-                        <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
-                          <span className="text-white font-semibold">a</span>
-                        </div>
-                        <span className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
+                        <Image
+                          src="/logo.png"
+                          alt="amerikala logo"
+                          width={32}
+                          height={32}
+                          className="h-8 w-8"
+                        />
+                        <span className="text-lg font-semibold tracking-tight text-[var(--color-ink)] sr-only">
                           amerikala
                         </span>
                       </div>
                       <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                         Amerika&apos;daki Türk topluluğu için sosyal platform.
                       </p>
                     </div>
 
                     {/* Explore */}
                     <div>
                       <h4 className="text-sm font-semibold text-[var(--color-ink)] mb-4">
                         Keşfet
                       </h4>
                       <ul className="space-y-3">
                         <li>
                           <a
                             href="/events"
                             className="text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-primary)] transition-colors"
                           >
                             Etkinlikler
                           </a>
                         </li>
                         <li>
                           <a
                             href="/groups"
 
EOF
)