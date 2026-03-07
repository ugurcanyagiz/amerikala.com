"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui";
import { Button } from "@/app/components/ui";
import { Input } from "@/app/components/ui";
import { Select } from "@/app/components/ui";
import { Mail, Lock, User, MapPin, Eye, EyeOff, CheckCircle2, AlertCircle, UserCircle } from "lucide-react";

const US_STATES = [
  { value: "AL", label: "Alabama (AL)" },
  { value: "AK", label: "Alaska (AK)" },
  { value: "AZ", label: "Arizona (AZ)" },
  { value: "AR", label: "Arkansas (AR)" },
  { value: "CA", label: "California (CA)" },
  { value: "CO", label: "Colorado (CO)" },
  { value: "CT", label: "Connecticut (CT)" },
  { value: "DE", label: "Delaware (DE)" },
  { value: "FL", label: "Florida (FL)" },
  { value: "GA", label: "Georgia (GA)" },
  { value: "HI", label: "Hawaii (HI)" },
  { value: "ID", label: "Idaho (ID)" },
  { value: "IL", label: "Illinois (IL)" },
  { value: "IN", label: "Indiana (IN)" },
  { value: "IA", label: "Iowa (IA)" },
  { value: "KS", label: "Kansas (KS)" },
  { value: "KY", label: "Kentucky (KY)" },
  { value: "LA", label: "Louisiana (LA)" },
  { value: "ME", label: "Maine (ME)" },
  { value: "MD", label: "Maryland (MD)" },
  { value: "MA", label: "Massachusetts (MA)" },
  { value: "MI", label: "Michigan (MI)" },
  { value: "MN", label: "Minnesota (MN)" },
  { value: "MS", label: "Mississippi (MS)" },
  { value: "MO", label: "Missouri (MO)" },
  { value: "MT", label: "Montana (MT)" },
  { value: "NE", label: "Nebraska (NE)" },
  { value: "NV", label: "Nevada (NV)" },
  { value: "NH", label: "New Hampshire (NH)" },
  { value: "NJ", label: "New Jersey (NJ)" },
  { value: "NM", label: "New Mexico (NM)" },
  { value: "NY", label: "New York (NY)" },
  { value: "NC", label: "North Carolina (NC)" },
  { value: "ND", label: "North Dakota (ND)" },
  { value: "OH", label: "Ohio (OH)" },
  { value: "OK", label: "Oklahoma (OK)" },
  { value: "OR", label: "Oregon (OR)" },
  { value: "PA", label: "Pennsylvania (PA)" },
  { value: "RI", label: "Rhode Island (RI)" },
  { value: "SC", label: "South Carolina (SC)" },
  { value: "SD", label: "South Dakota (SD)" },
  { value: "TN", label: "Tennessee (TN)" },
  { value: "TX", label: "Texas (TX)" },
  { value: "UT", label: "Utah (UT)" },
  { value: "VT", label: "Vermont (VT)" },
  { value: "VA", label: "Virginia (VA)" },
  { value: "WA", label: "Washington (WA)" },
  { value: "WV", label: "West Virginia (WV)" },
  { value: "WI", label: "Wisconsin (WI)" },
  { value: "WY", label: "Wyoming (WY)" },
];

