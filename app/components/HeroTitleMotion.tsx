"use client";

import { useEffect, useState } from "react";

export default function HeroTitleMotion() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <h1
      className={`hero-title-flag-gradient mx-auto w-fit bg-clip-text pb-2 text-[clamp(2.625rem,10vw,5.75rem)] font-semibold uppercase leading-[0.95] tracking-tight text-transparent transition-all duration-[800ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
      style={{ WebkitTextFillColor: "transparent" }}
    >
      AMERIKALA
    </h1>
  );
}
