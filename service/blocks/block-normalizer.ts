import type { BlockKey } from "@/config/block-registry";
import type { BlockWithDetails } from "@/types/block";
import {
  GRID_COLUMNS,
  GRID_ROWS,
  MAX_SIZE,
  MIN_SIZE,
  type BlockLayout,
} from "./block-layout";

const toStringOrNull = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const toNumberOrNull = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const clampSize = (value: number | null | undefined): number => {
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

const sanitizeLayout = (layout: Partial<BlockLayout>): BlockLayout => {
  const w = clampSize(layout.w);
  const h = clampSize(layout.h);
  const x = clampCoordinate(layout.x, GRID_ROWS - 1);
  const y = clampCoordinate(layout.y, GRID_COLUMNS - 1);

  const maxX = Math.min(x, GRID_ROWS - h);
  const maxY = Math.min(y, GRID_COLUMNS - w);

  return {
    id: String(layout.id ?? crypto.randomUUID()),
    x: Math.max(0, maxX),
    y: Math.max(0, maxY),
    w,
    h,
  };
};

const compareByOrdering = (a: BlockWithDetails, b: BlockWithDetails) => {
  const aOrder =
    typeof a.ordering === "number" ? a.ordering : Number.MAX_SAFE_INTEGER;
  const bOrder =
    typeof b.ordering === "number" ? b.ordering : Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) return aOrder - bOrder;
  const aCreated = a.created_at ?? "";
  const bCreated = b.created_at ?? "";
  return aCreated.localeCompare(bCreated);
};

const compareByLayout = (a: BlockWithDetails, b: BlockWithDetails) => {
  const yDiff = a.y - b.y;
  if (yDiff !== 0) return yDiff;
  const xDiff = a.x - b.x;
  if (xDiff !== 0) return xDiff;
  return compareByOrdering(a, b);
};

const toSequentialOrdering = (
  blocks: BlockWithDetails[],
  comparator: (a: BlockWithDetails, b: BlockWithDetails) => number
): BlockWithDetails[] =>
  [...blocks]
    .sort(comparator)
    .map((block, index) => ({ ...block, ordering: index }));

/**
 * BlockWithDetails 배열의 ordering을 0부터 연속된 값으로 재정렬한다.
 * - 기본 정렬은 ordering→created_at이며, 다른 comparator를 주입해 커스터마이즈할 수 있다.
 */
export const resequenceBlocks = (
  blocks: BlockWithDetails[],
  comparator: (a: BlockWithDetails, b: BlockWithDetails) => number = compareByOrdering
): BlockWithDetails[] => toSequentialOrdering(blocks, comparator);

type RawBlock = Partial<BlockWithDetails> & Record<string, unknown>;

/**
 * Supabase RPC 결과 등 Raw 데이터를 BlockWithDetails로 평탄화한다.
 */
export const toBlockWithDetails = (
  block: RawBlock,
  fallbackOrdering: number
): BlockWithDetails => ({
  id: String(block.id),
  type: block.type as BlockWithDetails["type"],
  ordering:
    typeof block.ordering === "number" ? block.ordering : fallbackOrdering,
  created_at:
    typeof block.created_at === "string"
      ? block.created_at
      : new Date().toISOString(),
  ...pickLayoutFields({
    id: block.id,
    x: toNumberOrNull(block.x),
    y: toNumberOrNull(block.y),
    w: toNumberOrNull(block.w),
    h: toNumberOrNull(block.h),
  }),
  content: toStringOrNull(block.content),
  url: toStringOrNull(block.url),
  title: toStringOrNull(block.title),
  description: toStringOrNull(block.description),
  image_url: toStringOrNull(block.image_url),
  icon_url: toStringOrNull(block.icon_url),
  link_url: toStringOrNull(block.link_url),
  aspect_ratio: toNumberOrNull(block.aspect_ratio),
  thumbnail: toStringOrNull(block.thumbnail),
  lat: toNumberOrNull(block.lat),
  lng: toNumberOrNull(block.lng),
  zoom: toNumberOrNull(block.zoom),
});

