"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui";
import { Button } from "@/app/components/ui";
import { Input } from "@/app/components/ui";
import { Select } from "@/app/components/ui";
import { User, MapPin, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

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

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const cleanUsername = useMemo(
    () => username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
    [username]
  );

  // Check authentication and load existing profile data
  useEffect(() => {
    const checkUserAndProfile = async () => {
      setIsLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        router.replace("/login");
        return;
      }

      // Check if user already has a complete profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, state")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        // If profile is complete, redirect to home
        if (profile.username && profile.state) {
          router.replace("/");
          return;
        }
        // Pre-fill existing data
        if (profile.username) setUsername(profile.username);
        if (profile.state) setStateCode(profile.state);
      } else {
        // Check user metadata from auth (set during registration)
        const metadata = userData.user.user_metadata;
        if (metadata?.username) setUsername(metadata.username);
        if (metadata?.state) setStateCode(metadata.state);
      }

      setIsLoading(false);
    };

    checkUserAndProfile();
  }, [router]);

  const save = async () => {
    // Validation
    if (!cleanUsername || cleanUsername.length < 3) {
      setStatus("error");
      setStatusMessage("Kullanıcı adı en az 3 karakter olmalı");
      return;
    }

    if (cleanUsername.length > 20) {
      setStatus("error");
      setStatusMessage("Kullanıcı adı en fazla 20 karakter olabilir");
      return;
    }

    if (!stateCode) {
      setStatus("error");
      setStatusMessage("Lütfen bir eyalet seçin");
      return;
    }

    setStatus("loading");
    setStatusMessage("Profil kaydediliyor...");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setStatus("error");
      setStatusMessage("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", cleanUsername)
      .neq("id", user.id)
      .single();

    if (existingUser) {
      setStatus("error");
      setStatusMessage("Bu kullanıcı adı zaten kullanılıyor. Lütfen başka bir isim deneyin.");
      return;
    }

    // Save profile
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        username: cleanUsername,
        state: stateCode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      setStatus("error");
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        setStatusMessage("Bu kullanıcı adı zaten kullanılıyor.");
      } else {
        setStatusMessage(`Hata: ${error.message}`);
      }
      return;
    }

    setStatus("success");
    setStatusMessage("Profiliniz kaydedildi! Yönlendiriliyorsunuz...");
    setTimeout(() => router.replace("/"), 1000);
  };

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="flex items-center gap-3 text-neutral-500">
          <span className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
          Yükleniyor...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <Card variant="elevated" className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-center">Son Bir Adım!</CardTitle>
          <CardDescription className="text-center">
            Profilinizi tamamlayın ve AmerikaLa topluluğuna katılın
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Username */}
          <div>
            <Input
              label="Kullanıcı Adı"
              type="text"
              placeholder="kullaniciadi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<User className="w-4 h-4" />}
              disabled={status === "loading" || status === "success"}
            />
            {cleanUsername && (
              <p className="mt-1.5 text-xs text-neutral-500">
                Profil adresiniz: <span className="font-medium">@{cleanUsername}</span>
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
              disabled={status === "loading" || status === "success"}
            />
            <p className="mt-1.5 text-xs text-neutral-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Yaşadığınız eyalet. Ayarlardan sonra değiştirebilirsiniz.
            </p>
          </div>

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

          {/* Continue Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={save}
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading" ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Kaydediliyor...
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Tamamlandı!
              </>
            ) : (
              "Devam Et"
            )}
          </Button>

          {/* Info text */}
          <p className="text-center text-xs text-neutral-500">
            Bu bilgileri daha sonra profil ayarlarınızdan değiştirebilirsiniz.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
