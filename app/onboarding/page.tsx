import type { Metadata } from "next";

import OnboardingComponent from "@/components/onboarding/test";

export const metadata: Metadata = {
  title: "Onboarding | Nook",
  description:
    "Answer a few quick questions to set up your Nook page. Configure your profile and links in minutes and start sharing.",
  openGraph: {
    title: "Onboarding | Nook",
    description:
      "Answer a few quick questions to set up your Nook page. Configure your profile and links in minutes and start sharing.",
  },
  twitter: {
    card: "summary",
    title: "Onboarding | Nook",
    description:
      "Answer a few quick questions to set up your Nook page. Configure your profile and links in minutes and start sharing.",
  },
};

export default function OnboardingPage() {
  return (
    <div>
      <OnboardingComponent />
    </div>
  );
}
