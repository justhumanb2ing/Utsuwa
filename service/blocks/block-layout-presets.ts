import type { BlockKey } from "@/config/block-registry";
import { CANONICAL_BREAKPOINT, GRID_RESPONSIVE_COLUMNS, MIN_SIZE } from "./block-layout";

type BlockLayoutPreset = { w: number; h: number };

const FALLBACK_LAYOUT: Record<BlockKey, BlockLayoutPreset> = {
  link: { w: 2, h: 2 },
  text: { w: 2, h: 2 },
  image: { w: 2, h: 2 },
  map: { w: 2, h: 2 },
  section: {
    w: GRID_RESPONSIVE_COLUMNS[CANONICAL_BREAKPOINT],
    h: 1,
  },
};

export const getDefaultBlockLayout = (type: BlockKey): BlockLayoutPreset =>
  FALLBACK_LAYOUT[type] ?? { w: MIN_SIZE, h: MIN_SIZE };
