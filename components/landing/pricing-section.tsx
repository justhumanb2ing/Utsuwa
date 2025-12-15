"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { landingCopy } from "@/config/landing-copy";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export default function PricingSection() {
  const { pricing } = landingCopy;

  return (
    <section className="h-screen w-full snap-start flex items-center justify-center p-4 bg-white relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-cloud/30 -skew-x-12 transform origin-top-right translate-x-32" />

      <div className="container mx-auto max-w-6xl z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
            {pricing.heading}
          </h2>
          <p className="text-xl text-neutral-700">{pricing.description}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center p-10 flex justify-center hover:scale-[1.02] transition-transform duration-300 font-bold"
        >
          <Badge variant={"secondary"} className="bg-brand-indigo text-white font-medium px-3 py-1">
            {pricing.comingSoon}
          </Badge>
        </motion.div>
      </div>
    </section>
  );
}
