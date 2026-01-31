"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type Language = "tr" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("tr");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang && (savedLang === "tr" || savedLang === "en")) {
      setLanguageState(savedLang);
    }
    setIsHydrated(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split(".");
    let value: unknown = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    
    return typeof value === "string" ? value : key;
  }, [language]);

  // Prevent hydration mismatch by showing nothing until hydrated
  // Or you can show a loading state
  if (!isHydrated) {
    return (
      <LanguageContext.Provider value={{ language: "tr", setLanguage, t }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

// TRANSLATIONS
const translations: Record<Language, Record<string, unknown>> = {
  tr: {
    common: {
      save: "Kaydet",
      cancel: "İptal",
      delete: "Sil",
      edit: "Düzenle",
      search: "Ara",
      loading: "Yükleniyor...",
      error: "Hata",
      success: "Başarılı",
      back: "Geri",
      next: "İleri",
      submit: "Gönder",
      close: "Kapat",
      yes: "Evet",
      no: "Hayır",
      more: "Daha Fazla",
    },
    nav: {
      home: "Ana Sayfa",
      events: "Etkinlikler",
      groups: "Gruplar",
      people: "İnsanlar",
      messages: "Mesajlar",
      notifications: "Bildirimler",
      profile: "Profil",
      settings: "Ayarlar",
      login: "Giriş Yap",
      signup: "Kayıt Ol",
      logout: "Çıkış Yap",
    },
    sidebar: {
      menu: "Menü",
      home: "Anasayfa",
      meetups: "Buluşmalar",
      overview: "Genel Bakış",
      events: "Etkinlikler",
      groups: "Gruplar",
      realEstate: "Emlak İlanları",
      forRent: "Kiralık",
      forSale: "Satılık",
      roommate: "Ev Arkadaşı",
      jobs: "İş İlanları",
      lookingForJob: "İş Arıyorum",
      hiring: "İşçi Arıyorum",
      marketplace: "Alışveriş",
      news: "Haberler",
      legalGuide: "Yasal Rehber",
      profile: "Profil",
      settings: "Ayarlar",
      searchMenu: "Menüde ara...",
      quickFilters: "Hızlı Filtreler",
    },
    home: {
      hero: {
        badge: "Amerika'daki Türk Topluluğu",
        title: "Bağlan, Keşfet, Büyü",
        subtitle: "Amerika'da yaşayan Türklerle tanış, etkinliklere katıl, gruplar oluştur ve gerçek bağlantılar kur. Sosyal medya değil, gerçek topluluk.",
        cta1: "Etkinliklere Katıl",
        cta2: "Grupları Keşfet",
      },
      stats: {
        members: "Aktif Üye",
        events: "Etkinlik",
        cities: "Şehir",
        groups: "Grup",
      },
      features: {
        title: "Neler Yapabilirsin?",
        subtitle: "AmerikaLa ile Amerika'daki Türk topluluğuna katıl ve yeni fırsatlar keşfet",
        events: {
          title: "Etkinliklere Katıl",
          description: "Çevrende düzenlenen etkinlikleri keşfet, yeni insanlarla tanış ve unutulmaz anlar yaşa",
        },
        groups: {
          title: "Grup Oluştur",
          description: "İlgi alanlarına göre gruplar kur, topluluk oluştur ve yönet",
        },
        chat: {
          title: "Sohbet Et",
          description: "Özel mesajlar, grup sohbetleri ile bağlantıda kal",
        },
        realestate: {
          title: "Emlak İlanları",
          description: "Kiralık veya satılık ev ara, ilanını paylaş",
        },
        jobs: {
          title: "İş Fırsatları",
          description: "İş ara, ilan ver, kariyer fırsatlarını keşfet",
        },
        marketplace: {
          title: "Alışveriş",
          description: "İkinci el eşya al-sat, topluluğa özel fırsatlar",
        },
      },
      trending: {
        title: "Popüler Etkinlikler",
        subtitle: "Bu hafta en çok ilgi gören etkinlikler",
        viewAll: "Tümünü Gör",
      },
      testimonials: {
        title: "Topluluktan Sesler",
      },
      cta: {
        title: "Hemen Başla",
        subtitle: "Amerika'daki Türk topluluğuna katılmak için kaydol ve yeni bağlantılar kur",
        button: "Ücretsiz Kayıt Ol",
      },
    },
    events: {
      title: "Etkinlikler",
      subtitle: "Amerika genelinde düzenlenen Türk topluluk etkinliklerini keşfet",
      create: "Etkinlik Oluştur",
      search: "Etkinlik ara...",
      allCities: "Tüm Şehirler",
      categories: {
        all: "Tümü",
        social: "Sosyal",
        sports: "Spor",
        tech: "Teknoloji",
        culture: "Kültür",
        food: "Yemek",
      },
      attending: "Katılıyorsun",
      join: "Etkinliğe Katıl",
      free: "Ücretsiz",
      attendees: "kişi katılıyor",
      organizer: "Organize eden",
    },
    groups: {
      title: "Gruplar",
      subtitle: "İlgi alanlarına göre topluluklar bul, katıl veya kendi grubunu oluştur",
      create: "Grup Oluştur",
      search: "Grup ara...",
      all: "Tümü",
      public: "Açık",
      private: "Özel",
      members: "üye",
      posts: "gönderi",
      joined: "Üyesin",
      join: "Katıl",
    },
    profile: {
      edit: "Profili Düzenle",
      follow: "Takip Et",
      following: "Takip Ediliyor",
      message: "Mesaj",
      posts: "Gönderiler",
      events: "Etkinlikler",
      groups: "Gruplar",
      about: "Hakkında",
      joined: "Katıldı",
      badges: "Rozetler",
      stats: "İstatistikler",
      suggested: "Tanıyabilirsin",
    },
    messages: {
      title: "Mesajlar",
      search: "Mesajlarda ara...",
      online: "Çevrimiçi",
      offline: "Çevrimdışı",
      type: "Mesajınızı yazın...",
      send: "Gönder",
    },
  },
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      search: "Search",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      back: "Back",
      next: "Next",
      submit: "Submit",
      close: "Close",
      yes: "Yes",
      no: "No",
      more: "More",
    },
    nav: {
      home: "Home",
      events: "Events",
      groups: "Groups",
      people: "People",
      messages: "Messages",
      notifications: "Notifications",
      profile: "Profile",
      settings: "Settings",
      login: "Login",
      signup: "Sign Up",
      logout: "Logout",
    },
    sidebar: {
      menu: "Menu",
      home: "Home",
      meetups: "Meetups",
      overview: "Overview",
      events: "Events",
      groups: "Groups",
      realEstate: "Real Estate",
      forRent: "For Rent",
      forSale: "For Sale",
      roommate: "Roommate",
      jobs: "Job Listings",
      lookingForJob: "Looking for Job",
      hiring: "Hiring",
      marketplace: "Marketplace",
      news: "News",
      legalGuide: "Legal Guide",
      profile: "Profile",
      settings: "Settings",
      searchMenu: "Search menu...",
      quickFilters: "Quick Filters",
    },
    home: {
      hero: {
        badge: "Turkish Community in America",
        title: "Connect, Discover, Grow",
        subtitle: "Meet Turkish people living in the USA, join events, create groups, and build real connections. Real community, not just social media.",
        cta1: "Join Events",
        cta2: "Explore Groups",
      },
      stats: {
        members: "Active Members",
        events: "Events",
        cities: "Cities",
        groups: "Groups",
      },
      features: {
        title: "What Can You Do?",
        subtitle: "Join the Turkish community in America with AmerikaLa and discover new opportunities",
        events: {
          title: "Join Events",
          description: "Discover events around you, meet new people and create unforgettable moments",
        },
        groups: {
          title: "Create Groups",
          description: "Build groups based on interests, create and manage communities",
        },
        chat: {
          title: "Chat",
          description: "Stay connected with private messages and group chats",
        },
        realestate: {
          title: "Real Estate",
          description: "Find rentals or properties for sale, share your listings",
        },
        jobs: {
          title: "Job Opportunities",
          description: "Search jobs, post listings, explore career opportunities",
        },
        marketplace: {
          title: "Marketplace",
          description: "Buy and sell second-hand items, community-exclusive deals",
        },
      },
      trending: {
        title: "Trending Events",
        subtitle: "Most popular events this week",
        viewAll: "View All",
      },
      testimonials: {
        title: "Community Voices",
      },
      cta: {
        title: "Get Started",
        subtitle: "Sign up to join the Turkish community in America and make new connections",
        button: "Sign Up Free",
      },
    },
    events: {
      title: "Events",
      subtitle: "Discover Turkish community events across the United States",
      create: "Create Event",
      search: "Search events...",
      allCities: "All Cities",
      categories: {
        all: "All",
        social: "Social",
        sports: "Sports",
        tech: "Technology",
        culture: "Culture",
        food: "Food",
      },
      attending: "You're Attending",
      join: "Join Event",
      free: "Free",
      attendees: "people attending",
      organizer: "Organized by",
    },
    groups: {
      title: "Groups",
      subtitle: "Find communities based on interests, join or create your own group",
      create: "Create Group",
      search: "Search groups...",
      all: "All",
      public: "Public",
      private: "Private",
      members: "members",
      posts: "posts",
      joined: "Joined",
      join: "Join",
    },
    profile: {
      edit: "Edit Profile",
      follow: "Follow",
      following: "Following",
      message: "Message",
      posts: "Posts",
      events: "Events",
      groups: "Groups",
      about: "About",
      joined: "Joined",
      badges: "Badges",
      stats: "Statistics",
      suggested: "You May Know",
    },
    messages: {
      title: "Messages",
      search: "Search messages...",
      online: "Online",
      offline: "Offline",
      type: "Type your message...",
      send: "Send",
    },
  },
};
