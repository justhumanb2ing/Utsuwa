import React from "react";

export default function WithHeaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative flex flex-col xl:flex-row">
      <aside className="p-4">Logo</aside>
      <div className="grow">{children}</div>
    </main>
  );
}
