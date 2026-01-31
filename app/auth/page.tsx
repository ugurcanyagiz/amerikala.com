"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      // OAuth sonrası session genelde otomatik set edilir.
      // Sadece güvenli şekilde user var mı kontrol edip yönlendirelim.
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      router.replace("/");
    };
    run();
  }, [router]);

  return (
    <main className="p-10 text-sm opacity-70">
      Signing you in...
    </main>
  );
}
