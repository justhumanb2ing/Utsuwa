import type { BlockKey } from "@/config/block-registry";
import {
  CANONICAL_BREAKPOINT,
  GRID_RESPONSIVE_COLUMNS,
  MIN_SIZE,
} from "./block-layout";

type BlockLayoutPreset = { w: number; h: number };

const FALLBACK_LAYOUT: Record<BlockKey, BlockLayoutPreset> = {
  link: { w: MIN_SIZE, h: MIN_SIZE },
  text: { w: MIN_SIZE, h: MIN_SIZE },
  image: { w: MIN_SIZE, h: MIN_SIZE },
  map: { w: MIN_SIZE, h: MIN_SIZE },
  section: {
    w: GRID_RESPONSIVE_COLUMNS[CANONICAL_BREAKPOINT],
    h: MIN_SIZE,
  },
};

export const getDefaultBlockLayout = (type: BlockKey): BlockLayoutPreset =>
  FALLBACK_LAYOUT[type] ?? { w: MIN_SIZE, h: MIN_SIZE };
