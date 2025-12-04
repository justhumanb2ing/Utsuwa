import { MetadataRoute } from "next";
import { siteConfig } from "@/config/metadata-config";
import { createServerSupabaseClient } from "@/config/supabase";
import type { Tables } from "@/types/database.types";

type PublicPageRecord = Pick<
  Tables<"pages">,
  "handle" | "created_at" | "is_public"
>;

const formatDate = (value?: string | null): string => {
  if (!value) return new Date().toISOString().split("T")[0];
  return new Date(value).toISOString().split("T")[0];
};

const buildUrl = (path: string): string | null => {
  if (!siteConfig.url) return null;
  try {
    return new URL(path, siteConfig.url).toString();
  } catch {
    return null;
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("pages")
    .select("handle, updated_at, created_at, is_public")
    .eq("is_public", true)
    .not("handle", "is", null);

  const profiles =
    data?.flatMap<MetadataRoute.Sitemap[number]>((page: PublicPageRecord) => {
      if (!page.handle) return [];
      const url = buildUrl(`/profile/${encodeURIComponent(page.handle)}`);
      if (!url) return [];

      return [
        {
          url,
          lastModified: formatDate(page.created_at),
        },
      ];
    }) ?? [];

  const staticRoutes = ["/", "/sign-in", "/sign-up"]
    .map((route) => {
      const url = buildUrl(route);
      if (!url) return null;
      return {
        url,
        lastModified: new Date().toISOString().split("T")[0],
      };
    })
    .filter(Boolean) as MetadataRoute.Sitemap;

  return [...staticRoutes, ...profiles];
}
