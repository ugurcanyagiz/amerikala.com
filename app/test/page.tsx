"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function TestPage() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    const check = async () => {
      const { data, error } = await supabase.auth.getSession();
      setStatus(error ? error.message : "Supabase connected ✅");
    };
    check();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Supabase Test</h1>
      <p className="mt-4">{status}</p>
    </main>
  );
}
