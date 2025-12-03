import type { PageHandle } from "@/types/profile";

export type BlockEditorMode = "placeholder" | "persisted";

export type LinkBlockData = { url?: string | null; title?: string | null };
export type TextBlockData = { content?: string | null };

export type LinkBlockState = { url: string; title: string };
export type TextBlockState = { content: string };

type BaseBlockEditorParams = {
  blockId?: string;
  handle: PageHandle;
  mode: BlockEditorMode;
  isOwner: boolean;
};

export type LinkBlockEditorParams = BaseBlockEditorParams & {
  data: LinkBlockData;
  onSavePlaceholder?: (data: LinkBlockState) => Promise<void> | void;
};

export type TextBlockEditorParams = BaseBlockEditorParams & {
  data: TextBlockData;
  onSavePlaceholder?: (data: TextBlockState) => Promise<void> | void;
};
