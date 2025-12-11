import type { BlockWithDetails } from "@/types/block";

export const extractLinkData = (
  block?: BlockWithDetails
): { url?: string | null; title?: string | null } => {
  if (!block) return {};
  return {
    url: block.url ?? null,
    title: block.title ?? null,
  };
};

export const extractTextData = (
  block?: BlockWithDetails
): { content?: string | null } => {
  if (!block) return {};
  return {
    content: block.content ?? null,
  };
};

export const extractImageData = (
  block?: BlockWithDetails
): {
  imageUrl?: string | null;
  linkUrl?: string | null;
  aspectRatio?: number | null;
} => {
  if (!block) return {};
  return {
    imageUrl: block.image_url ?? null,
    linkUrl: block.link_url ?? null,
    aspectRatio: block.aspect_ratio ?? null,
  };
};

export const extractSectionData = (
  block?: BlockWithDetails
): { title?: string | null } => {
  if (!block) return {};
  return { title: block.title ?? null };
};
