"use client";

import { useEffect, useRef } from "react";

type Ray = {
  angle: number;
  length: number;
  width: number;
  speed: number;
  phase: number;
  tipRadius: number;
  colorMix: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function HeroBurstBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    let lastNow = 0;

    let prefersReducedMotion = reduceMotionQuery.matches;
    let canUsePointerParallax = finePointerQuery.matches;

    const pointer = { x: 0.5, y: 0.3 };
    const smoothPointer = { x: 0.5, y: 0.3 };
    let rays: Ray[] = [];

    const createRays = (count: number) => {
      rays = Array.from({ length: count }, (_, index) => {
        const ratio = count <= 1 ? 0.5 : index / (count - 1);
        return {
          angle: -Math.PI / 2 + (ratio - 0.5) * 1.9 + (Math.random() - 0.5) * 0.07,
          length: height * (0.42 + Math.random() * 0.36),
          width: 0.65 + Math.random() * 1.55,
          speed: 0.28 + Math.random() * 0.62,
          phase: Math.random() * Math.PI * 2,
          tipRadius: 0.8 + Math.random() * 1.8,
          colorMix: clamp(ratio + (Math.random() - 0.5) * 0.16, 0, 1),
        };
      });
    };

    const getRayCount = () => {
      if (width < 480) return 34;
      if (width < 768) return 44;
      return 66;
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createRays(getRayCount());
    };

    const drawFrame = (now: number) => {
      const elapsed = (now - lastNow) / 1000;
      lastNow = now;

      if (canUsePointerParallax && !prefersReducedMotion) {
        const smoothing = clamp(elapsed * 8.5, 0, 1);
        smoothPointer.x += (pointer.x - smoothPointer.x) * smoothing;
        smoothPointer.y += (pointer.y - smoothPointer.y) * smoothing;
      } else {
        smoothPointer.x += (0.5 - smoothPointer.x) * 0.08;
        smoothPointer.y += (0.3 - smoothPointer.y) * 0.08;
      }

      const t = prefersReducedMotion ? 0 : now * 0.001;
      const swayX = (smoothPointer.x - 0.5) * 18;
      const swayY = (smoothPointer.y - 0.35) * 10;

      ctx.clearRect(0, 0, width, height);

      const originX = width * 0.5 + swayX * 0.16;
      const originY = height * 1.05;

      for (const ray of rays) {
        const localSway = prefersReducedMotion ? 0 : Math.sin(t * ray.speed + ray.phase) * 0.045;
        const cursorPull = canUsePointerParallax ? (smoothPointer.x - 0.5) * 0.12 : 0;
        const angle = ray.angle + localSway + cursorPull;

        const tipX = originX + Math.cos(angle) * ray.length + swayX * 0.18;
        const tipY = originY + Math.sin(angle) * ray.length + swayY * 0.3;

        const gradient = ctx.createLinearGradient(originX, originY, tipX, tipY);
        const mix = ray.colorMix;

        const startRed = Math.round(120 + 92 * (1 - mix));
        const startGreen = Math.round(44 + 26 * mix);
        const startBlue = Math.round(95 + 110 * mix);

        gradient.addColorStop(0, `rgba(${startRed}, ${startGreen}, ${startBlue}, 0)`);
        gradient.addColorStop(0.25, `rgba(${startRed}, ${startGreen}, ${startBlue}, 0.22)`);
        gradient.addColorStop(1, `rgba(${startRed + 20}, ${startGreen + 18}, ${startBlue + 8}, 0.62)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = ray.width;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        const glow = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, ray.tipRadius * 7.5);
        glow.addColorStop(0, `rgba(${startRed + 22}, ${startGreen + 25}, ${startBlue + 12}, 0.88)`);
        glow.addColorStop(0.45, `rgba(${startRed + 12}, ${startGreen + 12}, ${startBlue + 10}, 0.34)`);
        glow.addColorStop(1, "rgba(255,255,255,0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tipX, tipY, ray.tipRadius * 7.5, 0, Math.PI * 2);
        ctx.fill();
      }

      const spotX = width * smoothPointer.x;
      const spotY = height * smoothPointer.y;
      const spotlight = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, width * 0.42);
      spotlight.addColorStop(0, "rgba(255,255,255,0.16)");
      spotlight.addColorStop(0.45, "rgba(186,146,255,0.07)");
      spotlight.addColorStop(1, "rgba(255,255,255,0)");

      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, width, height);

      if (!prefersReducedMotion) {
        animationFrame = window.requestAnimationFrame(drawFrame);
      }
    };

    const updatePointerFromEvent = (event: PointerEvent | MouseEvent) => {
      if (!canUsePointerParallax || prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      pointer.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      pointer.y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    };

    const onMotionChange = () => {
      prefersReducedMotion = reduceMotionQuery.matches;
      window.cancelAnimationFrame(animationFrame);
      lastNow = performance.now();
      if (prefersReducedMotion) {
        drawFrame(lastNow);
      } else {
        animationFrame = window.requestAnimationFrame(drawFrame);
      }
    };

    const onPointerModeChange = () => {
      canUsePointerParallax = finePointerQuery.matches;
      pointer.x = 0.5;
      pointer.y = 0.3;
    };

    const onResize = () => {
      resize();
      drawFrame(performance.now());
    };

    resize();
    lastNow = performance.now();
    drawFrame(lastNow);
    if (!prefersReducedMotion) {
      animationFrame = window.requestAnimationFrame(drawFrame);
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", updatePointerFromEvent, { passive: true });
    reduceMotionQuery.addEventListener("change", onMotionChange);
    finePointerQuery.addEventListener("change", onPointerModeChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", updatePointerFromEvent);
      reduceMotionQuery.removeEventListener("change", onMotionChange);
      finePointerQuery.removeEventListener("change", onPointerModeChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        WebkitMaskImage:
          "radial-gradient(124% 112% at 50% 98%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.94) 42%, rgba(0,0,0,0.72) 70%, rgba(0,0,0,0.35) 86%, rgba(0,0,0,0) 100%), linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 62%, rgba(0,0,0,0.15) 100%)",
        maskImage:
          "radial-gradient(124% 112% at 50% 98%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.94) 42%, rgba(0,0,0,0.72) 70%, rgba(0,0,0,0.35) 86%, rgba(0,0,0,0) 100%), linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 62%, rgba(0,0,0,0.15) 100%)",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 82% at 14% 8%, rgba(182,59,74,0.16) 0%, rgba(182,59,74,0) 62%), radial-gradient(92% 80% at 88% 92%, rgba(29,52,102,0.22) 0%, rgba(29,52,102,0) 68%), radial-gradient(130% 92% at 50% 52%, rgba(88,52,126,0.1) 0%, rgba(88,52,126,0) 68%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-soft-light"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.5) 0.5px, transparent 1px), radial-gradient(circle at 78% 72%, rgba(255,255,255,0.42) 0.5px, transparent 1px)",
          backgroundSize: "3px 3px, 4px 4px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 54%, rgba(8,12,21,0) 44%, rgba(8,12,21,0.18) 78%, rgba(8,12,21,0.3) 100%)",
        }}
      />
    </div>
  );
}
