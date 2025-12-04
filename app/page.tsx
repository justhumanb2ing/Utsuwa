import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/metadata-config";

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
    <div className="flex min-h-screen items-center justify-center font-sans dark:bg-black">
      <JsonLd data={jsonLd} />
    </div>
  );
}
