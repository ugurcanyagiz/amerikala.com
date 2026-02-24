"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui";
import { Button } from "@/app/components/ui";
import { Input } from "@/app/components/ui";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

type StatusType = "idle" | "loading" | "success" | "error";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace("/");
    };
    init();
  }, [router]);

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      setStatus("error");
      setStatusMessage("Email ve şifre gerekli");
      return;
    }

    setStatus("loading");
    setStatusMessage("Giriş yapılıyor...");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      const lowerMessage = error.message.toLowerCase();
      if (error.message.includes("Invalid login")) {
        setStatusMessage("Email veya şifre hatalı");
      } else if (error.message.includes("Email not confirmed")) {
        setStatusMessage("Email adresinizi doğrulamanız gerekiyor");
      } else if (lowerMessage.includes("aborted") || lowerMessage.includes("timeout")) {
        setStatusMessage("Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.");
      } else {
        setStatusMessage(`Hata: ${error.message}`);
      }
      return;
    }

    setStatus("success");
    setStatusMessage("Giriş başarılı! Yönlendiriliyorsunuz...");
    router.replace("/");
  };

  const isBusy = status === "loading" || status === "success";
  const accessMessage = searchParams.get("message");
  const effectiveStatus = statusMessage ? status : accessMessage ? "error" : "idle";
  const effectiveStatusMessage = statusMessage || accessMessage || "";

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="amerikala logo"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <span className="sr-only">amerikala</span>
          </Link>
        </div>

        <Card variant="elevated" padding="lg">
          <CardHeader className="text-center">
            <CardTitle>Hoş Geldiniz</CardTitle>
            <CardDescription>Hesabınıza giriş yapın</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex rounded-lg bg-[var(--color-surface-sunken)] p-1">
              <button
                type="button"
                className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-xs)]"
              >
                Giriş Yap
              </button>
            </div>

            {/* Email */}
            <Input
              label="Email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              disabled={isBusy}
            />

            <div className="relative">
              <Input
                label="Şifre"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                disabled={isBusy}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Status message */}
            {effectiveStatusMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  effectiveStatus === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : effectiveStatus === "error"
                    ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
              >
                {effectiveStatus === "success" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : effectiveStatus === "error" ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                ) : null}
                {effectiveStatusMessage}
              </div>
            )}

            {/* Submit */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handlePasswordLogin}
              disabled={isBusy}
            >
              {status === "loading" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Giriş Başarılı
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>

            {/* Links */}
            <div className="flex items-center justify-between text-sm">
              <Link
                href="/reset-password"
                className="text-red-600 hover:text-red-700 font-medium hover:underline"
              >
                Şifremi Unuttum
              </Link>
              <Link
                href="/register"
                className="text-red-600 hover:text-red-700 font-medium hover:underline"
              >
                Kayıt Ol
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
