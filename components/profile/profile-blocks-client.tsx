"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { BlockWithDetails } from "@/types/block";
import type { BlockType } from "@/config/block-registry";
import type {
  PageHandle,
  PageId,
  ProfileBffPayload,
  ProfileOwnership,
} from "@/types/profile";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BlockRegistryPanel } from "@/components/layout/block-registry";
import { PageBlocks } from "@/components/profile/page-blocks";
import type {
  PlaceholderBlock,
  ProfileBlockItem,
} from "@/components/profile/types/block-item";
import { toastManager } from "@/components/ui/toast";
import { useSaveStatus } from "@/components/profile/save-status-context";
import { blockQueryOptions } from "@/service/blocks/block-query-options";
import { profileQueryOptions } from "@/service/profile/profile-query-options";
import { BlockEnvProvider } from "@/hooks/use-block-env";
import { type BlockLayout } from "@/service/blocks/block-layout";
import { applyLayoutPatch } from "@/service/blocks/block-normalizer";

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
  supabase,
  userId,
}: ProfileBlocksClientProps) => {
  const [placeholders, setPlaceholders] = useState<PlaceholderBlock[]>([]);
  const [deletingBlockIds, setDeletingBlockIds] = useState<Set<string>>(
    () => new Set()
  );
  const layoutDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const latestLayoutRef = useRef<BlockLayout[] | null>(null);
  const queryClient = useQueryClient();
  const { setStatus } = useSaveStatus();
  const { data: profile } = useSuspenseQuery(
    profileQueryOptions.byHandle({ supabase, handle, userId })
  );
  const isOwner = profile.isOwner;
  const persistedBlocks = profile.blocks;
  const blockEnvValue = useMemo(
    () => ({ supabase, userId }),
    [supabase, userId]
  );
  const createBlockMutation = useMutation(
    blockQueryOptions.create({
      pageId,
      handle,
      queryClient,
      supabase,
      userId,
      callbacks: {
        onMutate: () => setStatus("saving"),
        onError: () => setStatus("error"),
        onSuccess: () => setStatus("saved"),
      },
    })
  );
  const deleteBlockMutation = useMutation(
    blockQueryOptions.delete({
      handle,
      queryClient,
      supabase,
      userId,
      callbacks: {
        onMutate: () => setStatus("saving"),
        onError: () => setStatus("error"),
        onSuccess: () => setStatus("saved"),
      },
    })
  );
  const saveLayoutMutation = useMutation(
    blockQueryOptions.saveLayout({
      pageId,
      handle,
      queryClient,
      supabase,
      userId,
      callbacks: {
        onMutate: () => setStatus("saving"),
        onError: () => setStatus("error"),
        onSuccess: () => setStatus("saved"),
      },
    })
  );
  const isSavingLayout = saveLayoutMutation.isPending;

  const handleAddPlaceholder = useCallback(
    (type: BlockType) => {
      if (!isOwner) return;
      const tempId = crypto.randomUUID();
      setPlaceholders((prev) => [
        ...prev,
        { kind: "placeholder", id: tempId, type },
      ]);
      setStatus("dirty");
    },
    [isOwner, setStatus]
  );

  const handleCancelPlaceholder = useCallback(
    (placeholderId: string) => {
      setPlaceholders((prev) =>
        prev.filter((item) => item.id !== placeholderId)
      );
      setStatus("idle");
    },
    [setStatus]
  );

  const applyOptimisticLayout = useCallback(
    (layoutPayload: BlockLayout[]) => {
      queryClient.setQueryData<ProfileBffPayload | undefined>(
        profileQueryOptions.byHandleKey(handle),
        (previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            blocks: applyLayoutPatch(previous.blocks, layoutPayload),
          };
        }
      );
    },
    [handle, queryClient]
  );

  const scheduleLayoutSave = useCallback(
    (layoutPayload: BlockLayout[]) => {
      latestLayoutRef.current = layoutPayload;
      setStatus("dirty");
      if (layoutDebounceRef.current) {
        clearTimeout(layoutDebounceRef.current);
      }
      layoutDebounceRef.current = setTimeout(() => {
        if (!latestLayoutRef.current) return;
        saveLayoutMutation.mutate(
          {
            handle,
            pageId,
            blocks: latestLayoutRef.current,
          },
          {
            onError: (error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "레이아웃 저장에 실패했습니다.";
              toastManager.add({
                title: "레이아웃 저장 실패",
                description: message,
                type: "error",
              });
            },
          }
        );
      }, 300);
    },
    [handle, pageId, saveLayoutMutation, setStatus]
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

      const toastId = toastManager.add({
        title: "블록 삭제 중…",
        type: "loading",
        timeout: 0,
      });

      deleteBlockMutation.mutate(
        { blockId, handle },
        {
          onError: (error) => {
            const message =
              error instanceof Error
                ? error.message
                : "잠시 후 다시 시도해 주세요.";
            toastManager.update(toastId, {
              title: "블록 삭제 실패",
              description: message,
              type: "error",
            });
          },
          onSuccess: () => {
            toastManager.update(toastId, {
              title: "블록이 삭제되었습니다.",
              type: "success",
            });
          },
          onSettled: () => {
            setDeletingBlockIds((prev) => {
              const next = new Set(prev);
              next.delete(blockId);
              return next;
            });
          },
        }
      );
    },
    [deleteBlockMutation, deletingBlockIds, handle, isOwner, setStatus]
  );

  const handleLayoutChange = useCallback(
    (layoutPayload: BlockLayout[]) => {
      if (!isOwner || isSavingLayout) return;

      applyOptimisticLayout(layoutPayload);
      scheduleLayoutSave(layoutPayload);
      console.log(layoutPayload);
    },
    [applyOptimisticLayout, isOwner, isSavingLayout, scheduleLayoutSave]
  );

  const handleSavePlaceholder = useCallback(
    (placeholderId: string, type: BlockType, data: Record<string, unknown>) => {
      if (!isOwner || createBlockMutation.isPending) return;

      const toastId = toastManager.add({
        title: "블록 생성 중…",
        type: "loading",
        timeout: 0,
      });

      const previousPlaceholders = placeholders;

      setPlaceholders((prev) =>
        prev.filter((item) => item.id !== placeholderId)
      );

      createBlockMutation.mutate(
        { pageId, handle, type, data },
        {
          onError: (error) => {
            setPlaceholders(previousPlaceholders);
            toastManager.update(toastId, {
              title: "블록 생성 실패",
              description:
                error instanceof Error
                  ? error.message
                  : "잠시 후 다시 시도해 주세요.",
              type: "error",
            });
          },
          onSuccess: () => {
            toastManager.update(toastId, {
              title: "블록이 생성되었습니다.",
              type: "success",
            });
          },
        }
      );
    },
    [createBlockMutation, handle, isOwner, pageId, placeholders]
  );

  const items: ProfileBlockItem[] = [
    ...persistedBlocks.map((block) => ({ kind: "persisted" as const, block })),
    ...placeholders,
  ];

  useEffect(
    () => () => {
      if (layoutDebounceRef.current) {
        clearTimeout(layoutDebounceRef.current);
      }
    },
    []
  );

  return (
    <BlockEnvProvider value={blockEnvValue}>
      <div className="space-y-3">
        {isOwner ? (
          <BlockRegistryPanel onSelectBlock={handleAddPlaceholder} />
        ) : null}
        <PageBlocks
          items={items}
          handle={handle}
          isOwner={isOwner}
          onSavePlaceholder={handleSavePlaceholder}
          onCancelPlaceholder={handleCancelPlaceholder}
          onDeleteBlock={handleDeleteBlock}
          deletingBlockIds={deletingBlockIds}
          onLayoutChange={handleLayoutChange}
          disableReorder={isSavingLayout}
        />
      </div>
    </BlockEnvProvider>
  );
};
