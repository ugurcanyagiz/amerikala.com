"use client";

import { useEffect, useMemo, useState } from "react";

const HERO_BACKGROUND_IMAGES = ["/public/1bg.png", "/public/2bg.png", "/public/3bg.png", "/public/4bg.png"];
const AUTO_ADVANCE_MS = 6_000;

const toPublicUrl = (path: string) => (path.startsWith("/public/") ? path.replace("/public", "") : path);

export default function HeroBackgroundCarousel() {
  const images = useMemo(() => HERO_BACKGROUND_IMAGES.map(toPublicUrl), []);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(interval);
  }, [images]);

  useEffect(() => {
    images.forEach((src) => {
      const preload = new window.Image();
      preload.src = src;
    });
  }, [images]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[24px]">
      {images.map((src, index) => {
        const isActive = index === activeIndex;

        return (
          <div
            key={src}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[1400ms] ease-in-out ${isActive ? "opacity-100" : "opacity-0"}`}
            style={{
              backgroundImage: `url(${src})`,
              filter: "brightness(0.8) saturate(0.9)",
            }}
          >
            <div className="absolute inset-0 blur-[6px] md:blur-[10px]" />
          </div>
        );
      })}

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.35), rgba(255,255,255,0.65))",
        }}
      />
    </div>
  );
}
