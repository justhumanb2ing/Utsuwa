"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { landingCopy } from "@/config/landing-copy";

export default function FooterSection() {
  const { footer } = landingCopy;

  return (
    <section className="h-[50vh] min-h-[400px] w-full snap-start flex flex-col items-center justify-center p-4 bg-brand-ink text-white relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute -left-20 bottom-0 w-64 h-64 bg-brand-indigo rounded-full blur-[100px] opacity-50" />
      <div className="absolute -right-20 top-0 w-64 h-64 bg-brand-poppy rounded-full blur-[100px] opacity-70" />

      <div className="container mx-auto max-w-4xl text-center z-10">
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-none"
        >
          {footer.headingLines.map((line, index) => (
            <span key={line}>
              {line}
              {index < footer.headingLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link
            href="/go/profile"
            className="inline-flex px-12 py-5 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform"
          >
            {footer.cta}
          </Link>
        </motion.div>

        <div className="mt-20 flex flex-col md:flex-row items-center justify-between w-full text-neutral-400 text-sm">
          <div className="mb-4 md:mb-0">{footer.copyright}</div>
          <div className="flex gap-8">
            {footer.links.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
