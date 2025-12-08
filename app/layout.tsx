import type { Metadata } from "next";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Geist, Geist_Mono } from "next/font/google";
import * as Sentry from "@sentry/nextjs";
import { GA_MEASUREMENT_ID, hasGaMeasurementId } from "@/lib/analytics";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";

import Providers from "./providers";
import { metadataConfig } from "@/config/metadata-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  ...metadataConfig,
  other: {
    ...Sentry.getTraceData(),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorBackground: "white",
        },
        layout: {
          termsPageUrl: "https://clerk.com/terms",
          unsafe_disableDevelopmentModeWarnings: true,
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "iconButton",
          logoPlacement: "outside",
        },
        captcha: {
          size: "flexible",
          language: "ko-KR",
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Providers>{children}</Providers>
          {hasGaMeasurementId ? (
            <>
              <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
              <GoogleTagManager gtmId={GA_MEASUREMENT_ID} />
            </>
          ) : null}
        </body>
      </html>
    </ClerkProvider>
  );
}
