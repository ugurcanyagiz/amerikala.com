"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui";
import { Button } from "@/app/components/ui";
import { Input } from "@/app/components/ui";
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

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
      setStatusMessage("Email adresinize giriş linki gönderildi ✨");
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
        setStatusMessage("Email adresinizi doğrulamanız gerekiyor. Emailinizi kontrol edin.");
      } else {
        setStatusMessage(`Hata: ${error.message}`);
      }
    } else {
      setStatus("success");
      setStatusMessage("Giriş başarılı! Yönlendiriliyorsunuz...");
    }
  };

  return (
    <main className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <Card variant="elevated" className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <LogIn className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-center">Tekrar Hoş Geldiniz</CardTitle>
          <CardDescription className="text-center">
            AmerikaLa hesabınıza giriş yapın
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Login Method Toggle */}
          <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-800 p-1">
            <button
              onClick={() => setLoginMethod("password")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                loginMethod === "password"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Şifre ile Giriş
            </button>
            <button
              onClick={() => setLoginMethod("magic")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                loginMethod === "magic"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Magic Link
            </button>
          </div>

          {/* Email */}
          <Input
            label="Email Adresi"
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
                className="absolute right-3 top-9 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
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
                className="text-sm text-red-600 hover:text-red-700 hover:underline"
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
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : status === "error"
                  ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
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
          >
            {status === "loading" ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {loginMethod === "password" ? "Giriş yapılıyor..." : "Link gönderiliyor..."}
              </>
            ) : loginMethod === "password" ? (
              "Giriş Yap"
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Magic Link Gönder
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-neutral-950 px-2 text-neutral-500">
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

          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Hesabınız yok mu?{" "}
            <Link
              href="/register"
              className="text-red-600 hover:text-red-700 font-medium hover:underline"
            >
              Hemen kayıt olun
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
