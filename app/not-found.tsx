import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-primary mb-2">404</h1>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Sayfa Bulunamadı</h2>
        <p className="text-ink-muted mb-8">
          Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            <Home size={18} />
            Ana Sayfa
          </Link>
          <Link
            href="/meetups"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-raised border border-border-default rounded-lg font-medium hover:bg-surface-overlay transition-colors"
          >
            <Search size={18} />
            Etkinlikleri Keşfet
          </Link>
        </div>

        <p className="mt-8 text-sm text-ink-faint">
          Bir sorun olduğunu düşünüyorsanız, lütfen{" "}
          <a href="mailto:destek@amerikala.com" className="text-primary hover:underline">
            bizimle iletişime geçin
          </a>
          .
        </p>
      </div>
    </div>
  );
}
