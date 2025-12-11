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
import type { BlockLayout } from "@/service/blocks/block-layout";
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
  onLayoutChange?: (layout: BlockLayout[]) => void;
  disableReorder?: boolean;
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

  const sortedItems = useMemo(() => {
    const clone = [...items];
    return clone.sort((a, b) => {
      if (isPersistedBlock(a) && isPersistedBlock(b)) {
        const aOrder =
          typeof a.block.ordering === "number" ? a.block.ordering : Number.MAX_SAFE_INTEGER;
        const bOrder =
          typeof b.block.ordering === "number" ? b.block.ordering : Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const aCreated = a.block.created_at ?? "";
        const bCreated = b.block.created_at ?? "";
        return aCreated.localeCompare(bCreated);
      }
      if (isPersistedBlock(a)) return -1;
      if (isPersistedBlock(b)) return 1;
      return 0;
    });
  }, [items]);

  const persistedIds = useMemo(
    () =>
      new Set(
        sortedItems
          .filter(isPersistedBlock)
          .map((item) => item.block.id)
      ),
    [sortedItems]
  );

  const layoutInputs = useMemo(() => toLayoutInputs(sortedItems), [sortedItems]);

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
      <div className="w-[420px] xl:w-[800px] shrink-0 transition-all duration-300 mx-auto xl:mx-0">
        <ProfileGrid
          layouts={layouts}
          isEditable={isEditable}
          onLayoutChange={handleLayoutChange}
          onDragStop={(layout) => handleLayoutCommit(layout, layouts)}
          onBreakpointChange={handleBreakpointChange}
        >
          {sortedItems.map((item) => {
            const key = isPersistedBlock(item) ? item.block.id : item.id;
            const layout = layoutLookup.get(key);
            const isDeleting = isPersistedBlock(item)
              ? deletingBlockIds?.has(item.block.id)
              : false;

            return (
              <div key={key} className="w-full h-full">
                <PageBlockCard
                  item={item}
                  handle={handle}
                  isOwner={isOwner}
                  isEditable={isEditable}
                  layout={layout}
                  dragGuardHandlers={dragGuardHandlers}
                  isDeleting={isDeleting}
                  onDeleteBlock={onDeleteBlock}
                  onResize={(size) => handleResize(key, size)}
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
