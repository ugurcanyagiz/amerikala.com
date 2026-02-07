import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "./components/Navbar";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import FloatingLanguageSwitcher from "./components/FloatingLanguageSwitcher";
import { NotificationProvider } from "./contexts/NotificationContext";

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
            <div className="h-9 w-9 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-white font-semibold text-lg">a</span>
            </div>
            <span className="hidden sm:block text-lg font-semibold tracking-tight">
              amerikala
            </span>
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
          <NotificationProvider>
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
                          <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                            <span className="text-white font-semibold">a</span>
                          </div>
                          <span className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
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
                              className="text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              Gruplar
                            </a>
                          </li>
                          <li>
                            <a
                              href="/people"
                              className="text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              İnsanlar
                            </a>
                          </li>
                        </ul>
                      </div>

                      {/* Listings */}
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--color-ink)] mb-4">
                          İlanlar
                        </h4>
                        <ul className="space-y-3">
                          <li>
                            <a
                              href="/emlak"
                              className="text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              Emlak
                            </a>
                          </li>
                          <li>
                            <a
                              href="/is"
                              className="text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              İş İlanları
                            </a>
                          </li>
                          <li>
                            <a
                              href="/alisveris"
                              className="text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              Alışveriş
                            </a>
                          </li>
                        </ul>
                      </div>

                      {/* About */}
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--color-ink)] mb-4">
                          Hakkımızda
                        </h4>
                        <ul className="space-y-3">
                          <li>
                            <a
                              href="/yasal-rehber"
                              className="text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              Yasal Rehber
                            </a>
                          </li>
                          <li>
                            <a
                              href="#"
                              className="text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              Gizlilik
                            </a>
                          </li>
                          <li>
                            <a
                              href="#"
                              className="text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              İletişim
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Copyright */}
                    <div className="mt-12 pt-8 border-t border-[var(--color-border-light)]">
                      <p className="text-sm text-[var(--color-ink-tertiary)] text-center">
                        &copy; 2025 amerikala. Tüm hakları saklıdır.
                      </p>
                    </div>
                  </div>
                </footer>
              </div>
            </LanguageProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
