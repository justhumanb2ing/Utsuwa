import { MIN_SIZE, type LayoutInput } from "@/service/blocks/block-layout";
import type { ProfileBlockItem } from "../types/block-item";

export const toLayoutInputs = (items: ProfileBlockItem[]): LayoutInput[] =>
  items.map((item, index) => {
    if (item.kind === "persisted") {
      const { block } = item;
      return {
        id: block.id,
        x: block.x ?? index,
        y: block.y ?? 0,
        w: block.w ?? MIN_SIZE,
        h: block.h ?? MIN_SIZE,
      };
    }

    return {
      id: item.id,
      x: index,
      y: 0,
      w: MIN_SIZE,
      h: MIN_SIZE,
    };
  });
