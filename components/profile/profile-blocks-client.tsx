"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
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
import PageBlocks from "@/components/profile/page-blocks";
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
import { uploadPageImage } from "@/service/uploads/upload-page-image";
import { toastManager } from "@/components/ui/toast";

const readImageAspectRatio = async (
  file: File
): Promise<number | undefined> => {
  const objectUrl = URL.createObjectURL(file);
  try {
    const ratio = await new Promise<number>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        if (width > 0 && height > 0) {
          resolve(width / height);
        } else {
          reject(new Error("이미지 크기를 확인할 수 없습니다."));
        }
      };
      image.onerror = () =>
        reject(new Error("이미지 정보를 불러오지 못했습니다."));
      image.src = objectUrl;
    });

    return Number.isFinite(ratio) ? ratio : undefined;
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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

  const handleUploadImageBlock = useCallback(
    async (file: File) => {
      if (!isOwner) return;
      if (!userId) {
        toastManager.add({
          title: "로그인이 필요합니다.",
          description: "이미지를 업로드하려면 로그인 후 다시 시도하세요.",
          type: "error",
        });
        return;
      }
      if (isUploadingImage || createBlockMutation.isPending) return;

      setIsUploadingImage(true);
      setStatus("saving");

      try {
        const [imageUrl, aspectRatio] = await Promise.all([
          uploadPageImage({ file, handle }),
          readImageAspectRatio(file),
        ]);

        await createBlockMutation.mutateAsync({
          pageId,
          handle,
          type: "image",
          data: {
            image_url: imageUrl,
            aspect_ratio: aspectRatio,
          },
        });

        setStatus("saved");
      } catch (error) {
        setStatus("error");
        const message =
          error instanceof Error
            ? error.message
            : "이미지 블록을 추가하지 못했습니다.";
        toastManager.add({
          title: "이미지 블록 추가 실패",
          description: message,
          type: "error",
        });
      } finally {
        setIsUploadingImage(false);
      }
    },
    [
      createBlockMutation,
      handle,
      isOwner,
      isUploadingImage,
      pageId,
      setStatus,
      userId,
    ]
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
            onUploadImage={handleUploadImageBlock}
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
