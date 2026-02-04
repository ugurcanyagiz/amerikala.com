"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui";
import { Button } from "@/app/components/ui";
import { Input } from "@/app/components/ui";
import { Mail, Lock, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

type StatusType = "idle" | "loading" | "success" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [loginMethod, setLoginMethod] = useState<"password" | "magic">("password");

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace("/");
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/");
    });

    return () => sub.subscription.unsubscribe();
  }, [router]);

  const sendMagicLink = async () => {
    if (!email) {
      setStatus("error");
      setStatusMessage("Email adresi gerekli");
      return;
    }

    setStatus("loading");
    setStatusMessage("Link gönderiliyor...");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setStatus("error");
      setStatusMessage(`Hata: ${error.message}`);
    } else {
      setStatus("success");
      setStatusMessage("Email adresinize giriş linki gönderildi");
    }
  };

  const loginWithPassword = async () => {
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
      if (error.message.includes("Invalid login")) {
        setStatusMessage("Email veya şifre hatalı");
      } else if (error.message.includes("Email not confirmed")) {
        setStatusMessage("Email adresinizi doğrulamanız gerekiyor");
      } else {
        setStatusMessage(`Hata: ${error.message}`);
      }
    } else {
      setStatus("success");
      setStatusMessage("Giriş başarılı! Yönlendiriliyorsunuz...");
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-white font-semibold text-xl">a</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
              amerikala
            </span>
          </Link>
        </div>

        <Card variant="elevated" padding="lg">
          <CardHeader className="text-center">
            <CardTitle>Hoş Geldiniz</CardTitle>
            <CardDescription>Hesabınıza giriş yapın</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Login Method Toggle */}
            <div className="flex rounded-lg bg-[var(--color-surface-sunken)] p-1">
              <button
                onClick={() => setLoginMethod("password")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === "password"
                    ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-xs)]"
                    : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                }`}
              >
                Şifre ile
              </button>
              <button
                onClick={() => setLoginMethod("magic")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  loginMethod === "magic"
                    ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-xs)]"
                    : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Magic Link
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
              disabled={status === "loading"}
            />

            {/* Password (only for password method) */}
            {loginMethod === "password" && (
              <div className="relative">
                <Input
                  label="Şifre"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  disabled={status === "loading"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-10 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Forgot password link */}
            {loginMethod === "password" && (
              <div className="text-right">
                <Link
                  href="/reset-password"
                  className="text-sm text-[var(--color-primary)] hover:underline"
                >
                  Şifremi Unuttum
                </Link>
              </div>
            )}

            {/* Status message */}
            {statusMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  status === "success"
                    ? "bg-[var(--color-success-light)] text-[var(--color-success)]"
                    : status === "error"
                    ? "bg-[var(--color-error-light)] text-[var(--color-error)]"
                    : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]"
                }`}
              >
                {status === "success" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : status === "error" ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                ) : null}
                {statusMessage}
              </div>
            )}

            {/* Login Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={loginMethod === "password" ? loginWithPassword : sendMagicLink}
              disabled={status === "loading"}
              loading={status === "loading"}
            >
              {loginMethod === "password" ? "Giriş Yap" : "Magic Link Gönder"}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border-light)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--color-surface)] px-3 text-[var(--color-ink-tertiary)]">
                  veya
                </span>
              </div>
            </div>

            {/* Register link */}
            <Link href="/register" className="block">
              <Button variant="outline" size="lg" className="w-full">
                Yeni Hesap Oluştur
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-[var(--color-ink-secondary)] mt-6">
          Hesabınız yok mu?{" "}
          <Link
            href="/register"
            className="text-[var(--color-primary)] hover:underline font-medium"
          >
            Hemen kayıt olun
          </Link>
        </p>
      </div>
    </main>
  );
}
