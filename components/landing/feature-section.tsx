"use client";

import React from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { landingCopy } from "@/config/landing-copy";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export default function FeatureSection() {
  const {
    feature: { primary, secondary },
  } = landingCopy;

  return (
    <div className="w-full bg-white">
      {/* Feature 1 */}
      <section className="h-screen w-full snap-start flex items-center justify-center p-4 bg-white">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false }}
          >
            <h3 className="text-brand-poppy font-bold uppercase tracking-widest mb-4">
              {primary.tag}
            </h3>
            <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
              {primary.headingLines.map((line, index) => (
                <span key={line}>
                  {line}
                  {index < primary.headingLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </h2>
            <p className="text-xl text-neutral-700 mb-8 max-w-md">
              {primary.description}
            </p>
            <ul className="space-y-4 font-semibold text-lg">
              {primary.bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-brand-indigo" />
                  {bullet}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false }}
            className="relative"
          >
            <div className="bg-background rounded-[3rem] p-8 md:p-12 aspect-square relative overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1676395564210-c6ce3d4b40f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                alt="Abstract 3D shapes"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                width={200}
                height={200}
                unoptimized
              />
              <div className="relative z-10 grid grid-cols-2 gap-4 h-full">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-4 shadow-lg flex flex-col justify-between"
                >
                  <div className="w-8 h-8 bg-brand-potext-brand-poppy rounded-full" />
                  <span className="font-bold">{primary.cards[0]?.title}</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-brand-poppy text-white rounded-2xl p-4 shadow-lg col-span-1 row-span-2 flex flex-col justify-between"
                >
                  <div className="text-4xl">{primary.cards[1]?.accent}</div>
                  <span className="font-bold text-xl">
                    {primary.cards[1]?.title}
                  </span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-brand-indigo rounded-2xl p-4 shadow-lg flex flex-col justify-between"
                >
                  <div className="w-8 h-8 bg-brand-potext-brand-poppy rounded-full" />
                  <span className="font-bold text-white">
                    {primary.cards[2]?.title}
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature 2 */}
      <section className="h-screen w-full snap-start flex items-center justify-center p-4 bg-background">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Image Left */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false }}
            className="order-2 md:order-1"
          >
            <div className="bg-white rounded-[3rem] overflow-hidden aspect-4/5 relative shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1618863898807-510dd6cd5cb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                alt="Person holding phone"
                className="w-full h-full object-cover"
                width={200}
                height={200}
                unoptimized
              />
              <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-2xl">
                <p className="font-bold text-lg mb-2">
                  {secondary.profileHandle}
                </p>
                <div className="flex gap-2">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-indigo w-3/4" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text Right */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false }}
            className="order-1 md:order-2"
          >
            <h3 className="text-brand-inbg-brand-indigo font-bold uppercase tracking-widest mb-4">
              {secondary.tag}
            </h3>
            <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
              {secondary.headingLines.map((line, index) => (
                <span key={line}>
                  {line}
                  {index < secondary.headingLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </h2>
            <p className="text-xl text-neutral-700 mb-8 max-w-md">
              {secondary.description}
            </p>
            <Button
              size={"icon-lg"}
              className={cn(
                "w-3xs h-12 text-base bg-brand-poppy text-white rounded-xl font-bold transition-colors flex items-center gap-2",
                "lg:w-3xs lg:h-14 lg:text-lg",
                "hover:bg-brand-poppy-hover"
              )}
            >
              {secondary.cta}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
