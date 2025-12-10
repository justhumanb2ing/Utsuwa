import type { BlockType } from "@/config/block-registry";
import type { BlockWithDetails } from "@/types/block";

export type PlaceholderBlock = { kind: "placeholder"; id: string; type: BlockType };
export type PersistedBlock = { kind: "persisted"; block: BlockWithDetails };

export type ProfileBlockItem = PlaceholderBlock | PersistedBlock;

export const isPersistedBlock = (
  item: ProfileBlockItem
): item is PersistedBlock => item.kind === "persisted";
