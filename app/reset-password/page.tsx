"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui";
import { Button } from "@/app/components/ui";
import { Input } from "@/app/components/ui";
import { Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

type StatusType = "idle" | "loading" | "success" | "error";
type PageMode = "request" | "reset";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Determine mode based on URL params (if coming from email link, we're in reset mode)
  const [mode, setMode] = useState<PageMode>("request");
  
  // Request mode state
  const [email, setEmail] = useState("");
  
  // Reset mode state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Common state
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    // Check if there's an access_token or type=recovery in URL (email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type") || searchParams.get("type");
    const accessToken = hashParams.get("access_token");
    
    if (type === "recovery" || accessToken) {
      setMode("reset");
    }
  }, [searchParams]);

  // Request password reset email
  const requestReset = async () => {
    if (!email) {
      setStatus("error");
      setStatusMessage("Email adresi gerekli");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setStatusMessage("Geçerli bir email adresi girin");
      return;
    }

    setStatus("loading");
    setStatusMessage("Email gönderiliyor...");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setStatus("error");
      setStatusMessage(`Hata: ${error.message}`);
    } else {
      setStatus("success");
      setStatusMessage("Şifre sıfırlama linki email adresinize gönderildi. Lütfen emailinizi kontrol edin.");
    }
  };

  // Update password
  const updatePassword = async () => {
    if (!password) {
      setStatus("error");
      setStatusMessage("Yeni şifre gerekli");
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setStatusMessage("Şifre en az 8 karakter olmalı");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setStatusMessage("Şifreler eşleşmiyor");
      return;
    }

    setStatus("loading");
    setStatusMessage("Şifre güncelleniyor...");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setStatusMessage(`Hata: ${error.message}`);
    } else {
      setStatus("success");
      setStatusMessage("Şifreniz başarıyla güncellendi! Yönlendiriliyorsunuz...");
      setTimeout(() => router.replace("/"), 2000);
    }
  };

  return (
    <Card variant="elevated" className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-center">
          {mode === "request" ? "Şifremi Unuttum" : "Yeni Şifre Belirle"}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === "request"
            ? "Email adresinizi girin, size şifre sıfırlama linki gönderelim"
            : "Hesabınız için yeni bir şifre belirleyin"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {mode === "request" ? (
          <>
            {/* Email input for requesting reset */}
            <Input
              label="Email Adresi"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              disabled={status === "loading" || status === "success"}
            />

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

            {/* Submit button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={requestReset}
              disabled={status === "loading" || status === "success"}
            >
              {status === "loading" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Gönderiliyor...
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Email Gönderildi
                </>
              ) : (
                "Sıfırlama Linki Gönder"
              )}
            </Button>
          </>
        ) : (
          <>
            {/* New password input */}
            <div className="relative">
              <Input
                label="Yeni Şifre"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                disabled={status === "loading" || status === "success"}
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

            {/* Confirm password input */}
            <div className="relative">
              <Input
                label="Şifre Tekrarı"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                disabled={status === "loading" || status === "success"}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password requirements */}
            <p className="text-xs text-neutral-500">
              Şifreniz en az 8 karakter uzunluğunda olmalıdır.
            </p>

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

            {/* Submit button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={updatePassword}
              disabled={status === "loading" || status === "success"}
            >
              {status === "loading" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Güncelleniyor...
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Şifre Güncellendi
                </>
              ) : (
                "Şifreyi Güncelle"
              )}
            </Button>
          </>
        )}

        {/* Back to login link */}
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Giriş sayfasına dön
        </Link>
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card variant="elevated" className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </div>
        <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mx-auto w-40" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mx-auto w-60 mt-2" />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <Suspense fallback={<LoadingFallback />}>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
