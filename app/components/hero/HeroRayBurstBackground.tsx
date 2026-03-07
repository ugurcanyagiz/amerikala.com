"use client";

import { useEffect, useRef } from "react";

type Ray = {
  baseAngle: number;
  baseLen: number;
  thickness: number;
  phase: number;
  seed: number;
  tipDot: number;
  colorMix: number;
  segments: number;
};

type RGB = { r: number; g: number; b: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const angleDiff = (a: number, b: number) => {
  const wrapped = Math.atan2(Math.sin(a - b), Math.cos(a - b));
  return Math.abs(wrapped);
};

const parseRgbString = (color: string): RGB | null => {
  const rgbMatch = color.match(/rgba?\(([^)]+)\)/i);
  if (!rgbMatch) return null;
  const [r, g, b] = rgbMatch[1].split(",").map((v) => Number.parseFloat(v.trim()));
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
};

const parseHex = (value: string): RGB | null => {
  const hex = value.trim().replace("#", "");
  if (![3, 6].includes(hex.length)) return null;
  const full = hex.length === 3 ? hex.split("").map((ch) => ch + ch).join("") : hex;
  const parsed = Number.parseInt(full, 16);
  if (Number.isNaN(parsed)) return null;
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
};

const readColorVar = (styles: CSSStyleDeclaration, variableName: string, fallbackHex: string): RGB => {
  const raw = styles.getPropertyValue(variableName).trim();
  if (raw) {
    const fromRgb = parseRgbString(raw);
    if (fromRgb) return fromRgb;
    const fromHex = parseHex(raw);
    if (fromHex) return fromHex;
  }
  return parseHex(fallbackHex) ?? { r: 0, g: 0, b: 0 };
};

const mixRgb = (a: RGB, b: RGB, t: number): RGB => ({
  r: Math.round(lerp(a.r, b.r, t)),
  g: Math.round(lerp(a.g, b.g, t)),
  b: Math.round(lerp(a.b, b.b, t)),
});

