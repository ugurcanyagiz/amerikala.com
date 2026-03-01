"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { Toast, ToastViewport } from "@/app/components/ui/Toast";

type ShareButtonProps = {
  url: string;
  title: string;
  text?: string;
  className?: string;
};

export function ShareButton({ url, title, text, className = "" }: ShareButtonProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleShare = async () => {
    const sharePayload = {
      title,
      text: text || "Bu ilanı inceleyin.",
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
        return;
      } catch {
        // dismissed share sheet -> fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setToastMessage("Link kopyalandı");
    } catch {
      setToastMessage("Link kopyalanamadı");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        aria-label="İlanı paylaş"
        className={`w-10 h-10 rounded-full bg-white/90 text-neutral-600 flex items-center justify-center hover:bg-white transition-colors ${className}`}
      >
        <Share2 size={20} />
      </button>

      <ToastViewport>
        {toastMessage ? <Toast variant="info" description={toastMessage} onClose={() => setToastMessage(null)} /> : null}
      </ToastViewport>
    </>
  );
}