/**
 * Block 배열을 BlockWithDetails로 변환하고 ordering을 정규화한다.
 */
export const normalizeBlocks = (
  blocks: RawBlock[]
): BlockWithDetails[] =>
  resequenceBlocks(
    blocks.map((block, index) => toBlockWithDetails(block, index)),
    compareByLayout
  );

const pickBlockDataFields = (
  data: Record<string, unknown>
): Partial<BlockWithDetails> => ({
  content: toStringOrNull(data.content),
  url: toStringOrNull(data.url),
  title: toStringOrNull(data.title),
  description: toStringOrNull(data.description),
  image_url: toStringOrNull(data.image_url),
  icon_url: toStringOrNull(data.icon_url),
  link_url: toStringOrNull(data.link_url),
  aspect_ratio: toNumberOrNull(data.aspect_ratio),
  thumbnail: toStringOrNull(data.thumbnail),
  lat: toNumberOrNull(data.lat),
  lng: toNumberOrNull(data.lng),
  zoom: toNumberOrNull(data.zoom),
});

const pickLayoutFields = (
  data: Partial<BlockLayout>
): Pick<BlockWithDetails, "x" | "y" | "w" | "h"> => {
  const sanitized = sanitizeLayout(data);
  return { x: sanitized.x, y: sanitized.y, w: sanitized.w, h: sanitized.h };
};

/**
 * 낙관적 UI용 BlockWithDetails를 생성한다.
 */
export const createOptimisticBlock = (
  params: {
    type: BlockKey;
    data: Record<string, unknown>;
    currentLength: number;
  }
): BlockWithDetails => ({
  id: crypto.randomUUID(),
  type: params.type,
  ordering: params.currentLength,
  created_at: new Date().toISOString(),
  ...pickLayoutFields({
    x: 0,
    y: 0,
    w: MIN_SIZE,
    h: MIN_SIZE,
  }),
  ...pickBlockDataFields(params.data),
});

/**
 * ordering payload를 기존 블록 목록에 적용하고 정규화한다.
 */
export const applyOrderingPatch = (
  blocks: BlockWithDetails[],
  payload: { id: string; ordering: number }[]
): BlockWithDetails[] => {
  const orderingMap = new Map(payload.map(({ id, ordering }) => [id, ordering]));
  const patched = blocks.map((block) =>
    orderingMap.has(block.id)
      ? { ...block, ordering: orderingMap.get(block.id) ?? block.ordering }
      : block
  );

  return resequenceBlocks(patched);
};

/**
 * 콘텐츠 업데이트 payload를 기존 블록에 병합하고 ordering을 유지한다.
 */
export const applyContentPatch = (
  blocks: BlockWithDetails[],
  params:
    | { type: "text"; blockId: string; content: string }
    | { type: "link"; blockId: string; url: string; title: string }
): BlockWithDetails[] =>
  blocks.map((block) => {
    if (block.id !== params.blockId) return block;
    if (params.type === "text") {
      return { ...block, content: params.content };
    }
    return { ...block, url: params.url, title: params.title };
  });

export type LayoutPatchPayload = BlockLayout[];

export const applyLayoutPatch = (
  blocks: BlockWithDetails[],
  payload: LayoutPatchPayload,
  options?: { preserveOrdering?: boolean }
): BlockWithDetails[] => {
  const layoutMap = new Map(
    payload.map((item, index) => [
      item.id,
      {
        ...pickLayoutFields(item),
        ordering: options?.preserveOrdering ? undefined : index,
      },
    ])
  );

  const patched = blocks.map((block) => {
    const layout = layoutMap.get(block.id);
    if (!layout) return block;
    const next: BlockWithDetails = {
      ...block,
      x: layout.x,
      y: layout.y,
      w: layout.w,
      h: layout.h,
    };
    if (typeof layout.ordering === "number") {
      next.ordering = layout.ordering;
    }
    return next;
  });

  return options?.preserveOrdering ? patched : resequenceBlocks(patched);
};
