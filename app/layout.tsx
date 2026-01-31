import type { Metadata } from "next";
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
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "AmerikaLa - Connect with Turks in the USA",
  description: "The premier social platform for Turkish community in America. Discover events, join groups, make friends, and find opportunities.",
  keywords: ["Turkish community", "USA", "events", "meetups", "social network", "Turkish Americans"],
  authors: [{ name: "AmerikaLa" }],
  openGraph: {
    title: "AmerikaLa - Connect with Turks in the USA",
    description: "The premier social platform for Turkish community in America",
    type: "website",
  },
};

function NavbarFallback() {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gradient">AmerikaLa</h1>
              <p className="text-xs text-neutral-500">Connect • Discover • Grow</p>
            </div>
          </div>
          <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#ef4444" />
      </head>
      <body 
        className={`${inter.variable} ${jakarta.variable} font-sans min-h-screen antialiased`}
      >
        <AuthProvider>
          <LanguageProvider>
            {/* Background Gradient Mesh */}
            <div className="fixed inset-0 -z-10 gradient-mesh opacity-40" />
            
            {/* Floating Language Switcher */}
            <FloatingLanguageSwitcher />
            
            {/* Main Content */}
            <div className="relative min-h-screen flex flex-col">
              <Suspense fallback={<NavbarFallback />}>
                <Navbar />
              </Suspense>
              <main className="flex-1">
                {children}
              </main>
              
              {/* Footer */}
              <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                      <h3 className="font-bold text-lg mb-3 text-gradient">AmerikaLa</h3>
                      <p className="text-sm text-neutral-500">
                        Amerika&apos;daki Türkler için sosyal platform
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Keşfet</h4>
                      <ul className="space-y-2 text-sm text-neutral-500">
                        <li><a href="/events" className="hover:text-red-500 transition-smooth">Etkinlikler</a></li>
                        <li><a href="/groups" className="hover:text-red-500 transition-smooth">Gruplar</a></li>
                        <li><a href="/people" className="hover:text-red-500 transition-smooth">İnsanlar</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">İlanlar</h4>
                      <ul className="space-y-2 text-sm text-neutral-500">
                        <li><a href="/emlak" className="hover:text-red-500 transition-smooth">Emlak</a></li>
                        <li><a href="/is" className="hover:text-red-500 transition-smooth">İş İlanları</a></li>
                        <li><a href="/alisveris" className="hover:text-red-500 transition-smooth">Alışveriş</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Hakkımızda</h4>
                      <ul className="space-y-2 text-sm text-neutral-500">
                        <li><a href="/yasal-rehber" className="hover:text-red-500 transition-smooth">Yasal Rehber</a></li>
                        <li><a href="#" className="hover:text-red-500 transition-smooth">Gizlilik</a></li>
                        <li><a href="#" className="hover:text-red-500 transition-smooth">İletişim</a></li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center text-sm text-neutral-500">
                    <p>&copy; 2025 AmerikaLa. Tüm hakları saklıdır.</p>
                  </div>
                </div>
              </footer>
            </div>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
