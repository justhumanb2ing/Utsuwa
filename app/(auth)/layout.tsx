import React from "react";

import AuthVisualPanel from "@/components/auth/auth-visual-panel";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen w-full items-stretch gap-6 bg-background px-4 py-8 overflow-hidden relative">
      <div className="relative z-10 flex w-full flex-col items-center justify-center p-8 lg:basis-1/3 lg:p-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      
    </main>
  );
}
