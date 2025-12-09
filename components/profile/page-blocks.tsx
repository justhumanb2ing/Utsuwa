/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import {
  Responsive,
  type Layout,
  type Layouts,
} from "react-grid-layout";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import type { BlockWithDetails } from "@/types/block";
import type { BlockType } from "@/config/block-registry";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Item } from "@/components/ui/item";
import {
  LinkBlockEditor,
  TextBlockEditor,
} from "@/components/profile/block-editors";
import { useSaveStatus } from "@/components/profile/save-status-context";
import { cn } from "@/lib/utils";
import {
  CANONICAL_BREAKPOINT,
  GRID_BREAKPOINTS,
  GRID_RESPONSIVE_COLUMNS,
  GRID_ROW_HEIGHT,
  GRID_ROWS,
  MAX_SIZE,
  MIN_SIZE,
  type BlockLayout,
  type GridBreakpoint,
  deriveLayoutMap,
} from "@/service/blocks/block-layout";

type PlaceholderBlock = { kind: "placeholder"; id: string; type: BlockType };
type PersistedBlock = { kind: "persisted"; block: BlockWithDetails };

type BlockItem = PlaceholderBlock | PersistedBlock;

type DragGuardHandlers = Pick<
  HTMLAttributes<HTMLElement>,
  "onPointerDownCapture" | "onMouseDownCapture" | "onTouchStartCapture"
>;

type PageBlocksProps = {
  items: BlockItem[];
  handle: string;
  isOwner: boolean;
  onSavePlaceholder: (
    placeholderId: string,
    type: BlockType,
    data: Record<string, unknown>
  ) => void;
  onCancelPlaceholder: (placeholderId: string) => void;
  onDeleteBlock?: (blockId: BlockWithDetails["id"]) => void;
  deletingBlockIds?: Set<BlockWithDetails["id"]>;
  onLayoutChange?: (layout: BlockLayout[]) => void;
  disableReorder?: boolean;
};

const BREAKPOINT_KEYS = Object.keys(
  GRID_RESPONSIVE_COLUMNS
) as GridBreakpoint[];
const DRAG_CANCEL_SELECTOR =
  "input,textarea,button,a,select,option,[data-no-drag]";
const DEFAULT_MARGIN: [number, number] = [32, 32];
const DEFAULT_PADDING: [number, number] = [0, 0];

const extractLinkData = (
  block?: BlockWithDetails
): { url?: string | null; title?: string | null } => {
  if (!block) return {};
  return {
    url: block.url ?? null,
    title: block.title ?? null,
  };
};

const extractTextData = (
  block?: BlockWithDetails
): { content?: string | null } => {
  if (!block) return {};
  return {
    content: block.content ?? null,
  };
};

const clampSpan = (value: number | null | undefined, max: number): number => {
  const resolvedMax = Math.max(Math.floor(max), MIN_SIZE);
  const normalized =
    typeof value === "number" && !Number.isNaN(value)
      ? Math.max(Math.round(value), MIN_SIZE)
      : MIN_SIZE;
  return Math.min(normalized, Math.min(resolvedMax, MAX_SIZE));
};

const clampCoordinate = (
  value: number | null | undefined,
  maxIndex: number
): number => {
  const resolvedMax = Math.max(Math.floor(maxIndex), 0);
  const normalized =
    typeof value === "number" && !Number.isNaN(value)
      ? Math.floor(value)
      : 0;
  return Math.min(Math.max(normalized, 0), resolvedMax);
};

const toLayoutId = (item: BlockItem): string =>
  item.kind === "persisted" ? item.block.id : item.id;

const toCanonicalLayout = (items: BlockItem[]): Layout[] => {
  const canonicalColumns = GRID_RESPONSIVE_COLUMNS[CANONICAL_BREAKPOINT];
  const layoutInputs = items.map((item, index) => {
    if (item.kind === "persisted") {
      const { block } = item;
      return {
        id: block.id,
        x: block.x ?? 0,
        y: block.y ?? index,
        w: block.w ?? MIN_SIZE,
        h: block.h ?? MIN_SIZE,
      };
    }
    return {
      id: item.id,
      x: 0,
      y: index,
      w: MIN_SIZE,
      h: MIN_SIZE,
    };
  });

  const layoutMap = deriveLayoutMap(layoutInputs);

  return layoutInputs.map((input, index) => {
    const placement = layoutMap.get(input.id);
    const w = clampSpan(placement?.w ?? input.w, canonicalColumns);
    const h = clampSpan(placement?.h ?? input.h, MAX_SIZE);
    const maxX = canonicalColumns - w;
    const maxY = GRID_ROWS - h;

    return {
      i: input.id,
      x: clampCoordinate(placement?.x ?? input.x, maxX),
      y: clampCoordinate(placement?.y ?? index, maxY),
      w,
      h,
      isDraggable: true,
      isResizable: false,
      static: false,
    };
  });
};

