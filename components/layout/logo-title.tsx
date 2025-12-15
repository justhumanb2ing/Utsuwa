import { siteConfig } from "@/config/metadata-config";

export default function LogoTitle() {
  return <h1 className="font-black text-3xl uppercase">{siteConfig.title}</h1>;
}
