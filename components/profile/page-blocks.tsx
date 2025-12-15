"use client";

import { useCallback, useMemo } from "react";
import type { HTMLAttributes } from "react";
import Image from "next/image";
import Link from "next/link";
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
import { ProfileGrid } from "@/components/profile/profile-grid";
import { PageBlockCard } from "@/components/profile/page-block-card";
import { useProfileGridLayout } from "@/components/profile/hooks/use-profile-grid-layout";
import type { BlockKey } from "@/config/block-registry";
import type { ResponsiveBlockLayout } from "@/service/blocks/block-layout";
import {
  isPersistedBlock,
  type ProfileBlockItem,
} from "@/components/profile/types/block-item";
import { toLayoutInputs } from "@/components/profile/utils/block-layout-input";

type DragGuardHandlers = Pick<
  HTMLAttributes<HTMLElement>,
  "onPointerDownCapture" | "onMouseDownCapture" | "onTouchStartCapture"
>;

type PageBlocksProps = {
  items: ProfileBlockItem[];
  handle: string;
  isOwner: boolean;
  onSavePlaceholder: (
    placeholderId: string,
    type: BlockKey,
    data: Record<string, unknown>
  ) => void;
  onCancelPlaceholder: (placeholderId: string) => void;
  onDeleteBlock?: (blockId: string) => void;
  deletingBlockIds?: Set<string>;
  onLayoutChange?: (layout: ResponsiveBlockLayout[]) => void;
  disableReorder?: boolean;
};

type ProfileBlockEntry = { item: ProfileBlockItem; index: number };

const resolveLayoutId = (entry: ProfileBlockEntry): string => {
  if (isPersistedBlock(entry.item)) {
    return entry.item.block.id
      ? String(entry.item.block.id)
      : String(entry.index);
  }
  return entry.item.id;
};

const useDragGuardHandlers = (): DragGuardHandlers => {
  const stopPropagation = useCallback((event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  }, []);

  return useMemo(
    () => ({
      onPointerDownCapture: stopPropagation,
      onMouseDownCapture: stopPropagation,
      onTouchStartCapture: stopPropagation,
    }),
    [stopPropagation]
  );
};

export default function PageBlocks ({
  items,
  handle,
  isOwner,
  onSavePlaceholder,
  onCancelPlaceholder,
  onDeleteBlock,
  deletingBlockIds,
  onLayoutChange,
  disableReorder,
}: PageBlocksProps) {
  const isEditable = isOwner && !disableReorder;
  const dragGuardHandlers = useDragGuardHandlers();

  const layoutInputs = useMemo(() => toLayoutInputs(items), [items]);
  const itemsWithIndex = useMemo<ProfileBlockEntry[]>(
    () => items.map((item, index) => ({ item, index })),
    [items]
  );
  const itemsWithId = useMemo(
    () =>
      itemsWithIndex.map((entry) => ({
        ...entry,
        id: resolveLayoutId(entry),
      })),
    [itemsWithIndex]
  );

  const persistedIds = useMemo(
    () =>
      new Set(
        itemsWithId
          .filter(({ item }) => isPersistedBlock(item))
          .map(({ id }) => id)
      ),
    [itemsWithId]
  );

  const {
    layouts,
    layoutLookup,
    handleLayoutChange,
    handleLayoutCommit,
    handleBreakpointChange,
    handleResize,
  } = useProfileGridLayout({
    layoutInputs,
    persistedIds,
    isEditable,
    onCommit: onLayoutChange,
  });

  const sortedEntries = useMemo(() => {
    const clone = [...itemsWithId];
    return clone
      .sort((a, b) => {
        const aLayout = layoutLookup.get(a.id);
        const bLayout = layoutLookup.get(b.id);

        if (aLayout && bLayout) {
          const rowDiff = aLayout.y - bLayout.y;
          if (rowDiff !== 0) return rowDiff;
          const colDiff = aLayout.x - bLayout.x;
          if (colDiff !== 0) return colDiff;
          return aLayout.i.localeCompare(bLayout.i);
        }

        if (aLayout) return -1;
        if (bLayout) return 1;
        return 0;
      });
  }, [itemsWithId, layoutLookup]);

  const handleSavePlaceholder = useCallback(
    (placeholderId: string, type: BlockKey, data: Record<string, unknown>) => {
      onSavePlaceholder(placeholderId, type, data);
    },
    [onSavePlaceholder]
  );

  const handleCancelPlaceholder = useCallback(
    (placeholderId: string) => {
      onCancelPlaceholder(placeholderId);
    },
    [onCancelPlaceholder]
  );

  if (!items.length) {
    return (
      <Item
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
            <Button size={"sm"}>
              <Link href={"/"}>돌아가기</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Item>
    );
  }

  return (
    <section className="space-y-3 w-full">
      <div className="w-[457px] xl:w-[878px] shrink-0 transition-all duration-300 mx-auto xl:mx-0">
        <ProfileGrid
          layouts={layouts}
          isEditable={isEditable}
          onLayoutChange={handleLayoutChange}
          onDragStop={(layout) => handleLayoutCommit(layout, layouts)}
          onBreakpointChange={handleBreakpointChange}
        >
          {sortedEntries.map(({ item, id }) => {
            const layout = layoutLookup.get(id);
            const persistedId = isPersistedBlock(item) ? item.block.id : null;
            const isDeleting = persistedId
              ? deletingBlockIds?.has(persistedId) ?? false
              : false;

            return (
              <div key={id} className="w-full h-full">
                <PageBlockCard
                  item={item}
                  handle={handle}
                  isOwner={isOwner}
                  isEditable={isEditable}
                  layout={layout}
                  dragGuardHandlers={dragGuardHandlers}
                  isDeleting={isDeleting}
                  onDeleteBlock={onDeleteBlock}
                  onResize={(size) => handleResize(id, size)}
                  onSavePlaceholder={handleSavePlaceholder}
                  onCancelPlaceholder={handleCancelPlaceholder}
                />
              </div>
            );
          })}
        </ProfileGrid>
      </div>
    </section>
  );
};
