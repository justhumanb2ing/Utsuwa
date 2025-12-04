import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/metadata-config";

const SIGN_IN_TITLE = "Sign in";
const SIGN_IN_DESCRIPTION =
  "Sign in to Daydream to manage your profile and links.";
const SIGN_IN_URL = `${siteConfig.url}/sign-in`;

export const metadata: Metadata = {
  title: SIGN_IN_TITLE,
  description: SIGN_IN_DESCRIPTION,
  openGraph: {
    type: "website",
    url: SIGN_IN_URL,
    title: SIGN_IN_TITLE,
    description: SIGN_IN_DESCRIPTION,
    images: [{ url: siteConfig.author.photo, alt: siteConfig.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: SIGN_IN_TITLE,
    description: SIGN_IN_DESCRIPTION,
    images: [{ url: siteConfig.author.photo, alt: siteConfig.title }],
  },
  alternates: {
    canonical: SIGN_IN_URL,
    languages: {
      "ko-KR": SIGN_IN_URL,
      "en-US": SIGN_IN_URL,
    },
  },
};

export default function SignInPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: SIGN_IN_TITLE,
    description: SIGN_IN_DESCRIPTION,
    url: SIGN_IN_URL,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.title,
      url: siteConfig.url,
    },
    potentialAction: {
      "@type": "LoginAction",
      target: SIGN_IN_URL,
    },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <JsonLd data={jsonLd} />
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  );
}
