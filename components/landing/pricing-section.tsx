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
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-brand-cloud p-10 rounded-[2.5rem] flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300"
          >
            <div>
              <h3 className="text-2xl font-bold mb-2">Daydreamer</h3>
              <div className="text-5xl font-black mb-6">
                $0<span className="text-xl text-neutral-500 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="bg-foreground text-background rounded-full p-1">
                    <Check size={12} />
                  </div>
                  <span className="font-medium">Unlimited links</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-foreground text-background rounded-full p-1">
                    <Check size={12} />
                  </div>
                  <span className="font-medium">Basic analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-foreground text-background rounded-full p-1">
                    <Check size={12} />
                  </div>
                  <span className="font-medium">3 custom themes</span>
                </li>
              </ul>
            </div>
            <Button
              variant={"ghost"}
              className="h-16 w-full py-4 bg-background text-foreground rounded-full font-bold text-lg transition-colors"
            >
              Get Started
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-foreground text-white p-10 rounded-[2.5rem] flex flex-col justify-between relative overflow-hidden hover:scale-[1.02] transition-transform duration-300 shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-brand-indigo text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Visionary</h3>
              <div className="text-5xl font-black mb-6">
                $8<span className="text-xl text-neutral-400 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="bg-brand-indigo text-white rounded-full p-1">
                    <Check size={12} />
                  </div>
                  <span className="font-medium">Everything in Free</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-brand-indigo text-white rounded-full p-1">
                    <Check size={12} />
                  </div>
                  <span className="font-medium">Custom domain</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-brand-indigo text-white rounded-full p-1">
                    <Check size={12} />
                  </div>
                  <span className="font-medium">Remove Daydream branding</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-brand-indigo text-white rounded-full p-1">
                    <Check size={12} />
                  </div>
                  <span className="font-medium">Advanced SEO</span>
                </li>
              </ul>
            </div>
            <Button className="h-16 w-full py-4 bg-brand-indigo text-white rounded-full font-bold text-lg hover:bg-brand-indigo-hover transition-colors shadow-lg shadow-brand-inbg-brand-indigo/30">
              Upgrade Now
            </Button>
          </motion.div>
        </div> */}
      </div>
    </section>
  );
}