const buildLayoutItem = (
  item: BlockItem,
  columns: number,
  fallbackIndex: number,
  isEditable: boolean
): Layout => {
  const block = item.kind === "persisted" ? item.block : undefined;
  const width = clampSpan(block?.w, columns);
  const height = clampSpan(block?.h, MAX_SIZE);
  const maxX = columns - width;
  const maxY = GRID_ROWS - height;
  const fallbackY = block?.y ?? fallbackIndex;

  return {
    i: toLayoutId(item),
    x: clampCoordinate(block?.x, maxX),
    y: clampCoordinate(fallbackY, maxY),
    w: width,
    h: height,
    isDraggable: isEditable,
    isResizable: false,
    static: !isEditable,
  };
};

const normalizeLayoutEntry = (
  entry: Layout,
  columns: number,
  fallbackIndex: number,
  isEditable: boolean
): Layout => {
  const width = clampSpan(entry.w, columns);
  const height = clampSpan(entry.h, MAX_SIZE);
  const maxX = columns - width;
  const maxY = GRID_ROWS - height;
  const fallbackY =
    typeof entry.y === "number" && !Number.isNaN(entry.y)
      ? entry.y
      : fallbackIndex;

  return {
    ...entry,
    x: clampCoordinate(entry.x, maxX),
    y: clampCoordinate(fallbackY, maxY),
    w: width,
    h: height,
    isDraggable: isEditable,
    isResizable: false,
    static: !isEditable,
  };
};

const synchronizeLayouts = (
  sourceLayouts: Layouts,
  canonicalLayout: Layout[],
  items: BlockItem[],
  isEditable: boolean
): Layouts => {
  const nextLayouts: Layouts = {};
  const canonicalMap = new Map(canonicalLayout.map((entry) => [entry.i, entry]));

  BREAKPOINT_KEYS.forEach((breakpoint) => {
    const columns = GRID_RESPONSIVE_COLUMNS[breakpoint];
    const existing = sourceLayouts[breakpoint] ?? [];
    const existingMap = new Map(existing.map((layout) => [layout.i, layout]));

    nextLayouts[breakpoint] = items.map((item, index) => {
      const id = toLayoutId(item);
      const base =
        existingMap.get(id) ??
        canonicalMap.get(id) ??
        buildLayoutItem(item, columns, index, isEditable);
      return normalizeLayoutEntry(base, columns, index, isEditable);
    });
  });

  return nextLayouts;
};

const buildResponsiveLayouts = (
  canonicalLayout: Layout[],
  items: BlockItem[],
  isEditable: boolean
): Layouts => synchronizeLayouts({}, canonicalLayout, items, isEditable);

const resolveBreakpoint = (width: number): GridBreakpoint => {
  const sorted = [...BREAKPOINT_KEYS].sort(
    (a, b) => GRID_BREAKPOINTS[b] - GRID_BREAKPOINTS[a]
  );
  const match = sorted.find((key) => width >= GRID_BREAKPOINTS[key]);
  return match ?? "xs";
};

const computeRowHeight = (
  width: number,
  breakpoint: GridBreakpoint
): number => {
  const cols = GRID_RESPONSIVE_COLUMNS[breakpoint];
  const [paddingX] = DEFAULT_PADDING;
  const [marginX] = DEFAULT_MARGIN;
  const columnWidth =
    (width - paddingX * 2 - marginX * (cols - 1)) / cols || GRID_ROW_HEIGHT;
  return Math.max(Math.floor(columnWidth), MIN_SIZE);
};

const pickCanonicalLayout = (
  layouts: Layouts,
  preferredBreakpoint?: GridBreakpoint
): Layout[] => {
  if (preferredBreakpoint && layouts[preferredBreakpoint]?.length) {
    return layouts[preferredBreakpoint];
  }

  if (layouts[CANONICAL_BREAKPOINT]?.length) {
    return layouts[CANONICAL_BREAKPOINT];
  }

  const fallback = BREAKPOINT_KEYS.map((key) => layouts[key]).find(
    (layout) => layout && layout.length
  );
  return fallback ?? [];
};

const extractLayoutPayload = (
  layouts: Layouts,
  persistedIds: Set<string>,
  preferredBreakpoint?: GridBreakpoint
): BlockLayout[] => {
  const canonicalLayout = pickCanonicalLayout(layouts, preferredBreakpoint);
  const breakpointForPayload =
    preferredBreakpoint ?? CANONICAL_BREAKPOINT;
  const columnsForPayload = GRID_RESPONSIVE_COLUMNS[breakpointForPayload];

  return canonicalLayout
    .filter((item) => persistedIds.has(item.i))
    .map((item) => {
      const width = clampSpan(item.w, columnsForPayload);
      const height = clampSpan(item.h, MAX_SIZE);
      const maxX = columnsForPayload - width;
      const maxY = GRID_ROWS - height;

      return {
        id: item.i,
        x: clampCoordinate(item.x, maxX),
        y: clampCoordinate(item.y, maxY),
        w: width,
        h: height,
      };
    });
};

