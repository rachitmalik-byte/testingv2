import { useEffect, useRef } from 'react';

// Adaptive quality tiers based on device capability
const isTouchDevice =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const isLowEnd =
  typeof navigator !== 'undefined' &&
  (navigator.hardwareConcurrency ?? 4) <= 2;

// Particle count: 80 desktop → 40 tablet → 20 mobile/low-end
const NUM_PARTICLES = isLowEnd ? 20 : isTouchDevice ? 40 : 80;

class Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  baseX: number; baseY: number;

  constructor(width: number, height: number) {
    this.x = this.baseX = Math.random() * width;
    this.y = this.baseY = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.size = Math.random() * 1.5 + 0.5;
  }

  update(width: number, height: number, hx: number, hy: number) {
    this.x += this.vx;
    this.y += this.vy;

    // Wrap at edges
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;

    // Repel from mouse
    const dx = this.x - hx;
    const dy = this.y - hy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 80;
    if (dist < radius && dist > 0) {
      const force = (1 - dist / radius) * 2;
      this.x += (dx / dist) * force;
      this.y += (dy / dist) * force;
    }
  }

  draw(ctx: CanvasRenderingContext2D, isDark: boolean) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(251,146,60,0.6)' : 'rgba(234,88,12,0.5)';
    ctx.fill();
  }
}

export function InteractivePixels() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let rafId: number;

    // Mouse: throttled via rAF (no per-pixel updates)
    const mouse = { x: -1000, y: -1000 };
    let pendingMX = -1000, pendingMY = -1000, mouseDirty = false;

    const initCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2× for perf
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width  = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const w = rect.width, h = rect.height;
      particles = Array.from({ length: NUM_PARTICLES }, () => new Particle(w, h));
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pendingMX = e.clientX - rect.left;
      pendingMY = e.clientY - rect.top;
      mouseDirty = true;
    };

    // Trail for connections
    const trail: { x: number; y: number }[] = [];
    const TRAIL_LEN = isTouchDevice ? 8 : 20;

    const isDark = () => document.documentElement.classList.contains('dark');

    const draw = () => {
      const w = canvas.width  / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const dark = isDark();

      // Apply buffered mouse position
      if (mouseDirty) {
        mouse.x = pendingMX;
        mouse.y = pendingMY;
        mouseDirty = false;
      }

      ctx.clearRect(0, 0, w, h);

      // Update trail
      trail.unshift({ x: mouse.x, y: mouse.y });
      if (trail.length > TRAIL_LEN) trail.pop();

      // Draw mouse trail
      for (let i = 1; i < trail.length; i++) {
        const alpha = (1 - i / TRAIL_LEN) * 0.3;
        const r = (1 - i / TRAIL_LEN) * 3;
        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, r, 0, Math.PI * 2);
        ctx.fillStyle = dark
          ? `rgba(251,146,60,${alpha})`
          : `rgba(234,88,12,${alpha})`;
        ctx.fill();
      }

      // Update & draw particles
      for (const p of particles) {
        p.update(w, h, mouse.x, mouse.y);
        p.draw(ctx, dark);
      }

      // Draw connections (skip on low-end for perf)
      if (!isLowEnd) {
        const maxDist = 100;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = dark
                ? `rgba(251,146,60,${(1 - dist / maxDist) * 0.15})`
                : `rgba(234,88,12,${(1 - dist / maxDist) * 0.12})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    initCanvas();
    rafId = requestAnimationFrame(draw);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    const ro = new ResizeObserver(initCanvas);
    ro.observe(canvas.parentElement!);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
