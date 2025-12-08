import Header from "@/components/layout/header";
import React from "react";

export default function WithHeaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <nav className="relative h-16 w-full mx-auto z-10">
        <Header />
      </nav>

      {children}
    </main>
  );
}