export const PageBlocks = ({
  items,
  handle,
  isOwner,
  onSavePlaceholder,
  onCancelPlaceholder,
  onDeleteBlock,
  deletingBlockIds,
  onLayoutChange,
  disableReorder,
}: PageBlocksProps) => {
  const { setStatus } = useSaveStatus();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() =>
    typeof window === "undefined" ? GRID_BREAKPOINTS.xs : window.innerWidth
  );
  const [currentBreakpoint, setCurrentBreakpoint] = useState<GridBreakpoint>(() =>
    resolveBreakpoint(typeof window === "undefined" ? GRID_BREAKPOINTS.xs : window.innerWidth)
  );
  const [rowHeight, setRowHeight] = useState<number>(() => {
    const initialWidth =
      typeof window === "undefined" ? GRID_BREAKPOINTS.xs : window.innerWidth;
    const initialBreakpoint = resolveBreakpoint(initialWidth);
    return computeRowHeight(initialWidth, initialBreakpoint);
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const updateWidth = () => {
      const nextWidth = node.getBoundingClientRect().width;
      if (nextWidth > 0) {
        setContainerWidth(nextWidth);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(node);

    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const breakpoint = resolveBreakpoint(containerWidth);
    setCurrentBreakpoint(breakpoint);
    setRowHeight(computeRowHeight(containerWidth, breakpoint));
  }, [containerWidth]);
  const isEditable = isOwner && !disableReorder;
  const stopEventPropagation = useCallback(
    (event: { stopPropagation: () => void }) => {
      event.stopPropagation();
    },
    []
  );
  const dragGuardHandlers: DragGuardHandlers = useMemo(
    () => ({
      onPointerDownCapture: stopEventPropagation,
      onMouseDownCapture: stopEventPropagation,
      onTouchStartCapture: stopEventPropagation,
    }),
    [stopEventPropagation]
  );

  const sortedBlocks = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.kind === "persisted" && b.kind === "persisted") {
          const aOrder = a.block.ordering;
          const bOrder = b.block.ordering;
          if (aOrder === null && bOrder === null) {
            return (
              new Date(a.block.created_at ?? 0).getTime() -
              new Date(b.block.created_at ?? 0).getTime()
            );
          }
          if (aOrder === null) return 1;
          if (bOrder === null) return -1;
          return aOrder - bOrder;
        }
        if (a.kind === "persisted") return -1;
        if (b.kind === "persisted") return 1;
        return 0;
      }),
    [items]
  );

  const persistedBlockIds = useMemo(
    () =>
      new Set(
        sortedBlocks
          .filter(
            (item): item is PersistedBlock => item.kind === "persisted"
          )
          .map((item) => item.block.id)
      ),
    [sortedBlocks]
  );

  const canonicalLayout = useMemo(
    () => toCanonicalLayout(sortedBlocks),
    [sortedBlocks]
  );

  const [layouts, setLayouts] = useState<Layouts>(() =>
    buildResponsiveLayouts(canonicalLayout, sortedBlocks, isEditable)
  );
  const layoutsRef = useRef<Layouts>(layouts);

  useEffect(() => {
    const nextLayouts = synchronizeLayouts(
      layoutsRef.current,
      canonicalLayout,
      sortedBlocks,
      isEditable
    );
    layoutsRef.current = nextLayouts;
    setLayouts(nextLayouts);
  }, [canonicalLayout, isEditable, sortedBlocks]);

  const handleLayoutChangeInternal = useCallback(
    (_currentLayout: Layout[], allLayouts: Layouts) => {
      const normalized = synchronizeLayouts(
        allLayouts,
        canonicalLayout,
        sortedBlocks,
        isEditable
      );
      layoutsRef.current = normalized;
      setLayouts(normalized);
    },
    [canonicalLayout, isEditable, sortedBlocks]
  );

  const commitLayoutChange = useCallback(() => {
    if (!isEditable || !onLayoutChange) return;
    const payload = extractLayoutPayload(
      layoutsRef.current,
      persistedBlockIds,
      currentBreakpoint
    );
    if (!payload.length) return;
    onLayoutChange(payload);
  }, [currentBreakpoint, isEditable, onLayoutChange, persistedBlockIds]);

  const renderBlockCard = (item: BlockItem) => {
    const isPlaceholder = item.kind === "placeholder";
    const block = item.kind === "persisted" ? item.block : undefined;
    const type = item.kind === "persisted" ? item.block.type : item.type;
    const blockId = block?.id;
    const isDeleting = Boolean(blockId && deletingBlockIds?.has(blockId));

    return (
      <div
        className={cn(
          "group relative h-full rounded-3xl border p-2 shadow-sm min-h-32 flex flex-col transition-shadow bg-background",
          isEditable ? "cursor-grab active:cursor-grabbing" : ""
        )}
      >
        {isOwner && blockId ? (
          <Button
            type="button"
            size={"icon-sm"}
            variant={"outline"}
            className={cn(
              "absolute -right-3 -top-3 rounded-full transition-opacity",
              isDeleting ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            aria-label="블록 삭제"
            disabled={isDeleting}
            onClick={() => onDeleteBlock?.(blockId)}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-4" aria-hidden />
            )}
          </Button>
        ) : null}
        <div className="flex-1 space-y-3 h-full flex flex-col">
          {(() => {
            switch (type) {
              case "link":
                return (
                  <LinkBlockEditor
                    className="flex-1"
                    dragGuardHandlers={dragGuardHandlers}
                    mode={isPlaceholder ? "placeholder" : "persisted"}
                    blockId={blockId}
                    handle={handle}
                    isOwner={isOwner}
                    data={extractLinkData(block)}
                    onSavePlaceholder={
                      isPlaceholder
                        ? (data) => {
                            setStatus("dirty");
                            onSavePlaceholder(item.id, "link", data);
                          }
                        : undefined
                    }
                    onCancelPlaceholder={
                      isPlaceholder
                        ? () => onCancelPlaceholder(item.id)
                        : undefined
                    }
                  />
                );
              case "text":
                return (
                  <TextBlockEditor
                    className="flex-1"
                    dragGuardHandlers={dragGuardHandlers}
                    mode={isPlaceholder ? "placeholder" : "persisted"}
                    blockId={blockId}
                    handle={handle}
                    isOwner={isOwner}
                    data={extractTextData(block)}
                    onSavePlaceholder={
                      isPlaceholder
                        ? (data) => {
                            setStatus("dirty");
                            onSavePlaceholder(item.id, "text", data);
                          }
                        : undefined
                    }
                    onCancelPlaceholder={
                      isPlaceholder
                        ? () => onCancelPlaceholder(item.id)
                        : undefined
                    }
                  />
                );
              case "image":
                return (
                  <p className="text-xs text-muted-foreground">
                    이미지 블록은 업로드 이후에 렌더링됩니다.
                  </p>
                );
              case "video":
                return (
                  <p className="text-xs text-muted-foreground">
                    비디오 블록은 업로드 이후에 렌더링됩니다.
                  </p>
                );
              default:
                return (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      해당 블록 타입에 대한 UI가 아직 준비되지 않았습니다.
                    </p>
                    {isPlaceholder ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCancelPlaceholder(item.id)}
                      >
                        취소
                      </Button>
                    ) : null}
                  </div>
                );
            }
          })()}
        </div>
      </div>
    );
  };

  if (!items.length) {
    return (
      <Item
        asChild
        className="flex flex-col items-center space-y-3 max-w-sm text-center font-medium p-0 border-none bg-transparent shadow-none"
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <div className="size-32 rounded-full overflow-hidden">
                <Image
                  src={"/sprite-animation.gif"}
                  alt="There's no data."
                  width={200}
                  height={200}
                  className="object-cover w-full h-full grayscale"
                  unoptimized
                />
              </div>
            </EmptyMedia>
            <EmptyTitle>이곳은 여전히 고요합니다.</EmptyTitle>
            <EmptyDescription>
              비어 있음은 결핍이 아니라, 당신이 채울 가능성들이 아직 이름을 얻지
              않았다는 신호일지 모릅니다.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size={"sm"}>
              <Link href={"/"}>돌아가기</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Item>
    );
  }

  return (
    <section className="space-y-3 w-full">
      <div className="flex">
        <div ref={containerRef} className="w-full">
          <Responsive
            width={containerWidth}
            className="w-full"
            layouts={layouts}
            breakpoints={GRID_BREAKPOINTS}
            cols={GRID_RESPONSIVE_COLUMNS}
            rowHeight={rowHeight}
            containerPadding={DEFAULT_PADDING}
            margin={DEFAULT_MARGIN}
            isDraggable={isEditable}
            isResizable={false}
            compactType="vertical"
            draggableCancel={DRAG_CANCEL_SELECTOR}
            onLayoutChange={handleLayoutChangeInternal}
            onDragStop={commitLayoutChange}
            onResizeStop={commitLayoutChange}
          >
            {sortedBlocks.map((item) => {
              const key = item.kind === "persisted" ? item.block.id : item.id;
              return (
                <div key={key} className="w-full h-full">
                  {renderBlockCard(item)}
                </div>
              );
            })}
          </Responsive>
        </div>
      </div>
    </section>
  );
};
