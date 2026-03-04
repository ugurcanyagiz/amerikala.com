"use client";

import { useEffect, useRef } from "react";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

type UsePointerParallaxOptions = {
  maxOffset?: number;
  easing?: number;
};

export default function usePointerParallax<T extends HTMLElement>({
  maxOffset = 12,
  easing = 0.08,
}: UsePointerParallaxOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerMedia = window.matchMedia("(hover: hover) and (pointer: fine)");

    const pointer = { x: 0.5, y: 0.5 };
    const smooth = { x: 0.5, y: 0.5 };

    let frameId = 0;
    let canAnimate = !reducedMotionMedia.matches;
    let canParallax = finePointerMedia.matches;

    const setVars = (x: number, y: number) => {
      element.style.setProperty("--hero-ambient-parallax-x", `${x.toFixed(2)}px`);
      element.style.setProperty("--hero-ambient-parallax-y", `${y.toFixed(2)}px`);
    };

    const render = () => {
      smooth.x += (pointer.x - smooth.x) * easing;
      smooth.y += (pointer.y - smooth.y) * easing;

      const x = (smooth.x - 0.5) * maxOffset * 2;
      const y = (smooth.y - 0.5) * maxOffset * 2;
      setVars(x, y);

      if (canAnimate) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!canParallax || !canAnimate) return;

      const rect = element.getBoundingClientRect();
      pointer.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      pointer.y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    };

    const resetPointer = () => {
      pointer.x = 0.5;
      pointer.y = 0.5;
    };

    const onMotionChange = () => {
      canAnimate = !reducedMotionMedia.matches;
      window.cancelAnimationFrame(frameId);

      if (!canAnimate) {
        setVars(0, 0);
        return;
      }

      render();
    };

    const onFinePointerChange = () => {
      canParallax = finePointerMedia.matches;
      resetPointer();
    };

    element.addEventListener("pointermove", onPointerMove, { passive: true });
    element.addEventListener("pointerleave", resetPointer, { passive: true });
    reducedMotionMedia.addEventListener("change", onMotionChange);
    finePointerMedia.addEventListener("change", onFinePointerChange);

    if (canAnimate) {
      render();
    } else {
      setVars(0, 0);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerleave", resetPointer);
      reducedMotionMedia.removeEventListener("change", onMotionChange);
      finePointerMedia.removeEventListener("change", onFinePointerChange);
    };
  }, [easing, maxOffset]);

  return ref;
}
