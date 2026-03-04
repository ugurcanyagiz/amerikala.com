"use client";

import { type CSSProperties } from "react";
import usePointerParallax from "./usePointerParallax";

export default function HeroAmbientVisual() {
  const visualRef = usePointerParallax<HTMLDivElement>({ maxOffset: 10, easing: 0.07 });

  return (
    <div
      ref={visualRef}
      aria-hidden="true"
      className="hero-card-ambient pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={
        {
          "--hero-ambient-parallax-x": "0px",
          "--hero-ambient-parallax-y": "0px",
        } as CSSProperties
      }
    >
      <div className="hero-card-ambient__fx">
        <div className="hero-card-ambient__zone hero-card-ambient__zone--left" />
        <div className="hero-card-ambient__zone hero-card-ambient__zone--right" />
        <div className="hero-card-ambient__center-wash" />
        <div className="hero-card-ambient__noise" />
        <div className="hero-card-ambient__vignette" />
      </div>
    </div>
  );
}
