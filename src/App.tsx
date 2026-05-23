/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import Lenis from 'lenis';
import { Layout } from './components/Layout';
import { AnimatedBackground } from './components/AnimatedBackground';

// Lazy load all pages — each is its own JS chunk, loaded only when visited
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Experts = lazy(() => import('./pages/Experts'));
const Resources = lazy(() => import('./pages/Resources'));
const CaseStudies = lazy(() => import('./pages/CaseStudies'));
const Contact = lazy(() => import('./pages/Contact'));
const Pricing = lazy(() => import('./pages/Pricing'));
const ResearchServices = lazy(() => import('./pages/ResearchServices'));

// Detect touch/mobile ONCE at module level (avoids re-checking on every render)
const isTouchDevice =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

// Detect reduced-motion preference ONCE
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PageLoader = () => (
  <div className="fixed inset-0 min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] z-[9999]">
    <div className="relative">
      <div className="w-16 h-16 border-2 border-[var(--accent)]/20 rounded-full" />
      <div className="absolute inset-0 w-16 h-16 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-6 text-sm font-bold tracking-[0.3em] uppercase text-[var(--accent)]"
    >
      Verifying Intelligence
    </motion.p>
  </div>
);

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

useEffect(() => {
  if (isTouchDevice || prefersReducedMotion) return;

  // Defer until after first paint — stops the 116ms forced reflow on load
  const timer = setTimeout(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, 500); // after first paint

  return () => clearTimeout(timer);
}, []);

  return (
    <>
      <AnimatedBackground />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<Services />} />
            <Route path="experts" element={<Experts />} />
            <Route path="resources" element={<Resources />} />
            <Route path="resources/casestudy" element={<CaseStudies />} />
            <Route path="contact" element={<Contact />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="research-services" element={<ResearchServices />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
