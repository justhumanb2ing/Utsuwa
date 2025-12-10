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
