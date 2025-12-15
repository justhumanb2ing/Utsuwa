import FeatureSection from "@/components/landing/feature-section";
import FooterSection from "@/components/landing/footer-section";
import HeroSection from "@/components/landing/hero-section";
import PricingSection from "@/components/landing/pricing-section";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/ui/item";
import { siteConfig } from "@/config/metadata-config";
import Link from "next/link";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.title,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: siteConfig.locale,
    publisher: {
      "@type": "Organization",
      name: siteConfig.title,
      url: siteConfig.url,
      logo: siteConfig.author.photo,
    },
  };

  return (
    <div className="h-dvh w-full overflow-x-hidden overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-background text-foreground">
      <JsonLd data={jsonLd} />
      <nav className="sticky top-0 z-20 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl justify-end">
          <Item className="w-full flex justify-end items-center p-4 lg:p-0 gap-2 border-none shadow-none bg-transparent">
            <aside className="px-4">
              <Button variant={"ghost"} className="font-medium">
                <Link href={"/go/profile"}>Sign in</Link>
              </Button>
              <Button className="font-medium bg-brand-poppy hover:bg-brand-poppy-hover">
                <Link href={"/go/profile"}>Start for free</Link>
              </Button>
            </aside>
          </Item>
        </div>
      </nav>

      <HeroSection />
      <FeatureSection />
      <PricingSection />
      <FooterSection />
    </div>
  );
}
