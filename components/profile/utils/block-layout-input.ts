import type { BlockKey } from "@/config/block-registry";
import { type LayoutInput } from "@/service/blocks/block-layout";
import { getDefaultBlockLayout } from "@/service/blocks/block-layout-presets";
import type { ProfileBlockItem } from "../types/block-item";

export const toLayoutInputs = (items: ProfileBlockItem[]): LayoutInput[] =>
  items.map((item, index) => {
    if (item.kind === "persisted") {
      const { block } = item;
      const defaultLayout = getDefaultBlockLayout(block.type as BlockKey);
      const width = Math.max(block.w ?? defaultLayout.w, defaultLayout.w);
      const height = Math.max(block.h ?? defaultLayout.h, defaultLayout.h);

      return {
        id: block.id,
        x: block.x ?? index,
        y: block.y ?? 0,
        w: width,
        h: height,
      };
    }

    const defaultLayout = getDefaultBlockLayout(item.type);

    return {
      id: item.id,
      x: index,
      y: 0,
      w: defaultLayout.w,
      h: defaultLayout.h,
    };
  });