type StatusType = "idle" | "loading" | "success" | "error";

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  state?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [stateCode, setStateCode] = useState("");
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Clean username (only lowercase letters, numbers, underscore)
  const cleanUsername = useMemo(
    () => username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
    [username]
  );

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/");
      }
    };
    checkSession();
  }, [router]);

  // Password strength checker
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: "Zayıf", color: "bg-red-500" };
    if (score <= 2) return { score, label: "Orta", color: "bg-yellow-500" };
    if (score <= 3) return { score, label: "İyi", color: "bg-blue-500" };
    return { score, label: "Güçlü", color: "bg-green-500" };
  }, [password]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!email) {
      newErrors.email = "Email adresi gerekli";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Geçerli bir email adresi girin";
    }

    // First name validation
    if (!firstName.trim()) {
      newErrors.firstName = "İsim gerekli";
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = "İsim en az 2 karakter olmalı";
    } else if (firstName.trim().length > 30) {
      newErrors.firstName = "İsim en fazla 30 karakter olabilir";
    }

    // Last name validation
    if (!lastName.trim()) {
      newErrors.lastName = "Soyisim gerekli";
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = "Soyisim en az 2 karakter olmalı";
    } else if (lastName.trim().length > 30) {
      newErrors.lastName = "Soyisim en fazla 30 karakter olabilir";
    }

    // Username validation
    if (!cleanUsername) {
      newErrors.username = "Kullanıcı adı gerekli";
    } else if (cleanUsername.length < 3) {
      newErrors.username = "Kullanıcı adı en az 3 karakter olmalı";
    } else if (cleanUsername.length > 20) {
      newErrors.username = "Kullanıcı adı en fazla 20 karakter olabilir";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Şifre gerekli";
    } else if (password.length < 8) {
      newErrors.password = "Şifre en az 8 karakter olmalı";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Şifre tekrarı gerekli";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Şifreler eşleşmiyor";
    }

    // State validation
    if (!stateCode) {
      newErrors.state = "Eyalet seçimi gerekli";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle registration
  const handleRegister = async () => {
    if (!validateForm()) return;

    if (!acceptTerms) {
      setStatus("error");
      setStatusMessage("Kullanım şartlarını kabul etmelisiniz");
      return;
    }

    setStatus("loading");
    setStatusMessage("Hesap oluşturuluyor...");

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            username: cleanUsername,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: fullName,
            state: stateCode,
          },
        },
      });

      if (authError) {
        setStatus("error");
        if (authError.message.includes("already registered")) {
          setStatusMessage("Bu email adresi zaten kayıtlı. Giriş yapmayı deneyin.");
        } else {
          setStatusMessage(`Hata: ${authError.message}`);
        }
        return;
      }

      if (!authData.user) {
        setStatus("error");
        setStatusMessage("Hesap oluşturulamadı. Lütfen tekrar deneyin.");
        return;
      }

      // 2. Create profile with first_name, last_name, full_name
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: authData.user.id,
          username: cleanUsername,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName,
          state: stateCode,
          show_full_name: true, // Varsayılan olarak isim gösterilsin
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Profile error is not critical - user can update later
      }

      setStatus("success");
      setStatusMessage(
        "Hesabınız oluşturuldu! Email adresinize gönderilen doğrulama linkine tıklayın."
      );

      // Redirect after success message
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      setStatus("error");
      setStatusMessage("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
      console.error("Registration error:", error);
    }
  };

  return (
    <main className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 bg-[var(--color-surface)]">
      <Card variant="elevated" className="w-full max-w-md bg-[var(--color-surface-raised)] border border-[var(--color-border-light)]">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <User className="w-6 h-6 text-[var(--color-ink-inverse)]" />
            </div>
          </div>
          <CardTitle className="text-center">Hesap Oluştur</CardTitle>
          <CardDescription className="text-center">
            AmerikaLa topluluğuna katılın ve Amerika&apos;daki Türk topluluğuyla bağlantı kurun
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Email */}
          <Input
            label="Email Adresi"
            type="email"
            placeholder="ornek@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            error={errors.email}
            disabled={status === "loading" || status === "success"}
          />

          {/* First Name & Last Name - Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="İsim"
              type="text"
              placeholder="Ahmet"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              icon={<UserCircle className="w-4 h-4" />}
              error={errors.firstName}
              disabled={status === "loading" || status === "success"}
            />
            <Input
              label="Soyisim"
              type="text"
              placeholder="Yılmaz"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={errors.lastName}
              disabled={status === "loading" || status === "success"}
            />
          </div>
          <p className="text-xs text-[var(--color-ink-tertiary)] -mt-3 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            İsim ve soyisim kayıt sonrası değiştirilemez
          </p>

          {/* Username */}
          <div>
            <Input
              label="Kullanıcı Adı"
              type="text"
              placeholder="kullaniciadi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<User className="w-4 h-4" />}
              error={errors.username}
              disabled={status === "loading" || status === "success"}
            />
            {cleanUsername && !errors.username && (
              <p className="mt-1.5 text-xs text-[var(--color-ink-tertiary)]">
                Profil adresiniz: @{cleanUsername}
              </p>
            )}
          </div>

          {/* State Selection */}
          <div>
            <Select
              label="Eyalet"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              options={[{ value: "", label: "Eyalet seçin..." }, ...US_STATES]}
              error={errors.state}
              disabled={status === "loading" || status === "success"}
            />
            <p className="mt-1.5 text-xs text-[var(--color-ink-tertiary)] flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Yaşadığınız eyalet. Sonra değiştirebilirsiniz.
            </p>
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Input
                label="Şifre"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                error={errors.password}
                disabled={status === "loading" || status === "success"}
              />
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                variant="ghost"
                size="icon"
                className="absolute right-1 top-7 h-8 w-8 text-[var(--color-ink-tertiary)] shadow-none hover:shadow-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {/* Password strength indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        level <= passwordStrength.score
                          ? passwordStrength.color
                          : "bg-[var(--color-border)]"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[var(--color-ink-tertiary)]">
                  Şifre gücü: {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Input
              label="Şifre Tekrarı"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword}
              disabled={status === "loading" || status === "success"}
            />
            <Button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              variant="ghost"
              size="icon"
              className="absolute right-1 top-7 h-8 w-8 text-[var(--color-ink-tertiary)] shadow-none hover:shadow-none"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          {/* Terms acceptance */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              disabled={status === "loading" || status === "success"}
            />
            <span className="text-sm text-[var(--color-ink-secondary)]">
              <Link href="/yasal-rehber" className="text-[var(--color-primary)] hover:underline">
                Kullanım Şartları
              </Link>
              {" "}ve{" "}
              <Link href="/yasal-rehber" className="text-[var(--color-primary)] hover:underline">
                Gizlilik Politikası
              </Link>
              &apos;nı okudum ve kabul ediyorum.
            </span>
          </label>

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

          {/* Register Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleRegister}
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading" ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Oluşturuluyor...
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Hesap Oluşturuldu
              </>
            ) : (
              "Hesap Oluştur"
            )}
          </Button>

          {/* Login link */}
          <p className="text-center text-sm text-[var(--color-ink-secondary)]">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/login"
              className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium hover:underline"
            >
              Giriş Yapın
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
