"use client";

import { useLanguage } from "../contexts/LanguageContext";
import { Globe } from "lucide-react";

export default function FloatingLanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "tr" ? "en" : "tr");
  };

  return (
    <button
      onClick={toggleLanguage}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-2xl hover:scale-110 transition-smooth flex items-center justify-center group"
      title={language === "tr" ? "Switch to English" : "Türkçe'ye Geç"}
    >
      <div className="relative">
        <Globe size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-white text-blue-600 rounded-full h-5 w-5 flex items-center justify-center shadow-md">
          {language.toUpperCase()}
        </span>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {language === "tr" ? "Switch to English" : "Türkçe'ye Geç"}
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900 dark:border-t-white"></div>
      </div>
    </button>
  );
}
