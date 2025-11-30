"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { BlockWithDetails } from "@/types/block";
import type { BlockType } from "@/config/block-registry";
import { BlockRegistryPanel } from "@/components/layout/block-registry";
import { PageBlocks } from "@/components/profile/page-blocks";
import { toastManager } from "@/components/ui/toast";

type BlockItem =
  | { kind: "persisted"; block: BlockWithDetails }
  | { kind: "placeholder"; id: string; type: BlockType };

type ProfileBlocksClientProps = {
  initialBlocks: BlockWithDetails[];
  handle: string;
  pageId: string;
  isOwner: boolean;
};

const requestCreateBlock = async (params: {
  pageId: string;
  handle: string;
  type: BlockType;
  data: Record<string, unknown>;
}): Promise<{ status: "success"; block: BlockWithDetails } | { status: "error"; message: string }> => {
  const response = await fetch("/api/profile/block", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.status === "error") {
    return {
      status: "error",
      message:
        body?.message ??
        body?.reason ??
        "블록을 생성하지 못했습니다.",
    };
  }

  return { status: "success", block: body.block as BlockWithDetails };
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
  const [isPending, startTransition] = useTransition();

  const handleAddPlaceholder = useCallback(
    (type: BlockType) => {
      if (!isOwner) return;
      const tempId = crypto.randomUUID();
      setItems((prev) => [...prev, { kind: "placeholder", id: tempId, type }]);
    },
    [isOwner]
  );

  const handleCancelPlaceholder = useCallback((placeholderId: string) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.kind === "placeholder" && item.id === placeholderId)
      )
    );
  }, []);

  const handleSavePlaceholder = useCallback(
    (placeholderId: string, type: BlockType, data: Record<string, unknown>) => {
      if (!isOwner || isPending) return;

      startTransition(async () => {
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
              return { kind: "persisted", block: result.block };
            }
            return item;
          })
        );
      });
    },
    [handle, isOwner, isPending, pageId]
  );

  const visibleItems = useMemo(() => items, [items]);
  return (
    <div className="space-y-6">
      {isOwner ? (
        <BlockRegistryPanel onSelectBlock={handleAddPlaceholder} />
      ) : null}
      <PageBlocks
        items={visibleItems}
        handle={handle}
        isOwner={isOwner}
        onSavePlaceholder={handleSavePlaceholder}
        onCancelPlaceholder={handleCancelPlaceholder}
      />
    </div>
  );
};
