import { createBrowserClient } from "@supabase/ssr";
import { fetchWithTimeout } from "./fetchWithTimeout";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL veya Anon Key bulunamadı. Lütfen .env.local dosyasını kontrol edin."
  );
}

export const publicSupabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});
