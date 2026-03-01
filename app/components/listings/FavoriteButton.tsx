"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/app/components/ui/Button";
import { Toast, ToastViewport } from "@/app/components/ui/Toast";
import type { FavoriteTargetType } from "@/lib/types";

type FavoriteButtonProps = {
  targetType: FavoriteTargetType;
  targetId: string;
  className?: string;
  size?: "sm" | "md";
  onFavoriteChange?: (nextValue: boolean) => void;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function FavoriteButton({ targetType, targetId, className = "", size = "md", onFavoriteChange }: FavoriteButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isValidTarget = useMemo(() => UUID_REGEX.test(targetId), [targetId]);
  const isEmlak = targetType === "emlak";

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    let isMounted = true;

    const loadFavoriteStatus = async () => {
      if (!user?.id || !isValidTarget) {
        if (!isMounted) return;
        setIsFavorite(false);
        setLoading(false);
        return;
      }

      setLoading(true);

      const query = isEmlak
        ? supabase.from("listing_favorites").select("listing_id").eq("listing_id", targetId).eq("user_id", user.id)
        : supabase.from("favorites").select("id").eq("user_id", user.id).eq("target_type", targetType).eq("target_id", targetId);

      const { data, error } = await query.maybeSingle();

      if (!isMounted) return;
      if (error) {
        setToastMessage("Favori durumu alınamadı.");
      }

      setIsFavorite(Boolean(data));
      setLoading(false);
    };

    void loadFavoriteStatus();

    return () => {
      isMounted = false;
    };
  }, [isEmlak, isValidTarget, targetId, targetType, user?.id]);

  const handleToggle = async () => {
    if (!isValidTarget || pending) return;

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const nextValue = !isFavorite;
    setPending(true);
    setIsFavorite(nextValue);
    onFavoriteChange?.(nextValue);

    const rollback = () => {
      setIsFavorite(!nextValue);
      onFavoriteChange?.(!nextValue);
    };

    let error: { message?: string } | null = null;

    if (nextValue) {
      if (isEmlak) {
        const response = await supabase.from("listing_favorites").insert({ listing_id: targetId, user_id: user.id });
        error = response.error;
      } else {
        const response = await supabase.from("favorites").insert({ user_id: user.id, target_type: targetType, target_id: targetId });
        error = response.error;
      }
    } else if (isEmlak) {
      const response = await supabase.from("listing_favorites").delete().eq("listing_id", targetId).eq("user_id", user.id);
      error = response.error;
    } else {
      const response = await supabase.from("favorites").delete().eq("user_id", user.id).eq("target_type", targetType).eq("target_id", targetId);
      error = response.error;
    }

    if (error) {
      rollback();
      setToastMessage("Favori işlemi tamamlanamadı.");
    }

    setPending(false);
  };

  const buttonSize = size === "sm" ? "w-9 h-9" : "w-10 h-10";

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending || loading || !isValidTarget}
        aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
        title="İlanı beğen / takip et"
        className={`${buttonSize} rounded-full flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          isFavorite ? "bg-red-500 text-white" : "bg-white/90 text-neutral-600 hover:bg-white"
        } ${className}`}
      >
        {pending || loading ? <Loader2 size={18} className="animate-spin" /> : <Heart size={20} className={isFavorite ? "fill-current" : ""} />}
      </button>

      <Modal open={showLoginModal} onClose={() => setShowLoginModal(false)} size="sm">
        <div className="space-y-5">
          <h3 className="text-xl font-semibold text-neutral-900">Takip etmek için giriş yap</h3>
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button variant="secondary" onClick={() => setShowLoginModal(false)}>
              Vazgeç
            </Button>
            <Button variant="primary" onClick={() => router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)}>
              Giriş Yap
            </Button>
          </div>
        </div>
      </Modal>

      <ToastViewport>{toastMessage ? <Toast variant="error" description={toastMessage} onClose={() => setToastMessage(null)} /> : null}</ToastViewport>
    </>
  );
}
