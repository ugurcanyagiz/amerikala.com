"use client";

import { useRouter } from "next/navigation";
import { Scale, ArrowLeft, Clock, Bell } from "lucide-react";
import AppShell from "../components/AppShell";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

export default function YasalRehberPage() {
  const router = useRouter();

  return (
    <AppShell mainClassName="app-page-container flex items-center justify-center">
          <Card className="glass max-w-lg w-full">
            <CardContent className="p-8 sm:p-12 text-center">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center shadow-xl">
                <Scale className="h-10 w-10 text-white" />
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)] mb-3">
                Yasal Rehber
              </h1>

              {/* Coming Soon Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-medium text-sm mb-6">
                <Clock size={16} />
                Yakında Hizmete Açılıyor
              </div>

              {/* Description */}
              <p className="text-[var(--color-ink-secondary)] mb-8 leading-relaxed">
                Amerika&apos;da yaşam için kapsamlı hukuki bilgi ve rehberler üzerinde çalışıyoruz. 
                Vize işlemleri, çalışma hakları, konut kiralama, sağlık sigortası ve daha fazlası 
                hakkında detaylı rehberler yakında sizlerle buluşacak.
              </p>

              {/* Features Preview */}
              <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                <div className="p-3 rounded-xl bg-[var(--color-surface-sunken)]">
                  <span className="text-lg mb-1 block">🛂</span>
                  <span className="text-sm font-medium">Vize Rehberleri</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-sunken)]">
                  <span className="text-lg mb-1 block">💼</span>
                  <span className="text-sm font-medium">Çalışma Hakları</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-sunken)]">
                  <span className="text-lg mb-1 block">🏠</span>
                  <span className="text-sm font-medium">Konut & Kiralama</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-sunken)]">
                  <span className="text-lg mb-1 block">💰</span>
                  <span className="text-sm font-medium">Finans & Vergi</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="secondary" 
                  className="flex-1 gap-2"
                  onClick={() => router.push("/")}
                >
                  <ArrowLeft size={18} />
                  Ana Sayfa
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1 gap-2"
                  onClick={() => router.push("/ayarlar")}
                >
                  <Bell size={18} />
                  Haberdar Ol
                </Button>
              </div>

              {/* Footer note */}
              <p className="text-xs text-[var(--color-ink-secondary)] mt-6">
                Hazır olduğunda email ile bilgilendirilmek için ayarlardan bildirimleri açabilirsiniz.
              </p>
            </CardContent>
          </Card>
        </AppShell>
  );
}
