(cd "$(git rev-parse --show-toplevel)" && git apply--3way << 'EOF'
diff--git a / app / login / page.tsx b / app / login / page.tsx
index 85e7e119eacfd225239103b4fd93caaf639cde69..eae459901659c28c1e658f2a293ab616a411d698 100644
--- a / app / login / page.tsx
+++ b / app / login / page.tsx
@@ -1, 28 + 1, 29 @@
"use client";

import { useEffect, useState } from "react";
+import Image from "next/image";
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
        @@ -71, 56 + 72, 59 @@ export default function LoginPage() {
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
                            -            <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                                -              <span className="text-white font-semibold text-xl">a</span>
                                -            </div>
                            -            <span className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
                                -              amerikala
                                -            </span>
                            +            <Image
+              src="/logo.png"
                            +              alt="amerikala logo"
                            +              width={40}
                            +              height={40}
                            +              className="h-10 w-10"
                            +              priority
+            />
                            +            <span className="sr-only">amerikala</span>
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
                                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${loginMethod === "password"
                                            ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-xs)]"
                                            : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                                        }`}
                                >
                                    Şifre ile
                                </button>
                                <button
                                    onClick={() => setLoginMethod("magic")}
                                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${EOF
)