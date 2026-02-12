"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { Settings, Bell, Lock, LogOut, Eye, EyeOff, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

type Tab = "account" | "notifications" | "privacy";

export default function AyarlarPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    messages: true,
    events: true,
    follows: true,
    marketing: false,
  });

  useEffect(() => {
    const ensureUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
      }
    };

    ensureUser();
  }, [router]);

  const updatePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setStatus({ type: "error", message: "Şifreler eşleşmiyor." });
      return;
    }

    if (passwords.new.length < 8) {
      setStatus({ type: "error", message: "Şifre en az 8 karakter olmalı." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    setLoading(false);

    setStatus(error ? { type: "error", message: error.message } : { type: "success", message: "Şifre güncellendi!" });

    if (!error) {
      setPasswords({ current: "", new: "", confirm: "" });
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const tabs = [
    { id: "account" as Tab, label: "Hesap", icon: Lock },
    { id: "notifications" as Tab, label: "Bildirimler", icon: Bell },
    { id: "privacy" as Tab, label: "Gizlilik", icon: Shield },
  ];

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="h-8 w-8 text-red-500" />Ayarlar
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">Hesap ayarlarınızı yönetin</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-64 flex-shrink-0">
              <Card className="glass sticky top-24">
                <CardContent className="p-2">
                  <nav className="space-y-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-smooth ${
                            activeTab === tab.id
                              ? "bg-red-500 text-white"
                              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          }`}
                        >
                          <Icon size={18} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 space-y-6">
              {status && (
                <div
                  className={`p-4 rounded-xl flex items-center gap-2 ${
                    status.type === "success"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                  }`}
                >
                  {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <span>{status.message}</span>
                </div>
              )}

              {activeTab === "account" && (
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Şifre Değiştir</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="Yeni Şifre"
                      type={showPasswords ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      icon={<Lock size={18} />}
                    />
                    <Input
                      label="Şifre Tekrarı"
                      type={showPasswords ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      icon={<Lock size={18} />}
                    />
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} />
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                      Şifreleri göster
                    </label>
                    <Button variant="primary" onClick={updatePassword} disabled={loading}>
                      {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {activeTab === "notifications" && (
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Bildirim Tercihleri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: "email", label: "Email Bildirimleri", desc: "Önemli güncellemeleri email ile al" },
                      { key: "push", label: "Push Bildirimleri", desc: "Tarayıcı bildirimleri" },
                      { key: "messages", label: "Mesaj Bildirimleri", desc: "Yeni mesajlarda bildirim al" },
                      { key: "events", label: "Etkinlik Bildirimleri", desc: "Yaklaşan etkinlikler hakkında hatırlatma" },
                      { key: "follows", label: "Takip Bildirimleri", desc: "Yeni takipçilerde bildirim al" },
                      { key: "marketing", label: "Pazarlama Emailları", desc: "Kampanya ve haberler" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-neutral-500">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="h-5 w-5 rounded border-neutral-300 text-red-600 focus:ring-red-500"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {activeTab === "privacy" && (
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Gizlilik Ayarları</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select
                      label="Profil Görünürlüğü"
                      options={[
                        { value: "public", label: "Herkese Açık" },
                        { value: "members", label: "Sadece Üyeler" },
                        { value: "private", label: "Gizli" },
                      ]}
                    />
                    {[
                      { key: "showEmail", label: "Email Adresimi Göster" },
                      { key: "showPhone", label: "Telefon Numaramı Göster" },
                      { key: "showLocation", label: "Konumumu Göster" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 cursor-pointer"
                      >
                        <span className="font-medium">{item.label}</span>
                        <input type="checkbox" className="h-5 w-5 rounded border-neutral-300 text-red-600 focus:ring-red-500" />
                      </label>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="glass border-red-200 dark:border-red-900">
                <CardContent className="p-4">
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-600 hover:text-red-700">
                    <LogOut size={18} className="mr-2" />
                    Çıkış Yap
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
