"use client";

import { useLanguage } from "../contexts/LanguageContext";
import { Globe } from "lucide-react";
import { Button } from "./ui/Button";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "tr" ? "en" : "tr");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="relative"
      title={language === "tr" ? "Switch to English" : "Türkçe'ye Geç"}
    >
      <Globe size={20} />
      <span className="absolute -bottom-0.5 -right-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full h-4 w-4 flex items-center justify-center">
        {language.toUpperCase()}
      </span>
    </Button>
  );
}
