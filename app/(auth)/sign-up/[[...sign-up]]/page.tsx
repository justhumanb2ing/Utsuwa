import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/metadata-config";

const SIGN_UP_TITLE = "Sign up";
const SIGN_UP_DESCRIPTION =
  "Create your Daydream account and publish your profile in minutes.";
const SIGN_UP_URL = `${siteConfig.url}/sign-up`;

export const metadata: Metadata = {
  title: SIGN_UP_TITLE,
  description: SIGN_UP_DESCRIPTION,
  openGraph: {
    type: "website",
    url: SIGN_UP_URL,
    title: SIGN_UP_TITLE,
    description: SIGN_UP_DESCRIPTION,
    images: [{ url: siteConfig.author.photo, alt: siteConfig.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: SIGN_UP_TITLE,
    description: SIGN_UP_DESCRIPTION,
    images: [{ url: siteConfig.author.photo, alt: siteConfig.title }],
  },
  alternates: {
    canonical: SIGN_UP_URL,
    languages: {
      "ko-KR": SIGN_UP_URL,
      "en-US": SIGN_UP_URL,
    },
  },
};

export default function SignUpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: SIGN_UP_TITLE,
    description: SIGN_UP_DESCRIPTION,
    url: SIGN_UP_URL,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.title,
      url: siteConfig.url,
    },
    potentialAction: {
      "@type": "RegisterAction",
      target: SIGN_UP_URL,
    },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <JsonLd data={jsonLd} />
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </div>
  );
}
