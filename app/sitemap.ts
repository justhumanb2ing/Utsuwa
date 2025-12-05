import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { siteConfig } from "@/config/metadata-config";
import type { Tables } from "@/types/database.types";

type PublicPageRecord = Pick<Tables<"pages">, "handle" | "created_at" | "is_public">;

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
  // sitemap은 정적 생성 대상이므로 인증이 불필요한 익명 Supabase 클라이언트를 사용한다.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("pages")
    .select("handle, created_at, is_public")
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
