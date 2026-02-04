"use client";

import { useRouter } from "next/navigation";
import { Scale, ArrowLeft, Clock, Bell, Mail } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

export default function YasalRehberPage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="glass max-w-lg w-full">
            <CardContent className="p-8 sm:p-12 text-center">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-xl">
                <Scale className="h-10 w-10 text-white" />
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                Yasal Rehber
              </h1>

              {/* Coming Soon Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium text-sm mb-6">
                <Clock size={16} />
                Yakında Hizmete Açılıyor
              </div>

              {/* Description */}
              <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                Amerika&apos;da yaşam için kapsamlı hukuki bilgi ve rehberler üzerinde çalışıyoruz. 
                Vize işlemleri, çalışma hakları, konut kiralama, sağlık sigortası ve daha fazlası 
                hakkında detaylı rehberler yakında sizlerle buluşacak.
              </p>

              {/* Features Preview */}
              <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <span className="text-lg mb-1 block">🛂</span>
                  <span className="text-sm font-medium">Vize Rehberleri</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <span className="text-lg mb-1 block">💼</span>
                  <span className="text-sm font-medium">Çalışma Hakları</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <span className="text-lg mb-1 block">🏠</span>
                  <span className="text-sm font-medium">Konut & Kiralama</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <span className="text-lg mb-1 block">💰</span>
                  <span className="text-sm font-medium">Finans & Vergi</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
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
              <p className="text-xs text-neutral-500 mt-6">
                Hazır olduğunda email ile bilgilendirilmek için ayarlardan bildirimleri açabilirsiniz.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
