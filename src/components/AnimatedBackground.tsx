import { motion, useSpring, useScroll, useTransform } from 'motion/react';
import { useEffect } from 'react';

// Check once at module load — avoids per-render checks
const isTouchDevice =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Static version for mobile & reduced-motion users ────────────────────────
// No JS, no listeners, no RAF — just CSS. Loads instantly, zero CPU.
function StaticBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[var(--bg-primary)] transition-colors duration-500">
      <div
        className="absolute rounded-full"
        style={{
          width: '60vw', height: '60vw',
          maxWidth: 600, maxHeight: 600,
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)',
          filter: 'blur(80px)',
          opacity: 0.18,
          right: '5%', top: '10%',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '50vw', height: '50vw',
          maxWidth: 500, maxHeight: 500,
          background: 'radial-gradient(circle, #8b5cf6 0%, transparent 60%)',
          filter: 'blur(80px)',
          opacity: 0.14,
          left: '5%', bottom: '10%',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--bg-primary)_100%)] opacity-80" />
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[var(--bg-primary)] to-transparent opacity-90" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent opacity-90" />
    </div>
  );
}

// ─── Full animated version for desktop ───────────────────────────────────────
function AnimatedBackgroundDesktop() {
  const mouseX = useSpring(0, { stiffness: 40, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 40, damping: 20 });

  const { scrollY } = useScroll();
  const parallaxYMain      = useTransform(scrollY, [0, 1000], [0, -150]);
  const parallaxYGrid      = useTransform(scrollY, [0, 1000], [0, -100]);
  const parallaxYGradient1 = useTransform(scrollY, [0, 1000], [0, -50]);

  useEffect(() => {
    // FIX: throttle via rAF instead of firing on every mousemove.
    // Previously this ran spring.set() synchronously on every pixel of movement,
    // hammering the main thread. Now it batches updates to one per frame.
    let pendingX = 0, pendingY = 0, dirty = false, rafId: number;

    const onMove = (e: MouseEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      dirty = true;
    };

    const tick = () => {
      if (dirty) {
        mouseX.set(pendingX);
        mouseY.set(pendingY);
        dirty = false;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMove, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[var(--bg-primary)] transition-colors duration-500">

      {/* Grid — subtle depth layer */}
      <motion.div
        className="absolute inset-x-0 w-full opacity-[0.03] dark:opacity-[0.02]"
        style={{
          height: '200vh',
          top: '-50vh',
          backgroundImage: `linear-gradient(to right, var(--text-primary) 1px, transparent 1px),
                            linear-gradient(to bottom, var(--text-primary) 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem',
          backgroundPosition: 'center',
          y: parallaxYGrid,
          willChange: 'transform',
        }}
      />

      {/* Mouse-following aura */}
      <motion.div
        className="absolute w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full blur-[100px] md:blur-[140px] opacity-50 dark:opacity-20 transform-gpu"
        style={{
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)',
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          willChange: 'transform',
        }}
      />

      {/* Floating ambient — blue */}
      <motion.div
        className="absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full blur-[100px] bg-blue-500/20 dark:bg-blue-400/10 transform-gpu"
        animate={{ x: ['0%', '10%', '0%'], y: ['0%', '5%', '0%'], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ right: '5%', top: '10%', y: parallaxYGradient1, willChange: 'transform' }}
      />

      {/* Floating ambient — purple */}
      <motion.div
        className="absolute w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full blur-[100px] bg-purple-500/20 dark:bg-purple-400/10 transform-gpu"
        animate={{ x: ['0%', '-10%', '0%'], y: ['0%', '10%', '0%'] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        style={{ left: '5%', bottom: '10%', y: parallaxYMain, willChange: 'transform' }}
      />

      {/* Vignette overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--bg-primary)_100%)] opacity-80" />
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[var(--bg-primary)] to-transparent opacity-90" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent opacity-90" />
    </div>
  );
}

// ─── Exported component: picks the right version automatically ───────────────
export function AnimatedBackground() {
  if (isTouchDevice || prefersReducedMotion) {
    return <StaticBackground />;
  }
  return <AnimatedBackgroundDesktop />;
}
