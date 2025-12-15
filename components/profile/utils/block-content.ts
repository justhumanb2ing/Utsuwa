import type { LinkBlockData } from "@/types/block-editor";
import type { LayoutBlock } from "@/types/layout";

export const extractLinkData = (
  block?: LayoutBlock
): LinkBlockData => {
  const data = block?.data as Record<string, unknown> | null | undefined;
  if (!data) return {};
  const toStringOrNull = (value: unknown): string | null =>
    typeof value === "string" ? value : null;
  const toRecordOrNull = (
    value: unknown
  ): Record<string, unknown> | null =>
    value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  const kind = toStringOrNull(data.kind);
  const source = toStringOrNull(data.source);

  return {
    url: toStringOrNull(data.url) ?? toStringOrNull((data as { href?: unknown }).href),
    title: toStringOrNull(data.title),
    description: toStringOrNull(data.description),
    imageUrl:
      toStringOrNull(data.imageUrl) ??
      toStringOrNull((data as { image_url?: unknown }).image_url),
    siteName:
      toStringOrNull(data.siteName) ??
      toStringOrNull((data as { site_name?: unknown }).site_name),
    faviconUrl:
      toStringOrNull(data.faviconUrl) ??
      toStringOrNull((data as { favicon_url?: unknown }).favicon_url) ??
      toStringOrNull((data as { icon_url?: unknown }).icon_url),
    kind: kind === "rich" || kind === "metadata" ? kind : null,
    source:
      source === "provider" || source === "platform-only" || source === "og"
        ? source
        : null,
    platform: toStringOrNull(data.platform),
    tier: toStringOrNull(data.tier),
    resource: toStringOrNull(data.resource),
    data: toRecordOrNull(data.data),
  };
};

export const extractTextData = (
  block?: LayoutBlock
): { content?: string | null } => {
  const data = block?.data as Record<string, unknown> | null | undefined;
  if (!data) return {};
  return {
    content: typeof data.content === "string" ? data.content : null,
  };
};

export const extractImageData = (
  block?: LayoutBlock
): {
  imageUrl?: string | null;
  linkUrl?: string | null;
  aspectRatio?: number | null;
} => {
  const data = block?.data as Record<string, unknown> | null | undefined;
  if (!data) return {};
  return {
    imageUrl: typeof data.image_url === "string" ? data.image_url : null,
    linkUrl: typeof data.link_url === "string" ? data.link_url : null,
    aspectRatio:
      typeof data.aspect_ratio === "number" ? data.aspect_ratio : null,
  };
};

export const extractSectionData = (
  block?: LayoutBlock
): { title?: string | null } => {
  const data = block?.data as Record<string, unknown> | null | undefined;
  if (!data) return {};
  return {
    title: typeof data.title === "string" ? data.title : null,
  };
};
