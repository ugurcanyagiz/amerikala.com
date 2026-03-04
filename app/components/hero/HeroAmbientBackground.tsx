"use client";

import { type CSSProperties, useEffect, useRef } from "react";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function HeroAmbientBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    const pointer = { x: 0.5, y: 0.45 };
    const smooth = { x: 0.5, y: 0.45 };

    let frameId = 0;
    let useMotion = !reduceMotion.matches;
    let canParallax = finePointer.matches;

    const render = () => {
      smooth.x += (pointer.x - smooth.x) * 0.055;
      smooth.y += (pointer.y - smooth.y) * 0.055;

      const offsetX = (smooth.x - 0.5) * 32;
      const offsetY = (smooth.y - 0.5) * 26;

      container.style.setProperty("--hero-parallax-x", `${offsetX.toFixed(2)}px`);
      container.style.setProperty("--hero-parallax-y", `${offsetY.toFixed(2)}px`);

      if (useMotion) frameId = window.requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!canParallax || !useMotion) return;
      const rect = container.getBoundingClientRect();
      pointer.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      pointer.y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    };

    const onPointerLeave = () => {
      pointer.x = 0.5;
      pointer.y = 0.45;
    };

    const onMotionChange = () => {
      useMotion = !reduceMotion.matches;
      window.cancelAnimationFrame(frameId);

      if (!useMotion) {
        container.style.setProperty("--hero-parallax-x", "0px");
        container.style.setProperty("--hero-parallax-y", "0px");
        return;
      }

      render();
    };

    const onFinePointerChange = () => {
      canParallax = finePointer.matches;
      onPointerLeave();
    };

    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave, { passive: true });
    reduceMotion.addEventListener("change", onMotionChange);
    finePointer.addEventListener("change", onFinePointerChange);

    if (useMotion) {
      render();
    } else {
      container.style.setProperty("--hero-parallax-x", "0px");
      container.style.setProperty("--hero-parallax-y", "0px");
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      reduceMotion.removeEventListener("change", onMotionChange);
      finePointer.removeEventListener("change", onFinePointerChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={
        {
          // Shared CSS vars for slow parallax across layers.
          "--hero-parallax-x": "0px",
          "--hero-parallax-y": "0px",
          "--hero-ambient-red": "var(--color-primary, #A34B52)",
          "--hero-ambient-navy": "var(--color-navy, #1B304A)",
          "--hero-ambient-base": "var(--color-surface-sunken, #EEF2F7)",
        } as CSSProperties
      }
    >
      {/* Base wash + very large moving glows sit behind card (z-0) for calm atmosphere. */}
      <div className="absolute inset-0 z-0 hero-ambient-base hero-ambient-motion" />

      {/* Grain/dot texture keeps gradients from feeling flat while staying subtle. */}
      <div className="absolute inset-0 z-10 opacity-[0.06] hero-ambient-noise" />

      {/* Soft vignette + under-card fade increase depth/readability without hard edges. */}
      <div className="absolute inset-0 z-20 hero-ambient-vignette" />
      <div className="absolute inset-0 z-30 hero-under-card-fade" />
    </div>
  );
}
