"use client";

import { useCallback, useMemo, useReducer } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { BlockWithDetails } from "@/types/block";
import type { BlockKey } from "@/config/block-registry";
import type {
  PageHandle,
  PageId,
  ProfileBffPayload,
  ProfileOwnership,
} from "@/types/profile";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PageBlocks } from "@/components/profile/page-blocks";
import type {
  PlaceholderBlock,
  ProfileBlockItem,
} from "@/components/profile/types/block-item";
import { useSaveStatus } from "@/components/profile/save-status-context";
import { BlockEditorActionsProvider } from "@/components/profile/block-editor-actions-context";
import { blockQueryOptions } from "@/service/blocks/block-query-options";
import { profileQueryOptions } from "@/service/profile/profile-query-options";
import { BlockEnvProvider } from "@/hooks/use-block-env";
import { type BlockLayout } from "@/service/blocks/block-layout";
import { applyLayoutPatch } from "@/service/blocks/block-normalizer";
import {
  blockEditorReducer,
  initialBlockEditorState,
} from "./block-editor-reducer";
import { useBlockEditorController } from "./block-editor-controller";
import FixedToolbar from "./fixed-toolbar";

type ProfileBlocksClientProps = ProfileOwnership & {
  initialBlocks: BlockWithDetails[];
  handle: PageHandle;
  pageId: PageId;
  supabase: SupabaseClient;
  userId: string | null;
  isOwner: boolean;
};

export const ProfileBlocksClient = ({
  initialBlocks,
  handle,
  pageId,
  supabase,
  userId,
  isOwner,
}: ProfileBlocksClientProps) => {
  const [state, dispatch] = useReducer(
    blockEditorReducer,
    initialBlockEditorState
  );
  const queryClient = useQueryClient();
  const { setStatus } = useSaveStatus();
  const { data: profile } = useSuspenseQuery(
    profileQueryOptions.byHandle({ supabase, handle, userId })
  );
  const persistedBlocks = profile.blocks ?? initialBlocks;
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
    })
  );
  const deleteBlockMutation = useMutation(
    blockQueryOptions.delete({
      handle,
      queryClient,
      supabase,
      userId,
    })
  );
  const saveLayoutMutation = useMutation(
    blockQueryOptions.saveLayout({
      pageId,
      handle,
      queryClient,
      supabase,
      userId,
    })
  );
  const isSavingLayout = saveLayoutMutation.isPending;

  useBlockEditorController(state, dispatch, {
    saveLayoutMutation,
    setStatus,
    handle,
    pageId,
  });

  const handleAddPlaceholder = useCallback(
    (type: BlockKey) => {
      if (!isOwner) return;
      dispatch({ type: "ADD_PLACEHOLDER", blockType: type });
    },
    [dispatch, isOwner]
  );

  const handleCancelPlaceholder = useCallback(
    (placeholderId: string) => {
      dispatch({ type: "CANCEL_PLACEHOLDER", placeholderId });
    },
    [dispatch]
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

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      if (!isOwner || state.deletingBlockIds.has(blockId)) return;

      dispatch({ type: "DELETE_BLOCK_START", blockId });

      deleteBlockMutation.mutate(
        { blockId, handle },
        {
          onSuccess: () => {
            if (state.latestLayout) {
              dispatch({ type: "REQUEST_AUTO_SAVE" });
            }
          },
          onSettled: () => {
            dispatch({ type: "DELETE_BLOCK_FINISH", blockId });
          },
        }
      );
    },
    [
      deleteBlockMutation,
      dispatch,
      handle,
      isOwner,
      state.deletingBlockIds,
      state.latestLayout,
    ]
  );

  const handleLayoutChange = useCallback(
    (layoutPayload: BlockLayout[]) => {
      if (!isOwner || isSavingLayout) return;

      applyOptimisticLayout(layoutPayload);
      dispatch({ type: "LAYOUT_CHANGED", layout: layoutPayload });
      dispatch({ type: "REQUEST_AUTO_SAVE" });
    },
    [applyOptimisticLayout, dispatch, isOwner, isSavingLayout]
  );

  const handleSavePlaceholder = useCallback(
    (placeholderId: string, type: BlockKey, data: Record<string, unknown>) => {
      if (!isOwner || createBlockMutation.isPending) return;

      const placeholder = state.placeholders.find(
        (item) => item.id === placeholderId
      );
      dispatch({ type: "SAVE_PLACEHOLDER_START", placeholderId });

      createBlockMutation.mutate(
        { pageId, handle, type, data },
        {
          onError: () => {
            if (placeholder) {
              dispatch({
                type: "ADD_PLACEHOLDER",
                blockType: placeholder.type,
              });
            }
          },
          onSuccess: () => {
            if (state.latestLayout) {
              dispatch({ type: "REQUEST_AUTO_SAVE" });
            }
          },
        }
      );
    },
    [
      createBlockMutation,
      dispatch,
      handle,
      isOwner,
      pageId,
      state.latestLayout,
      state.placeholders,
    ]
  );

  const items: ProfileBlockItem[] = [
    ...persistedBlocks.map((block) => ({ kind: "persisted" as const, block })),
    ...state.placeholders.map(
      (placeholder): PlaceholderBlock => ({
        kind: "placeholder",
        ...placeholder,
      })
    ),
  ];

  const blockEditorActions = useMemo(
    () => ({
      addPlaceholder: handleAddPlaceholder,
      cancelPlaceholder: handleCancelPlaceholder,
      deleteBlock: handleDeleteBlock,
      savePlaceholder: handleSavePlaceholder,
      layoutChange: handleLayoutChange,
    }),
    [
      handleAddPlaceholder,
      handleCancelPlaceholder,
      handleDeleteBlock,
      handleLayoutChange,
      handleSavePlaceholder,
    ]
  );

  return (
    <BlockEditorActionsProvider value={blockEditorActions}>
      <BlockEnvProvider value={blockEnvValue}>
        <div className="space-y-3">
          <FixedToolbar
            isVisible={isOwner}
            addPlaceholder={handleAddPlaceholder}
          />
          <PageBlocks
            items={items}
            handle={handle}
            isOwner={isOwner}
            onSavePlaceholder={handleSavePlaceholder}
            onCancelPlaceholder={handleCancelPlaceholder}
            onDeleteBlock={handleDeleteBlock}
            deletingBlockIds={state.deletingBlockIds}
            onLayoutChange={handleLayoutChange}
            disableReorder={isSavingLayout}
          />
        </div>
      </BlockEnvProvider>
    </BlockEditorActionsProvider>
  );
};
