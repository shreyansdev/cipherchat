import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type CSSProperties,
} from "react";

export type NeuformMode = "dark" | "light";
export type NeuformModePreference = NeuformMode | "auto";

export interface ParticleDriftProps {
  mode?: NeuformModePreference;
  speed?: number;
  size?: number;
  gap?: number;
  length?: number;
  density?: number;
  strokeWidth?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
  style?: CSSProperties;
}

const PARTICLE_DRIFT_DEFAULTS = {
  mode: "dark" as NeuformMode,
  speed: 1,
  size: 1,
  gap: 2,
  length: 1,
  density: 1,
  strokeWidth: 1,
  opacity: 1,
  hue: 0,
  saturation: 1,
  brightness: 1,
} as const;

const LIGHT_PAPER = "#eef1f6";
const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*()".split("");

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function scaleCount(base: number, density: number, minimum = 1) {
  return Math.max(minimum, Math.round(base * density));
}

function resolveMode(
  mode: NeuformMode | number | string | undefined,
  fallback: NeuformMode = "dark",
): NeuformMode {
  if (mode === undefined || mode === null) return fallback;
  if (mode === "light" || mode === 1 || mode === "1") return "light";
  return "dark";
}

function readAutomaticMode(): NeuformMode {
  if (typeof document === "undefined" || typeof window === "undefined")
    return "dark";
  const root = document.documentElement;
  const declared = root?.dataset?.scheme ?? root?.dataset?.theme;
  if (declared === "light" || declared === "dark") return declared;
  if (typeof window.matchMedia !== "function") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

function useAutomaticMode(enabled: boolean): NeuformMode {
  const [mode, setMode] = useState<NeuformMode>(readAutomaticMode);

  useEffect(() => {
    if (
      !enabled ||
      typeof document === "undefined" ||
      typeof window === "undefined"
    )
      return undefined;
    const root = document.documentElement;
    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;
    const update = () => setMode(readAutomaticMode());
    const observer =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(update)
        : null;
    if (observer && root) {
      observer.observe(root, {
        attributes: true,
        attributeFilter: ["data-scheme", "data-theme"],
      });
    }
    media?.addEventListener?.("change", update);
    update();
    return () => {
      observer?.disconnect();
      media?.removeEventListener?.("change", update);
    };
  }, [enabled]);

  return mode;
}

interface NodeParticle {
  x: number;
  y: number;
  vy: number;
  char: string;
}

interface BeamParticle {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

export default function ParticleDrift({
  mode,
  speed = PARTICLE_DRIFT_DEFAULTS.speed,
  size = PARTICLE_DRIFT_DEFAULTS.size,
  gap = PARTICLE_DRIFT_DEFAULTS.gap,
  length = PARTICLE_DRIFT_DEFAULTS.length,
  density = PARTICLE_DRIFT_DEFAULTS.density,
  strokeWidth = PARTICLE_DRIFT_DEFAULTS.strokeWidth,
  opacity = PARTICLE_DRIFT_DEFAULTS.opacity,
  hue = PARTICLE_DRIFT_DEFAULTS.hue,
  saturation = PARTICLE_DRIFT_DEFAULTS.saturation,
  brightness = PARTICLE_DRIFT_DEFAULTS.brightness,
  className,
  style,
}: ParticleDriftProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const requestedMode = mode ?? PARTICLE_DRIFT_DEFAULTS.mode;
  const automaticMode = useAutomaticMode(requestedMode === "auto");
  const resolvedMode =
    requestedMode === "auto"
      ? automaticMode
      : resolveMode(requestedMode, PARTICLE_DRIFT_DEFAULTS.mode);

  const background = resolvedMode === "light" ? LIGHT_PAPER : "#030509";
  const safeSpeed = clamp(speed, 0, 3);
  const safeSize = clamp(size, 0.05, 200);
  const safeGap = clamp(gap, 0, 64);
  const safeLength = clamp(length, 0.35, 2.5);
  const safeDensity = clamp(density, 0.25, 2.5);
  const safeStrokeWidth = clamp(strokeWidth, 0.25, 8);
  const safeOpacity = clamp(opacity, 0.05, 1);
  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);

  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });

  // Track global mouse position relative to canvas
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let nodes: NodeParticle[] = [];
    let beams: BeamParticle[] = [];

    const initParticles = (w: number, h: number) => {
      const nodeCount = scaleCount(90, safeDensity, 12);
      const beamCount = scaleCount(25, safeDensity, 4);

      nodes = Array.from({ length: nodeCount }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: (Math.random() * 0.4) + 0.1,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
      }));

      beams = Array.from({ length: beamCount }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        length: (Math.random() * 100 + 50) * safeLength,
        speed: (Math.random() * 6) + 3,
        opacity: Math.random() * 0.5 + 0.3,
      }));
    };

    const resize = () => {
      const container = containerRef.current || canvas.parentElement;
      const clientW = container ? container.clientWidth : window.innerWidth;
      const clientH = container ? container.clientHeight : window.innerHeight;

      if (clientW === 0 || clientH === 0) return;

      const dpr = window.devicePixelRatio || 1;
      width = clientW;
      height = clientH;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      initParticles(width, height);
    };

    resize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        resize();
      });
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener("resize", resize);

    const linkDistance = Math.round(120 * safeLength);
    const proximityAlpha = (resolvedMode === "light" ? 0.22 : 0.15) * safeOpacity;
    const beamLineWidth = 1.5 * safeStrokeWidth * safeSize;
    const proximityLineWidth = 0.5 * safeStrokeWidth;
    const fontSize = Math.max(9, Math.round(12 * safeSize));

    const draw = () => {
      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Upward Beams
      ctx.lineWidth = beamLineWidth;
      for (let i = 0; i < beams.length; i++) {
        const b = beams[i];
        b.y -= b.speed * safeSpeed;
        if (b.y + b.length < 0) {
          b.y = height + 100;
          b.x = Math.random() * width;
        }

        const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.length);
        const beamAlpha = b.opacity * safeOpacity;
        if (resolvedMode === "light") {
          g.addColorStop(0, `rgba(37, 99, 235, ${beamAlpha})`);
        } else {
          g.addColorStop(0, `rgba(96, 165, 250, ${beamAlpha})`);
        }
        g.addColorStop(1, "transparent");

        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x, b.y + b.length);
        ctx.stroke();
      }

      // 2. Proximity lines between nodes
      ctx.lineWidth = proximityLineWidth;
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const d = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          if (d < linkDistance) {
            const alpha = proximityAlpha * (1 - d / linkDistance);
            if (resolvedMode === "light") {
              ctx.strokeStyle = `rgba(36, 48, 68, ${alpha})`;
            } else {
              ctx.strokeStyle = `rgba(156, 163, 175, ${alpha})`;
            }
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // 3. Interactive Nodes & Mouse Connections
      const mouse = mouseRef.current;
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.y += n.vy * safeSpeed;
        if (n.y > height + 20) {
          n.y = -20;
          n.x = Math.random() * width;
        }

        const dist = Math.hypot(mouse.x - n.x, mouse.y - n.y);

        // Dynamic character swap
        if (dist < 180 || Math.random() > 0.98) {
          n.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        }

        // Connection line to mouse
        if (dist < 180) {
          const mouseAlpha = 0.5 * (1 - dist / 180) * safeOpacity;
          if (resolvedMode === "light") {
            ctx.strokeStyle = `rgba(37, 99, 235, ${mouseAlpha})`;
          } else {
            ctx.strokeStyle = `rgba(96, 165, 250, ${mouseAlpha})`;
          }
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        // Draw character
        if (dist < 180) {
          ctx.fillStyle = resolvedMode === "light" ? "#2563EB" : "#60A5FA";
        } else {
          if (resolvedMode === "light") {
            ctx.fillStyle = `rgba(36, 48, 68, ${0.55 * safeOpacity})`;
          } else {
            ctx.fillStyle = `rgba(156, 163, 175, ${0.4 * safeOpacity})`;
          }
        }
        ctx.fillText(n.char, n.x, n.y);
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      resizeObserver?.disconnect();
    };
  }, [
    resolvedMode,
    safeDensity,
    safeGap,
    safeLength,
    safeOpacity,
    safeSize,
    safeSpeed,
    safeStrokeWidth,
  ]);

  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className || ""}`}
      style={{
        background,
        filter,
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        id="particle-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />
      {/* Subtle matte noise texture overlay matching cyber theme */}
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none z-10"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')",
        }}
      />
    </div>
  );
}
