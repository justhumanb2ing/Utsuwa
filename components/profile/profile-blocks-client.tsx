"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { BlockWithDetails } from "@/types/block";
import type { BlockType } from "@/config/block-registry";
import type { PageHandle, PageId, ProfileOwnership } from "@/types/profile";
import { BlockRegistryPanel } from "@/components/layout/block-registry";
import { PageBlocks } from "@/components/profile/page-blocks";
import { toastManager } from "@/components/ui/toast";
import { useSaveStatus } from "@/components/profile/save-status-context";
import { requestCreateBlock } from "@/service/blocks/create-block";
import { requestDeleteBlock } from "@/service/blocks/delete-block";

type BlockItem =
  | { kind: "persisted"; block: BlockWithDetails }
  | { kind: "placeholder"; id: string; type: BlockType };

type ProfileBlocksClientProps = ProfileOwnership & {
  initialBlocks: BlockWithDetails[];
  handle: PageHandle;
  pageId: PageId;
};

export const ProfileBlocksClient = ({
  initialBlocks,
  handle,
  pageId,
  isOwner,
}: ProfileBlocksClientProps) => {
  const [items, setItems] = useState<BlockItem[]>(
    initialBlocks.map((block) => ({ kind: "persisted", block }))
  );
  const [deletingBlockIds, setDeletingBlockIds] = useState<Set<string>>(
    () => new Set()
  );
  const [isPending, startTransition] = useTransition();
  const { setStatus } = useSaveStatus();

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
          const result = await requestDeleteBlock({ blockId, handle });

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
    [deletingBlockIds, handle, isOwner, setStatus]
  );

  const handleSavePlaceholder = useCallback(
    (placeholderId: string, type: BlockType, data: Record<string, unknown>) => {
      if (!isOwner || isPending) return;

      startTransition(async () => {
        setStatus("saving");
        const toastId = toastManager.add({
          title: "블록 생성 중…",
          type: "loading",
          timeout: 0,
        });

        const result = await requestCreateBlock({
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
      });
    },
    [handle, isOwner, isPending, pageId, setStatus]
  );

  const visibleItems = useMemo(() => items, [items]);

  return (
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
      />
    </div>
  );
};
