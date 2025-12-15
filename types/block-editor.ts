import type { PageHandle } from "@/types/profile";

export type BlockEditorMode = "placeholder" | "persisted";

export type LinkBlockData = {
  url?: string | null;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  siteName?: string | null;
  faviconUrl?: string | null;
  kind?: "rich" | "metadata" | null;
  source?: "provider" | "platform-only" | "og" | null;
  platform?: string | null;
  tier?: string | null;
  resource?: string | null;
  data?: Record<string, unknown> | null;
};
export type TextBlockData = { content?: string | null };
export type ImageBlockData = { url?: string | null };
export type SectionBlockData = { title?: string | null };

export type LinkBlockState = { title: string };
export type TextBlockState = { content: string };
export type SectionBlockState = { title: string };

type BaseBlockEditorParams = {
  blockId?: string;
  handle: PageHandle;
  mode: BlockEditorMode;
  isOwner: boolean;
};

// 모든 BlockEditorParams 공통 제네릭 타입
export type BlockEditorParams<TData, TSave = TData> = BaseBlockEditorParams & {
  data: TData;
  onSavePlaceholder?: (data: TSave) => Promise<void> | void;
};

export type LinkBlockParams = BlockEditorParams<LinkBlockData, LinkBlockState>;
export type TextBlockParams = BlockEditorParams<TextBlockData>;
export type ImageBlockParams = BlockEditorParams<ImageBlockData, { url: string }>;
export type SectionBlockParams = BlockEditorParams<
  SectionBlockData,
  SectionBlockState
>;

export type LinkBlockEditorParams<T> = BaseBlockEditorParams & {
  data: LinkBlockData;
  onSavePlaceholder?: (data: T) => Promise<void> | void;
};

export type TextBlockEditorParams<T> = BaseBlockEditorParams & {
  data: TextBlockData;
  onSavePlaceholder?: (data: T) => Promise<void> | void;
};