export default function HeroRayBurstBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const mediaReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mediaFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    const pointer = { x: 0.5, y: 0.8 };
    const smoothPointer = { x: 0.5, y: 0.8 };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let lastNow = 0;
    let prefersReduced = mediaReduce.matches;
    let useFinePointer = mediaFinePointer.matches;
    let rays: Ray[] = [];

    let palettePrimary: RGB = { r: 196, g: 55, b: 55 };
    let paletteNavy: RGB = { r: 30, g: 42, b: 56 };
    let palettePurple: RGB = { r: 104, g: 63, b: 134 };

    const chooseSegments = (isMobile: boolean) => {
      if (isMobile) return 20 + Math.floor(Math.random() * 7); // 20-26 mobile
      return 28 + Math.floor(Math.random() * 9); // 28-36 desktop
    };

    const buildRays = () => {
      const isMobile = width < 768;
      const count = isMobile
        ? clamp(Math.round(width / 4.8), 90, 130)
        : clamp(Math.round(width / 5.2), 160, 220);

      rays = Array.from({ length: count }, (_, index) => {
        const ratio = count <= 1 ? 0.5 : index / (count - 1);
        return {
          baseAngle: -Math.PI / 2 + (ratio - 0.5) * (isMobile ? 1.7 : 1.95) + (Math.random() - 0.5) * 0.035,
          baseLen: height * (isMobile ? 0.34 + Math.random() * 0.28 : 0.4 + Math.random() * 0.34),
          thickness: isMobile ? 0.45 + Math.random() * 0.7 : 0.4 + Math.random() * 1.0,
          phase: Math.random() * Math.PI * 2,
          seed: Math.random() * 1000,
          tipDot: isMobile ? 0.45 + Math.random() * 0.8 : 0.55 + Math.random() * 1.05,
          colorMix: clamp(ratio + (Math.random() - 0.5) * 0.22, 0, 1),
          segments: chooseSegments(isMobile),
        };
      });
    };

    const refreshPalette = () => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      // Bind directly to existing brand tokens in globals.css (primary + navy) and derive a bridge purple.
      palettePrimary = readColorVar(rootStyles, "--color-primary", "#C43737");
      paletteNavy = readColorVar(rootStyles, "--color-navy", "#1E2A38");
      palettePurple = mixRgb(palettePrimary, paletteNavy, 0.5);
    };

    const resize = () => {
      const bounds = container.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2); // clamp DPR for perf

      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildRays();
    };

    const draw = (now: number) => {
      const dt = clamp((now - lastNow) / 1000, 0, 0.12);
      lastNow = now;

      smoothPointer.x += (pointer.x - smoothPointer.x) * clamp(dt * 9.5, 0.04, 0.2);
      smoothPointer.y += (pointer.y - smoothPointer.y) * clamp(dt * 9.5, 0.04, 0.2);

      context.clearRect(0, 0, width, height);

      // Hero card is centered and symmetric, so keep the origin at exact bottom-center.
      const originX = width * 0.5;
      const originY = height * 0.92;

      const mouseX = smoothPointer.x * width;
      const mouseY = smoothPointer.y * height;
      const mouseAngle = Math.atan2(mouseY - originY, mouseX - originX);

      for (const ray of rays) {
        const diff = angleDiff(ray.baseAngle, mouseAngle);
        const sigma = 0.34;
        const influence = Math.exp(-(diff * diff) / (2 * sigma * sigma));

        const colorA = mixRgb(palettePrimary, palettePurple, ray.colorMix);
        const colorB = mixRgb(palettePurple, paletteNavy, ray.colorMix);
        const baseDrift = prefersReduced ? 0 : Math.sin(now * 0.00055 + ray.phase + ray.seed * 0.001) * 0.038;
        const reactiveAngle = useFinePointer ? (mouseAngle - ray.baseAngle) * influence * 0.17 : 0;
        const rayAngle = ray.baseAngle + baseDrift + reactiveAngle;

        const glowLenLift = useFinePointer ? influence * 0.075 : 0;
        const rayLength = ray.baseLen * (1 + glowLenLift);

        let previousX = originX;
        let previousY = originY;

        for (let seg = 1; seg <= ray.segments; seg += 1) {
          const t = seg / ray.segments;
          const strength = Math.pow(t, 1.82);
          const travel = rayLength * t;

          const wobble = prefersReduced
            ? 0
            : (Math.sin(now * 0.0012 + ray.phase + t * 10 + ray.seed * 0.03) * 0.45 +
                Math.cos(now * 0.0008 + ray.seed * 0.017 + t * 8) * 0.28);

          const localDeform = useFinePointer
            ? influence * strength * (Math.sin(mouseAngle - ray.baseAngle) * 16 + wobble * 1.6)
            : wobble * strength * 0.55;

          const normalX = -Math.sin(rayAngle);
          const normalY = Math.cos(rayAngle);
          const x = originX + Math.cos(rayAngle) * travel + normalX * localDeform;
          const y = originY + Math.sin(rayAngle) * travel + normalY * localDeform;

          const alpha = 0.05 + strength * 0.5 + influence * 0.12;
          context.strokeStyle = `rgba(${Math.round(lerp(colorA.r, colorB.r, t))}, ${Math.round(
            lerp(colorA.g, colorB.g, t),
          )}, ${Math.round(lerp(colorA.b, colorB.b, t))}, ${clamp(alpha, 0.05, 0.7).toFixed(3)})`;
          context.lineWidth = ray.thickness * (0.95 + t * 0.55);
          context.lineCap = "round";
          context.beginPath();
          context.moveTo(previousX, previousY);
          context.lineTo(x, y);
          context.stroke();

          previousX = x;
          previousY = y;
        }

        const tipGlow = context.createRadialGradient(previousX, previousY, 0, previousX, previousY, ray.tipDot * 7.5);
        tipGlow.addColorStop(0, `rgba(${colorB.r}, ${colorB.g}, ${colorB.b}, 0.9)`);
        tipGlow.addColorStop(0.45, `rgba(${palettePurple.r}, ${palettePurple.g}, ${palettePurple.b}, 0.34)`);
        tipGlow.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = tipGlow;
        context.beginPath();
        context.arc(previousX, previousY, ray.tipDot * 7.5, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = `rgba(${Math.round((colorB.r + palettePurple.r) / 2)}, ${Math.round((colorB.g + palettePurple.g) / 2)}, ${Math.round(
          (colorB.b + palettePurple.b) / 2,
        )}, ${clamp(0.54 + influence * 0.26, 0.45, 0.88)})`;
        context.beginPath();
        context.arc(previousX, previousY, ray.tipDot * 0.95, 0, Math.PI * 2);
        context.fill();
      }

      if (!prefersReduced) {
        frameId = window.requestAnimationFrame(draw);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!useFinePointer || prefersReduced) return;
      const rect = container.getBoundingClientRect();
      pointer.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      pointer.y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    };

    const onPointerLeave = () => {
      pointer.x = 0.5;
      pointer.y = 0.8;
    };

    const onMotionChange = () => {
      prefersReduced = mediaReduce.matches;
      window.cancelAnimationFrame(frameId);
      lastNow = performance.now();
      draw(lastNow); // static single frame when reduced motion is enabled
    };

    const onFinePointerChange = () => {
      useFinePointer = mediaFinePointer.matches;
      onPointerLeave();
    };

    const onResize = () => {
      resize();
      lastNow = performance.now();
      draw(lastNow);
    };

    refreshPalette();
    resize();
    lastNow = performance.now();
    draw(lastNow);

    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("resize", onResize);
    mediaReduce.addEventListener("change", onMotionChange);
    mediaFinePointer.addEventListener("change", onFinePointerChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      mediaReduce.removeEventListener("change", onMotionChange);
      mediaFinePointer.removeEventListener("change", onFinePointerChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.92) 24%, rgba(0,0,0,1) 64%, rgba(0,0,0,0.82) 84%, rgba(0,0,0,0.42) 94%, transparent 100%), linear-gradient(to right, transparent 0%, rgba(0,0,0,0.88) 7%, rgba(0,0,0,1) 22%, rgba(0,0,0,1) 78%, rgba(0,0,0,0.9) 93%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.92) 24%, rgba(0,0,0,1) 64%, rgba(0,0,0,0.82) 84%, rgba(0,0,0,0.42) 94%, transparent 100%), linear-gradient(to right, transparent 0%, rgba(0,0,0,0.88) 7%, rgba(0,0,0,1) 22%, rgba(0,0,0,1) 78%, rgba(0,0,0,0.9) 93%, transparent 100%)",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 86% at 50% 45%, rgba(0,0,0,0) 46%, rgba(7,14,28,0.12) 78%, rgba(7,14,28,0.22) 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 4px)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(145% 100% at 50% 56%, rgba(255,255,255,0) 50%, rgba(10,18,32,0.12) 84%, rgba(8,14,28,0.2) 100%)",
        }}
      />
    </div>
  );
}
