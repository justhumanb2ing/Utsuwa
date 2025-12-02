"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { OverlayProvider } from "overlay-kit";
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast";
import { getQueryClient } from "@/lib/get-query-client";

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>
        <ToastProvider position="bottom-center">
          <AnchoredToastProvider>{children}</AnchoredToastProvider>
        </ToastProvider>
      </OverlayProvider>
    </QueryClientProvider>
  );
}
