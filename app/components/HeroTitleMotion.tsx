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
      className={`w-fit bg-[linear-gradient(110deg,#B9444D_0%,#1A1921_52%,#162C4F_100%)] bg-[length:200%_200%] bg-clip-text pb-2 text-[clamp(2.625rem,10vw,5.75rem)] font-semibold uppercase leading-[0.95] tracking-tight text-transparent transition-all duration-[800ms] [animation:heroGradientShift_8s_linear_infinite] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
      style={{ WebkitTextFillColor: "transparent" }}
    >
      AMERIKALA
    </h1>
  );
}
