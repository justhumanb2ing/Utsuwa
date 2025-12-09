import type { BlockWithDetails } from "@/types/block";

export const GRID_BREAKPOINTS = {
  xl: 960,
  lg: 720,
  md: 560,
  sm: 360,
  xs: 240,
} as const;

export const GRID_RESPONSIVE_COLUMNS = {
  xl: 4,
  lg: 4,
  md: 3,
  sm: 2,
  xs: 2,
} as const;

export type GridBreakpoint = keyof typeof GRID_BREAKPOINTS;

export const CANONICAL_BREAKPOINT: GridBreakpoint = "lg";
export const GRID_COLUMNS = GRID_RESPONSIVE_COLUMNS[CANONICAL_BREAKPOINT];
export const GRID_ROWS = 50;
export const GRID_ROW_HEIGHT = 300;
export const MIN_SIZE = 1;
export const MAX_SIZE = 4;

export type LayoutInput = Pick<BlockWithDetails, "id" | "x" | "y" | "w" | "h">;

export type BlockLayout = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type OccupiedGrid = boolean[][];

const clampSize = (value?: number | null): number => {
  if (typeof value !== "number" || Number.isNaN(value)) return MIN_SIZE;
  return Math.min(Math.max(value, MIN_SIZE), MAX_SIZE);
};

const clampCoordinate = (
  value: number | null | undefined,
  maxIndex: number
): number => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), maxIndex);
};

const createOccupiedGrid = (): OccupiedGrid =>
  Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLUMNS }, () => false)
  );

const canPlace = (
  grid: OccupiedGrid,
  x: number,
  y: number,
  w: number,
  h: number
): boolean => {
  if (x < 0 || y < 0) return false;
  if (x + w > GRID_COLUMNS) return false;
  if (y + h > GRID_ROWS) return false;

  for (let row = y; row < y + h; row += 1) {
    for (let col = x; col < x + w; col += 1) {
      if (grid[row]?.[col]) return false;
    }
  }

  return true;
};

const occupy = (grid: OccupiedGrid, x: number, y: number, w: number, h: number) => {
  for (let row = y; row < y + h; row += 1) {
    for (let col = x; col < x + w; col += 1) {
      if (grid[row] && typeof grid[row][col] !== "undefined") {
        grid[row][col] = true;
      }
    }
  }
};

const placeWithPreference = (
  grid: OccupiedGrid,
  candidate: LayoutInput
): BlockLayout | null => {
  const w = clampSize(candidate.w);
  const h = clampSize(candidate.h);
  const x = clampCoordinate(candidate.x, GRID_COLUMNS - 1);
  const y = clampCoordinate(candidate.y, GRID_ROWS - 1);

  if (canPlace(grid, x, y, w, h)) {
    return { id: candidate.id, x, y, w, h };
  }

  return null;
};

const placeFirstFit = (
  grid: OccupiedGrid,
  candidate: LayoutInput
): BlockLayout | null => {
  const w = clampSize(candidate.w);
  const h = clampSize(candidate.h);

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLUMNS; col += 1) {
      if (canPlace(grid, col, row, w, h)) {
        return { id: candidate.id, x: col, y: row, w, h };
      }
    }
  }

  // 최후 수단: 1x1로 축소해서라도 배치
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLUMNS; col += 1) {
      if (canPlace(grid, col, row, MIN_SIZE, MIN_SIZE)) {
        return { id: candidate.id, x: col, y: row, w: MIN_SIZE, h: MIN_SIZE };
      }
    }
  }

  return null;
};

/**
 * 4×4 Bento 그리드에서 블록 위치를 계산한다.
 * - 우선 기존 x,y가 유효하고 비어 있으면 그 위치를 사용한다.
 * - 충돌/경계 위반 시 첫 번째 가용 슬롯에 배치한다.
 * - w,h는 1~2로 클램프한다.
 */
export const deriveLayoutMap = (
  blocks: LayoutInput[]
): Map<string, BlockLayout> => {
  const occupied = createOccupiedGrid();
  const layout = new Map<string, BlockLayout>();
  const fallbackQueue: LayoutInput[] = [];

  blocks.forEach((block) => {
    const preferred = placeWithPreference(occupied, block);
    if (preferred) {
      layout.set(block.id, preferred);
      occupy(occupied, preferred.x, preferred.y, preferred.w, preferred.h);
    } else {
      fallbackQueue.push(block);
    }
  });

  fallbackQueue.forEach((block) => {
    const placed = placeFirstFit(occupied, block);
    if (placed) {
      layout.set(block.id, placed);
      occupy(occupied, placed.x, placed.y, placed.w, placed.h);
    }
  });

  return layout;
};

export const buildLayoutPayload = (
  blocks: LayoutInput[],
  layoutMap: Map<string, BlockLayout>
): BlockLayout[] =>
  blocks.map((block) => {
    const placement = layoutMap.get(block.id);
    if (!placement) {
      return {
        id: block.id,
        x: 0,
        y: 0,
        w: clampSize(block.w),
        h: clampSize(block.h),
      };
    }
    return placement;
  });

export const sortByLayout = (layouts: BlockLayout[]): BlockLayout[] =>
  [...layouts].sort((a, b) => {
    const rowDiff = a.y - b.y;
    if (rowDiff !== 0) return rowDiff;
    const colDiff = a.x - b.x;
    if (colDiff !== 0) return colDiff;
    return a.id.localeCompare(b.id);
  });
