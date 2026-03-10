"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";

/* ── Scrolling background text rows (CSS-only) ──────────────── */

function BackgroundRow({ index }: { index: number }) {
  const direction = index % 2 === 0 ? 1 : -1;
  const duration = 20 + (index % 4) * 5;
  const repeat =
    "INVENTRA\u00A0\u00A0\u00A0\u00A0INVENTRA\u00A0\u00A0\u00A0\u00A0INVENTRA\u00A0\u00A0\u00A0\u00A0INVENTRA\u00A0\u00A0\u00A0\u00A0INVENTRA\u00A0\u00A0\u00A0\u00A0INVENTRA\u00A0\u00A0\u00A0\u00A0INVENTRA\u00A0\u00A0\u00A0\u00A0INVENTRA\u00A0\u00A0\u00A0\u00A0";

  return (
    <div
      className="whitespace-nowrap text-[clamp(1.8rem,4.5vw,4rem)] font-bold tracking-tighter text-foreground/[0.035] select-none leading-none"
      style={{
        animation: `scroll-${direction > 0 ? "right" : "left"} ${duration}s linear infinite`,
      }}
    >
      {repeat}
    </div>
  );
}

/* ── Main loading screen ─────────────────────────────────────── */

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const progress = useMotionValue(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const hasCompleted = useRef(false);

  const stableOnComplete = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    // Slow linear fill over 2.8 seconds — fully visible progression
    const controls = animate(progress, 100, {
      duration: 2.8,
      ease: "linear",
      onUpdate: (v) => setDisplayProgress(v),
      onComplete: () => {
        if (!hasCompleted.current) {
          hasCompleted.current = true;
          setTimeout(stableOnComplete, 500);
        }
      },
    });

    return () => controls.stop();
  }, [progress, stableOnComplete]);

  const clipRight = useTransform(progress, [0, 100], [100, 0]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden"
      style={{ zIndex: 100 }}
    >
      {/* Scrolling background rows */}
      <div className="absolute inset-0 flex flex-col justify-center gap-3 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <BackgroundRow key={i} index={i} />
        ))}
      </div>

      {/* Center: outlined INVENTRA with left-to-right fill */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative select-none">
          {/* Layer 1: Outlined text — always visible */}
          <span
            className="block text-[clamp(3rem,11vw,7.5rem)] font-bold tracking-tighter leading-none"
            style={{
              WebkitTextStroke: "1.5px var(--foreground)",
              WebkitTextFillColor: "transparent",
            }}
          >
            INVENTRA.
          </span>

          {/* Layer 2: Solid filled text — clipped by progress */}
          <motion.span
            className="absolute inset-0 block text-[clamp(3rem,11vw,7.5rem)] font-bold tracking-tighter leading-none"
            style={{
              WebkitTextStroke: "1.5px var(--foreground)",
              WebkitTextFillColor: "var(--foreground)",
              clipPath: `inset(0 ${100 - displayProgress}% 0 0)`,
            }}
          >
            INVENTRA.
          </motion.span>
        </div>

        {/* Progress line — mirrors the text fill */}
        <div className="w-56 h-[1.5px] bg-foreground/[0.08] rounded-full mt-10 overflow-hidden">
          <motion.div
            className="h-full bg-foreground/30 origin-left"
            style={{ scaleX: displayProgress / 100 }}
          />
        </div>
      </div>

      {/* CSS keyframes */}
      <style jsx>{`
        @keyframes scroll-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0%); }
        }
        @keyframes scroll-left {
          from { transform: translateX(0%); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </motion.div>
  );
}
