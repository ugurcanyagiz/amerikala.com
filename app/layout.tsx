import type { Metadata } from "next";
import Image from "next/image";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
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
  icons: {
    icon: "/favicon.ico",
  },
};

function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 h-16 bg-[var(--color-surface)] border-b border-[var(--color-border-light)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="amerikala logo"
              width={36}
              height={36}
              className="h-9 w-9"
              priority
            />
            <span className="sr-only">amerikala</span>
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
        <meta name="theme-color" content="#C43737" />
      </head>
      <body
        className={`${inter.variable} ${jakarta.variable} font-sans min-h-screen antialiased`}
      >
        <AuthProvider>
          <NotificationProvider>

              {/* Main Layout */}
              <div className="relative min-h-screen flex flex-col bg-[var(--color-surface)]">
                <Suspense fallback={<NavbarFallback />}>
                  <Navbar />
                </Suspense>

                <main className="flex-1 bg-[var(--color-surface)]">{children}</main>

              {/* Footer */}
              <footer className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)] mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                  <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface-raised)] px-6 py-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-center gap-3">
                      <Image
                        src="/logo.png"
                        alt="amerikala logo"
                        width={40}
                        height={40}
                        className="h-10 w-10"
                      />
                      <p className="text-sm font-medium tracking-tight text-[var(--color-ink-secondary)] sm:text-base">
                        Amerikala.com 2026 Copyright
                      </p>
                    </div>

                    <div className="mt-5 pt-5 border-t border-[var(--color-border-light)]">
                      <a
                        href="mailto:info@amerikala.com"
                        className="inline-flex items-center justify-center text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
                      >
                        İletişim: info@amerikala.com
                      </a>
                    </div>
                  </div>
                </div>
              </footer>
              </div>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
