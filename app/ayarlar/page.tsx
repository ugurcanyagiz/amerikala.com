"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
  Settings, User, Bell, Lock, Globe, Palette, LogOut, Camera, 
  Mail, Phone, MapPin, Save, Eye, EyeOff, CheckCircle2, AlertCircle, Shield
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";

type Tab = "profile" | "account" | "notifications" | "privacy";

export default function AyarlarPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [profile, setProfile] = useState({
    username: "", displayName: "", email: "", phone: "", bio: "",
    state: "NJ", city: "", website: "", openToMeet: false,
  });

  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true, push: true, messages: true, events: true, follows: true, marketing: false,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.push("/login"); return; }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single();
    if (profileData) {
      setProfile({
        username: profileData.username || "", displayName: profileData.display_name || "",
        email: userData.user.email || "", phone: profileData.phone || "", bio: profileData.bio || "",
        state: profileData.state || "NJ", city: profileData.city || "", website: profileData.website || "",
        openToMeet: profileData.open_to_meet || false,
      });
    }
  };

  const saveProfile = async () => {
    setLoading(true); setStatus(null);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from("profiles").upsert({
      id: userData.user.id, username: profile.username, display_name: profile.displayName,
      phone: profile.phone, bio: profile.bio, state: profile.state, city: profile.city,
      website: profile.website, open_to_meet: profile.openToMeet, updated_at: new Date().toISOString(),
    });

    setLoading(false);
    setStatus(error ? { type: "error", message: "Hata oluştu." } : { type: "success", message: "Profil güncellendi!" });
  };

  const updatePassword = async () => {
    if (passwords.new !== passwords.confirm) { setStatus({ type: "error", message: "Şifreler eşleşmiyor." }); return; }
    if (passwords.new.length < 8) { setStatus({ type: "error", message: "Şifre en az 8 karakter olmalı." }); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    setLoading(false);
    setStatus(error ? { type: "error", message: error.message } : { type: "success", message: "Şifre güncellendi!" });
    if (!error) setPasswords({ current: "", new: "", confirm: "" });
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const tabs = [
    { id: "profile" as Tab, label: "Profil", icon: User },
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
            {/* TABS */}
            <div className="lg:w-64 flex-shrink-0">
              <Card className="glass sticky top-24">
                <CardContent className="p-2">
                  <nav className="space-y-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-smooth ${
                            activeTab === tab.id ? "bg-red-500 text-white" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          }`}>
                          <Icon size={20} />{tab.label}
                        </button>
                      );
                    })}
                    <hr className="my-2 border-neutral-200 dark:border-neutral-800" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-smooth">
                      <LogOut size={20} />Çıkış Yap
                    </button>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* CONTENT */}
            <div className="flex-1 space-y-6">
              {status && (
                <div className={`flex items-center gap-2 p-4 rounded-lg ${status.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
                  {status.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  {status.message}
                </div>
              )}

              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <Card className="glass">
                  <CardHeader><CardTitle>Profil Bilgileri</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar src="/avatars/default.jpg" fallback={profile.username} size="xl" />
                        <button className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-smooth">
                          <Camera size={18} />
                        </button>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">@{profile.username || "kullanici"}</h3>
                        <p className="text-neutral-500">Profil fotoğrafını değiştir</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Input label="Kullanıcı Adı" value={profile.username} onChange={(e) => setProfile({...profile, username: e.target.value})} icon={<User size={18} />} />
                      <Input label="Görünen Ad" value={profile.displayName} onChange={(e) => setProfile({...profile, displayName: e.target.value})} />
                    </div>

                    <Input label="Email" value={profile.email} disabled icon={<Mail size={18} />} />

                    <div className="grid md:grid-cols-2 gap-4">
                      <Input label="Telefon" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} icon={<Phone size={18} />} placeholder="+1 (555) 000-0000" />
                      <Input label="Website" value={profile.website} onChange={(e) => setProfile({...profile, website: e.target.value})} icon={<Globe size={18} />} placeholder="https://..." />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Select label="Eyalet" value={profile.state} onChange={(e) => setProfile({...profile, state: e.target.value})}
                        options={[{value:"NJ",label:"New Jersey"},{value:"NY",label:"New York"},{value:"CA",label:"California"},{value:"TX",label:"Texas"}]} />
                      <Input label="Şehir" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} icon={<MapPin size={18} />} />
                    </div>

                    <Textarea label="Hakkımda" value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} rows={4} placeholder="Kendinizden bahsedin..." />

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={profile.openToMeet} onChange={(e) => setProfile({...profile, openToMeet: e.target.checked})} className="h-5 w-5 rounded border-neutral-300 text-red-600 focus:ring-red-500" />
                      <span>Tanışmaya açığım - Profilimde görünsün</span>
                    </label>

                    <Button variant="primary" onClick={saveProfile} disabled={loading} className="gap-2">
                      <Save size={18} />{loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* ACCOUNT TAB */}
              {activeTab === "account" && (
                <Card className="glass">
                  <CardHeader><CardTitle>Şifre Değiştir</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Yeni Şifre" type={showPasswords ? "text" : "password"} value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} icon={<Lock size={18} />} />
                    <Input label="Şifre Tekrarı" type={showPasswords ? "text" : "password"} value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} icon={<Lock size={18} />} />
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} />
                      Şifreleri göster
                    </label>
                    <Button variant="primary" onClick={updatePassword} disabled={loading}>{loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}</Button>
                  </CardContent>
                </Card>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === "notifications" && (
                <Card className="glass">
                  <CardHeader><CardTitle>Bildirim Tercihleri</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {key: "email", label: "Email Bildirimleri", desc: "Önemli güncellemeleri email ile al"},
                      {key: "push", label: "Push Bildirimleri", desc: "Tarayıcı bildirimleri"},
                      {key: "messages", label: "Mesaj Bildirimleri", desc: "Yeni mesajlarda bildirim al"},
                      {key: "events", label: "Etkinlik Bildirimleri", desc: "Yaklaşan etkinlikler hakkında hatırlatma"},
                      {key: "follows", label: "Takip Bildirimleri", desc: "Yeni takipçilerde bildirim al"},
                      {key: "marketing", label: "Pazarlama Emailları", desc: "Kampanya ve haberler"},
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-neutral-500">{item.desc}</p>
                        </div>
                        <input type="checkbox" checked={notifications[item.key as keyof typeof notifications]} onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})} className="h-5 w-5 rounded border-neutral-300 text-red-600 focus:ring-red-500" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* PRIVACY TAB */}
              {activeTab === "privacy" && (
                <Card className="glass">
                  <CardHeader><CardTitle>Gizlilik Ayarları</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Select label="Profil Görünürlüğü" options={[{value:"public",label:"Herkese Açık"},{value:"members",label:"Sadece Üyeler"},{value:"private",label:"Gizli"}]} />
                    {[
                      {key: "showEmail", label: "Email Adresimi Göster"},
                      {key: "showPhone", label: "Telefon Numaramı Göster"},
                      {key: "showLocation", label: "Konumumu Göster"},
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                        <span className="font-medium">{item.label}</span>
                        <input type="checkbox" className="h-5 w-5 rounded border-neutral-300 text-red-600 focus:ring-red-500" />
                      </label>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
