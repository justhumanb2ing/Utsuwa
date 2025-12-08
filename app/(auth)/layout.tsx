import React from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen w-full items-stretch gap-6 bg-background px-4 py-8 overflow-hidden">
      <div className="relative z-10 flex w-full flex-col items-center justify-center p-8 lg:basis-1/3 lg:p-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      <div className="hidden relative lg:flex min-h-full basis-2/3 overflow-hidden rounded-lg bg-blue-400 shadow-2xl">
        <div className="relative h-full w-full overflow-hidden bg-linear-to-b from-[#60cdf9] to-[#9adcfc]">
          {/* Logo Bottom Left */}
          <div className="absolute bottom-[-10px] left-8">
            <h1 className="text-[12rem] font-display font-bold text-white leading-none tracking-tighter opacity-100 mix-blend-overlay">
              bella
            </h1>
          </div>
        </div>
      </div>
    </main>
  );
}
