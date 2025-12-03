"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { BlockWithDetails } from "@/types/block";
import type { BlockType } from "@/config/block-registry";
import type { PageHandle, PageId, ProfileOwnership } from "@/types/profile";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BlockRegistryPanel } from "@/components/layout/block-registry";
import { PageBlocks } from "@/components/profile/page-blocks";
import { toastManager } from "@/components/ui/toast";
import { useSaveStatus } from "@/components/profile/save-status-context";
import { blockQueryOptions } from "@/service/blocks/block-query-options";
import { BlockEnvProvider } from "@/hooks/use-block-env";

type BlockItem =
  | { kind: "persisted"; block: BlockWithDetails }
  | { kind: "placeholder"; id: string; type: BlockType };

const isPersistedBlockItem = (
  item: BlockItem
): item is { kind: "persisted"; block: BlockWithDetails } =>
  item.kind === "persisted";

const isPlaceholderBlockItem = (
  item: BlockItem
): item is { kind: "placeholder"; id: string; type: BlockType } =>
  item.kind === "placeholder";

type ProfileBlocksClientProps = ProfileOwnership & {
  initialBlocks: BlockWithDetails[];
  handle: PageHandle;
  pageId: PageId;
  supabase: SupabaseClient;
  userId: string | null;
};

export const ProfileBlocksClient = ({
  initialBlocks,
  handle,
  pageId,
  isOwner,
  supabase,
  userId,
}: ProfileBlocksClientProps) => {
  const [items, setItems] = useState<BlockItem[]>(
    initialBlocks.map((block) => ({ kind: "persisted", block }))
  );
  const [deletingBlockIds, setDeletingBlockIds] = useState<Set<string>>(
    () => new Set()
  );
  const queryClient = useQueryClient();
  const { setStatus } = useSaveStatus();
  const createBlockMutation = useMutation(
    blockQueryOptions.create({ pageId, handle, queryClient, supabase, userId })
  );
  const deleteBlockMutation = useMutation(
    blockQueryOptions.delete({ handle, queryClient, supabase, userId })
  );
  const reorderBlocksMutation = useMutation(
    blockQueryOptions.reorder({ pageId, handle, queryClient, supabase, userId })
  );
  const isReordering = reorderBlocksMutation.isPending;

  const handleAddPlaceholder = useCallback(
    (type: BlockType) => {
      if (!isOwner) return;
      const tempId = crypto.randomUUID();
      setItems((prev) => [...prev, { kind: "placeholder", id: tempId, type }]);
      setStatus("dirty");
    },
    [isOwner, setStatus]
  );

  const handleCancelPlaceholder = useCallback(
    (placeholderId: string) => {
      setItems((prev) =>
        prev.filter(
          (item) => !(item.kind === "placeholder" && item.id === placeholderId)
        )
      );
      setStatus("idle");
    },
    [setStatus]
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      if (!isOwner || deletingBlockIds.has(blockId)) return;

      setDeletingBlockIds((prev) => {
        const next = new Set(prev);
        next.add(blockId);
        return next;
      });
      setStatus("saving");

      void (async () => {
        const toastId = toastManager.add({
          title: "블록 삭제 중…",
          type: "loading",
          timeout: 0,
        });

        try {
          const result = await deleteBlockMutation.mutateAsync({
            blockId,
            handle,
          });

          if (result.status === "error") {
            setStatus("error");
            toastManager.update(toastId, {
              title: "블록 삭제 실패",
              description: result.message,
              type: "error",
            });
            return;
          }

          setItems((prev) =>
            prev.filter(
              (item) =>
                !(item.kind === "persisted" && item.block.id === blockId)
            )
          );
          setStatus("saved");
          toastManager.update(toastId, {
            title: "블록이 삭제되었습니다.",
            type: "success",
          });
        } finally {
          setDeletingBlockIds((prev) => {
            const next = new Set(prev);
            next.delete(blockId);
            return next;
          });
        }
      })();
    },
    [deleteBlockMutation, deletingBlockIds, handle, isOwner, setStatus]
  );

  const handleReorderBlocks = useCallback(
    async ({ active, over }: DragEndEvent) => {
      if (
        !isOwner ||
        !over ||
        active.id === over.id ||
        reorderBlocksMutation.isPending
      )
        return;

      const persistedItems = items.filter(isPersistedBlockItem);
      const activeIndex = persistedItems.findIndex(
        (item) => item.block.id === active.id
      );
      const overIndex = persistedItems.findIndex(
        (item) => item.block.id === over.id
      );

      if (activeIndex === -1 || overIndex === -1) return;

      const placeholderItems = items.filter(isPlaceholderBlockItem);
      const previousItems = items;

      const reorderedPersisted = arrayMove(
        persistedItems,
        activeIndex,
        overIndex
      ).map((item, ordering) => ({
        kind: "persisted" as const,
        block: { ...item.block, ordering },
      }));

      setItems([...reorderedPersisted, ...placeholderItems]);
      setStatus("saving");

      const payload = reorderedPersisted.map(({ block }) => ({
        id: block.id,
        ordering: block.ordering ?? 0,
      }));

      try {
        const result = await reorderBlocksMutation.mutateAsync({
          pageId,
          handle,
          blocks: payload,
        });

        if (result.status === "error") {
          setItems(previousItems);
          setStatus("error");
          toastManager.add({
            title: "순서 변경 실패",
            description: result.message,
            type: "error",
          });
          return;
        }

        setStatus("saved");
      } catch (error) {
        setItems(previousItems);
        setStatus("error");
        const message =
          error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.";
        toastManager.add({
          title: "순서 변경 실패",
          description: message,
          type: "error",
        });
      }
    },
    [handle, isOwner, items, pageId, reorderBlocksMutation, setStatus]
  );

  const handleSavePlaceholder = useCallback(
    async (
      placeholderId: string,
      type: BlockType,
      data: Record<string, unknown>
    ) => {
      if (!isOwner || createBlockMutation.isPending) return;

      setStatus("saving");
      const toastId = toastManager.add({
        title: "블록 생성 중…",
        type: "loading",
        timeout: 0,
      });

      const result = await createBlockMutation.mutateAsync({
        pageId,
        handle,
        type,
        data,
      });

      if (result.status === "error") {
        setStatus("error");
        toastManager.update(toastId, {
          title: "블록 생성 실패",
          description: result.message,
          type: "error",
        });
        return;
      }

      toastManager.update(toastId, {
        title: "블록이 생성되었습니다.",
        type: "success",
      });

      setItems((prev) =>
        prev.map((item) => {
          if (item.kind === "placeholder" && item.id === placeholderId) {
            return {
              kind: "persisted",
              block: result.block,
            };
          }
          return item;
        })
      );
      setStatus("saved");
    },
    [createBlockMutation, handle, isOwner, pageId, setStatus]
  );

  const visibleItems = useMemo(() => items, [items]);

  return (
    <BlockEnvProvider value={{ supabase, userId }}>
      <div className="space-y-3 flex flex-col items-center">
        {isOwner ? (
          <BlockRegistryPanel onSelectBlock={handleAddPlaceholder} />
        ) : null}
        <PageBlocks
          items={visibleItems}
          handle={handle}
          isOwner={isOwner}
          onSavePlaceholder={handleSavePlaceholder}
          onCancelPlaceholder={handleCancelPlaceholder}
          onDeleteBlock={handleDeleteBlock}
          deletingBlockIds={deletingBlockIds}
          onReorder={handleReorderBlocks}
          disableReorder={isReordering}
        />
      </div>
    </BlockEnvProvider>
  );
};
