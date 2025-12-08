import type { Metadata } from "next";

import { siteConfig } from "@/config/metadata-config";
import OnboardingSection from "@/components/auth/onboarding-section";

export const metadata: Metadata = {
  title: "Onboarding",
  description:
    "Answer a few quick questions to set up your Daydream page. Configure your profile and links in minutes and start sharing.",
  alternates: {
    canonical: `${siteConfig.url}/onboarding`,
    languages: {
      "ko-KR": `${siteConfig.url}/onboarding`,
      "en-US": `${siteConfig.url}/onboarding`,
    },
  },
  openGraph: {
    title: "Onboarding",
    description:
      "Answer a few quick questions to set up your Daydream page. Configure your profile and links in minutes and start sharing.",
    url: `${siteConfig.url}/onboarding`,
  },
  twitter: {
    card: "summary",
    title: "Onboarding",
    description:
      "Answer a few quick questions to set up your Daydream page. Configure your profile and links in minutes and start sharing.",
  },
};

export default function OnboardingPage() {
  return (
    <div>
      <OnboardingSection />
    </div>
  );
}
