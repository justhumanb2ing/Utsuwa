"use client";

import { motion } from "motion/react";
import { MousePointer2, Sparkles } from "lucide-react";

type FloatingCard = {
  title: string;
  description: string;
  top: string;
  left: string;
  rotate: number;
  gradient: string;
};

const floatingCards: FloatingCard[] = [
  {
    title: "Grid Blocks",
    description: "Snap, resize, remix",
    top: "8%",
    left: "12%",
    rotate: -8,
    gradient: "from-white/90 to-brand-indigo/70 text-brand-ink",
  },
  {
    title: "Link Capsule",
    description: "Layer music & socials",
    top: "50%",
    left: "8%",
    rotate: 6,
    gradient: "from-brand-poppy/80 to-brand-indigo/70 text-white",
  },
  {
    title: "Live Preview",
    description: "Every drag recorded",
    top: "20%",
    left: "55%",
    rotate: -4,
    gradient: "from-brand-indigo/90 to-brand-ink/90 text-white",
  },
  {
    title: "Touch Friendly",
    description: "Built for mobile drops",
    top: "62%",
    left: "58%",
    rotate: 10,
    gradient: "from-white/90 to-brand-poppy/70 text-brand-ink",
  },
];

export default function AuthVisualPanel() {
  return (
    <div className="hidden relative lg:flex min-h-full basis-2/3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-indigo/90 via-brand-poppy/70 to-brand-indigo/90 shadow-2xl">
      {/* Textured backplate */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_30%_80%,rgba(255,255,255,0.14),transparent_50%)]" />

      {/* Floating glow shapes */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], rotate: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.1, 0.95, 1.1], rotate: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-120px] right-[-60px] h-96 w-96 rounded-full bg-brand-poppy/30 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-1/3 top-4 h-16 w-16 rounded-full bg-white/30 blur-xl"
      />

      <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 lg:p-14 text-white">
        <div className="space-y-4">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur"
          >
            <Sparkles className="h-4 w-4" />
            Utsuwa in motion
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl lg:text-6xl font-black leading-[0.9] tracking-tight drop-shadow-xl"
          >
            bella is your
            <br />
            corner of the internet
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-xl text-base lg:text-lg text-white/85"
          >
            Drag blocks, stack playlists, and showcase your vibe with the same
            kinetic energy as our landing page. Every interaction is captured
            and previewed instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-3 text-sm text-white/80"
          >
            <MousePointer2 className="h-4 w-4" />
            Hover or drag the cards to feel the canvas react.
          </motion.div>
        </div>

        <div className="relative mt-10 flex-1">
          {floatingCards.map((card) => (
            <motion.div
              key={card.title}
              drag
              dragConstraints={{ left: -18, right: 18, top: -18, bottom: 18 }}
              whileHover={{ scale: 1.05, rotate: 0 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 14, rotate: card.rotate }}
              animate={{ opacity: 1, y: 0, rotate: card.rotate }}
              transition={{ duration: 0.65 }}
              className="absolute h-32 w-56 rounded-3xl p-[1px] shadow-xl backdrop-blur-lg"
              style={{ top: card.top, left: card.left }}
            >
              <div
                className={`flex h-full w-full flex-col justify-between rounded-[22px] bg-gradient-to-br ${card.gradient} px-5 py-4 shadow-inner shadow-black/10`}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  {card.title}
                </div>
                <div className="text-lg font-bold leading-tight">
                  {card.description}
                </div>
                <div className="text-[11px] text-white/70">Drag to reposition</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3 text-sm text-white/80">
          <span className="rounded-full bg-white/15 px-3 py-1">Realtime sync</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Responsive grid</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Motion-friendly</span>
        </div>
      </div>
    </div>
  );
}
