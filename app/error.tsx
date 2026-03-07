"use client";

import { useEffect } from "react";
import { Button } from "./components/ui/Button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Bir Hata Oluştu</h1>
        <p className="text-ink-muted mb-6">
          Üzgünüz, beklenmeyen bir hata meydana geldi.
          Lütfen sayfayı yenilemeyi deneyin veya ana sayfaya dönün.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
            <p className="text-sm font-mono text-red-800 dark:text-red-200 break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={reset}
            className="gap-2"
          >
            <RefreshCw size={18} />
            Tekrar Dene
          </Button>
          <Link href="/">
            <Button variant="primary" className="gap-2">
              <Home size={18} />
              Ana Sayfa
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
