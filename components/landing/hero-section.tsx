"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { landingCopy } from "@/config/landing-copy";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Highlighter } from "../ui/highlighter";

export default function HeroSection() {
  const { hero } = landingCopy;

  return (
    <section className="h-dvh w-full snap-start flex flex-col items-center justify-center relative overflow-hidden bg-white px-4">
      {/* Background Paint Splashes */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-[-5%] w-[500px] h-[500px] opacity-30 z-0 pointer-events-none hidden md:block"
      >
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#758BFD"
            d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-46.3C87.4,-33.4,90.1,-17.9,89.3,-2.6C88.5,12.7,84.2,27.7,75.4,40.6C66.6,53.5,53.3,64.3,39.2,70.3C25.1,76.3,10.2,77.5,-3.8,74.1C-17.8,70.6,-30.9,62.5,-42.6,52.8C-54.3,43.1,-64.6,31.8,-71.4,18.4C-78.2,5,-81.5,-10.5,-76.6,-23.7C-71.7,-36.9,-58.6,-47.8,-45.6,-55.4C-32.6,-63,-19.7,-67.3,-5.7,-67.9C8.3,-68.5,30.5,-83.6,44.7,-76.4Z"
            transform="translate(100 100)"
          />
        </svg>
      </motion.div>

      <motion.div
        animate={{
          scale: [2, 2.1, 1],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] opacity-20 z-0 pointer-events-none hidden md:block"
      >
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#FF4242"
            d="M39.9,-65.7C54.1,-60.5,69.6,-53.6,78.8,-41.4C88,-29.2,90.9,-11.7,86.8,4.1C82.7,19.9,71.6,34,59.8,45.8C48,57.6,35.5,67.1,21.5,72.1C7.5,77.1,-8,77.6,-22.4,73.5C-36.8,69.4,-50.1,60.7,-60.4,49.1C-70.7,37.5,-78,23,-79.6,7.8C-81.2,-7.4,-77.1,-23.3,-68.1,-36.7C-59.1,-50.1,-45.2,-61,-31.1,-66.3C-17,-71.6,-2.7,-71.3,12.2,-68.2"
            transform="translate(100 100)"
          />
        </svg>
      </motion.div>

      {/* Extra small droplets */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-8 h-8 rounded-full bg-brand-indigo opacity-40 blur-sm hidden md:block"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-6 h-6 rounded-full bg-brand-poppy opacity-30 blur-sm hidden md:block"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="container mx-auto max-w-6xl z-10 flex flex-col items-center text-center">
        <Highlighter action="highlight" color="#758bfd" strokeWidth={1} isView>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-brand-indigobg-brand-indigo font-bold tracking-widest uppercase mb-4 text-sm md:text-base">
              {hero.eyebrow}
            </h2>
          </motion.div>
        </Highlighter>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] mb-8 text-black"
        >
          {hero.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-base md:text-xl max-w-2xl mb-10 font-light"
        >
          {hero.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            size={"icon-lg"}
            className={cn(
              "w-3xs h-12 text-sm bg-brand-ink text-white rounded-xl font-bold transition-colors flex items-center gap-2",
              "lg:w-xs lg:h-16 lg:text-lg",
              "hover:bg-brand-ink-hover"
            )}
          >
            <Link href="/go/profile" className="flex items-center gap-2">
              {hero.cta}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </motion.div>

        {/* Floating Interactive Cards */}
        {/* <div className="relative w-full max-w-4xl h-64 mt-16 hidden md:block">
          <DraggableCard
            color="bg-brand-indigo"
            rotate="-6deg"
            top="-20px"
            left="10%"
            content="📸 Photography"
          />
          <DraggableCard
            color="bg-brand-poppy"
            rotate="3deg"
            top="10px"
            left="40%"
            content="🎵 Spotify"
          />
          <DraggableCard
            color="bg-brand-ink"
            textColor="text-white"
            rotate="-3deg"
            top="-30px"
            left="70%"
            content="🐦 Twitter"
          />
        </div> */}
      </div>
    </section>
  );
}

// const DraggableCard = ({
//   color,
//   rotate,
//   top,
//   left,
//   content,
//   textColor = "text-black",
// }: any) => {
//   return (
//     <motion.div
//       drag
//       dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
//       whileHover={{ scale: 1.1, zIndex: 50, cursor: "grab" }}
//       whileDrag={{ scale: 1.2, cursor: "grabbing" }}
//       className={`absolute ${color} ${textColor} w-48 h-32 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xl`}
//       style={{ rotate, top, left }}
//     >
//       {content}
//     </motion.div>
//   );
// };
