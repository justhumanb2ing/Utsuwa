import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlockWithDetails } from "@/types/block";
import type { PageHandle, PageId, ProfileBffPayload } from "@/types/profile";
import { getQueryClient } from "@/lib/get-query-client";
import { profileQueryOptions } from "../profile/profile-query-options";
import { requestCreateBlock, type CreateBlockParams } from "./create-block";
import { requestDeleteBlock, type DeleteBlockParams } from "./delete-block";
import {
  requestReorderBlocks,
  type ReorderBlocksParams,
} from "./reorder-blocks";
import {
  requestUpdateBlockContent,
  type UpdateBlockContentParams,
} from "./update-block-content";
import {
  applyContentPatch,
  applyLayoutPatch,
  applyOrderingPatch,
  createOptimisticBlock,
  resequenceBlocks,
} from "./block-normalizer";
import {
  requestSaveBlockLayout,
  type SaveBlockLayoutParams,
} from "./save-block-layout";
import { getDefaultBlockLayout } from "./block-layout-presets";

const blockQueryKey = ["block"] as const;
const resolveQueryClient = (client?: QueryClient): QueryClient =>
  client ?? getQueryClient();

type BlockMutationContext = {
  handle?: PageHandle;
  previous?: ProfileBffPayload;
  optimisticBlockId?: string;
  optimisticBlock?: BlockWithDetails;
};

type MutationLifecycleCallbacks<TData, TVariables> = {
  onMutate?: (variables: TVariables) => void;
  onError?: (
    error: Error,
    variables: TVariables,
    context: BlockMutationContext | undefined
  ) => void;
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: BlockMutationContext | undefined
  ) => void;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: BlockMutationContext | undefined
  ) => void;
};

type BlockMutationOptionsArgs = {
  supabase: SupabaseClient;
  userId: string | null;
  pageId?: PageId;
  blockId?: string;
  handle?: PageHandle;
  queryClient?: QueryClient;
};

type CreateBlockVariables = Omit<CreateBlockParams, "supabase" | "userId">;
type DeleteBlockVariables = Omit<DeleteBlockParams, "supabase" | "userId">;
type ReorderBlocksVariables = Omit<ReorderBlocksParams, "supabase" | "userId">;
type UpdateBlockContentVariables = UpdateBlockContentParams;
type SaveBlockLayoutVariables = Omit<
  SaveBlockLayoutParams,
  "supabase" | "userId"
>;

const resolveHandle = (
  variablesHandle?: PageHandle,
  optionHandle?: PageHandle
): PageHandle | undefined => variablesHandle ?? optionHandle;

const getProfileSnapshot = (
  queryClient: QueryClient,
  handle?: PageHandle
): ProfileBffPayload | undefined =>
  handle
    ? queryClient.getQueryData<ProfileBffPayload>(
        profileQueryOptions.byHandleKey(handle)
      )
    : undefined;

const setProfileBlocks = (
  queryClient: QueryClient,
  handle: PageHandle | undefined,
  updater: (blocks: BlockWithDetails[]) => BlockWithDetails[]
) => {
  if (!handle) return;

  queryClient.setQueryData<ProfileBffPayload>(
    profileQueryOptions.byHandleKey(handle),
    (previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        blocks: resequenceBlocks(updater(previous.blocks)),
      };
    }
  );
};

const rollbackProfile = (
  queryClient: QueryClient,
  context: BlockMutationContext | undefined
) => {
  if (!context?.handle) return;
  if (context.previous) {
    queryClient.setQueryData(
      profileQueryOptions.byHandleKey(context.handle),
      context.previous
    );
    return;
  }

  void queryClient.invalidateQueries({
    queryKey: profileQueryOptions.byHandleKey(context.handle),
  });
};

const invalidateProfile = (
  queryClient: QueryClient,
  handle: PageHandle | undefined
) => {
  if (!handle) return;
  void queryClient.invalidateQueries({
    queryKey: profileQueryOptions.byHandleKey(handle),
  });
};

const throwIfFailed = <TResult extends { status: string; message?: string }>(
  result: TResult
): Extract<TResult, { status: "success" }> => {
  if (result.status !== "success") {
    throw new Error(result.message ?? "요청에 실패했습니다.");
  }
  return result as Extract<TResult, { status: "success" }>;
};

const hydrateCreatedBlock = (
  block: BlockWithDetails,
  variables: CreateBlockVariables
): BlockWithDetails => {
  const defaultLayout = getDefaultBlockLayout(variables.type);

  return {
    ...block,
    ...variables.data,
    w: block.w ?? defaultLayout.w,
    h: block.h ?? defaultLayout.h,
  };
};

/**
 * Block 도메인의 mutation 옵션 모음.
 * - setQueryData를 기반으로 낙관적 업데이트를 수행한다.
 */
export const blockQueryOptions = {
  all: blockQueryKey,
  create: (
    options: BlockMutationOptionsArgs & {
      callbacks?: MutationLifecycleCallbacks<
        BlockWithDetails,
        CreateBlockVariables
      >;
    }
  ) =>
    mutationOptions<
      BlockWithDetails,
      Error,
      CreateBlockVariables,
      BlockMutationContext
    >({
      mutationKey: [
        ...blockQueryKey,
        "create",
        options?.pageId ?? "global",
        options?.handle ?? "global",
      ] as const,
      mutationFn: async (variables) => {
        const result = await requestCreateBlock({
          supabase: options.supabase,
          userId: options.userId,
          ...variables,
        });
        const success = throwIfFailed(result);
        if (!success.block) {
          throw new Error("생성된 블록 데이터를 확인할 수 없습니다.");
        }
        return success.block;
      },
      onMutate: async (variables) => {
        options.callbacks?.onMutate?.(variables);
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);
        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        const previous = getProfileSnapshot(queryClient, targetHandle);
        if (previous) {
          const optimisticBlock = createOptimisticBlock({
            type: variables.type,
            data: variables.data,
            currentLength: previous.blocks.length,
          });
          setProfileBlocks(queryClient, targetHandle, (blocks) => [
            ...blocks,
            optimisticBlock,
          ]);
          return {
            handle: targetHandle,
            previous,
            optimisticBlockId: optimisticBlock.id,
            optimisticBlock,
          };
        }

        return { handle: targetHandle };
      },
      onError: (error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        rollbackProfile(queryClient, context);
        options.callbacks?.onError?.(error, variables, context);
      },
      onSuccess: (data, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        if (context?.handle) {
          const hydrated = hydrateCreatedBlock(data, variables);
          setProfileBlocks(queryClient, context.handle, (blocks) => {
            const replaced = context.optimisticBlockId
              ? blocks.map((block) =>
                  block.id === context.optimisticBlockId
                    ? {
                        ...hydrated,
                        x: block.x ?? hydrated.x ?? 0,
                        y: block.y ?? hydrated.y ?? 0,
                        w: block.w ?? hydrated.w,
                        h: block.h ?? hydrated.h,
                        ordering:
                          block.ordering ??
                          hydrated.ordering ??
                          blocks.length,
                        created_at: block.created_at ?? hydrated.created_at,
                      }
                    : block
                )
              : [
                  ...blocks,
                  {
                    ...hydrated,
                    ordering: hydrated.ordering ?? blocks.length,
                  },
                ];
            return replaced;
          });
        }
        options.callbacks?.onSuccess?.(data, variables, context);
      },
      onSettled: (data, error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        if ((error || !context?.previous) && context?.handle) {
          invalidateProfile(queryClient, context.handle);
        }
        options.callbacks?.onSettled?.(data, error ?? null, variables, context);
      },
    }),
  delete: (
    options: BlockMutationOptionsArgs & {
      callbacks?: MutationLifecycleCallbacks<void, DeleteBlockVariables>;
    }
  ) =>
    mutationOptions<void, Error, DeleteBlockVariables, BlockMutationContext>({
      mutationKey: [
        ...blockQueryKey,
        "delete",
        options?.blockId ?? "dynamic",
        options?.handle ?? "global",
      ] as const,
      mutationFn: async (variables) => {
        const result = await requestDeleteBlock({
          supabase: options.supabase,
          userId: options.userId,
          ...variables,
        });
        throwIfFailed(result);
      },
      onMutate: async (variables) => {
        options.callbacks?.onMutate?.(variables);
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        const previous = getProfileSnapshot(queryClient, targetHandle);
        if (previous) {
          setProfileBlocks(queryClient, targetHandle, (blocks) =>
            blocks.filter((block) => block.id !== variables.blockId)
          );
        }

        return { handle: targetHandle, previous };
      },
      onError: (error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        rollbackProfile(queryClient, context);
        options.callbacks?.onError?.(error, variables, context);
      },
      onSuccess: (_data, variables, context) => {
        options.callbacks?.onSuccess?.(undefined as void, variables, context);
      },
      onSettled: (_data, error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        if ((error || !context?.previous) && context?.handle) {
          invalidateProfile(queryClient, context.handle);
        }
        options.callbacks?.onSettled?.(
          undefined,
          error ?? null,
          variables,
          context
        );
      },
    }),
  reorder: (
    options: BlockMutationOptionsArgs & {
      callbacks?: MutationLifecycleCallbacks<void, ReorderBlocksVariables>;
    }
  ) =>
    mutationOptions<void, Error, ReorderBlocksVariables, BlockMutationContext>({
      mutationKey: [
        ...blockQueryKey,
        "reorder",
        options?.pageId ?? "global",
        options?.handle ?? "global",
      ] as const,
      mutationFn: async (variables) => {
        const result = await requestReorderBlocks({
          supabase: options.supabase,
          userId: options.userId,
          ...variables,
        });
        throwIfFailed(result);
      },
      onMutate: async (variables) => {
        options.callbacks?.onMutate?.(variables);
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        const previous = getProfileSnapshot(queryClient, targetHandle);
        if (previous) {
          setProfileBlocks(queryClient, targetHandle, (blocks) =>
            applyOrderingPatch(blocks, variables.blocks)
          );
        }

        return { handle: targetHandle, previous };
      },
      onError: (error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        rollbackProfile(queryClient, context);
        options.callbacks?.onError?.(error, variables, context);
      },
      onSuccess: (_data, variables, context) => {
        options.callbacks?.onSuccess?.(undefined as void, variables, context);
      },
      onSettled: (_data, error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        if ((error || !context?.previous) && context?.handle) {
          invalidateProfile(queryClient, context.handle);
        }
        options.callbacks?.onSettled?.(
          undefined,
          error ?? null,
          variables,
          context
        );
      },
    }),
  saveLayout: (
    options: BlockMutationOptionsArgs & {
      callbacks?: MutationLifecycleCallbacks<void, SaveBlockLayoutVariables>;
    }
  ) =>
    mutationOptions<
      void,
      Error,
      SaveBlockLayoutVariables,
      BlockMutationContext
    >({
      mutationKey: [
        ...blockQueryKey,
        "save-layout",
        options?.pageId ?? "global",
        options?.handle ?? "global",
      ] as const,
      mutationFn: async (variables) => {
        const result = await requestSaveBlockLayout({
          supabase: options.supabase,
          userId: options.userId,
          ...variables,
        });
        throwIfFailed(result);
      },
      onMutate: async (variables) => {
        options.callbacks?.onMutate?.(variables);
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        const previous = getProfileSnapshot(queryClient, targetHandle);
        if (previous) {
          setProfileBlocks(queryClient, targetHandle, (blocks) =>
            applyLayoutPatch(blocks, variables.blocks)
          );
        }

        return { handle: targetHandle, previous };
      },
      onError: (error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        rollbackProfile(queryClient, context);
        options.callbacks?.onError?.(error, variables, context);
      },
      onSuccess: (_data, variables, context) => {
        options.callbacks?.onSuccess?.(undefined as void, variables, context);
      },
      onSettled: (_data, error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        if ((error || !context?.previous) && context?.handle) {
          invalidateProfile(queryClient, context.handle);
        }
        options.callbacks?.onSettled?.(
          undefined,
          error ?? null,
          variables,
          context
        );
      },
    }),
  updateContent: (
    options: BlockMutationOptionsArgs & {
      callbacks?: MutationLifecycleCallbacks<
        UpdateBlockContentVariables,
        UpdateBlockContentVariables
      >;
    }
  ) =>
    mutationOptions<
      UpdateBlockContentVariables,
      Error,
      UpdateBlockContentVariables,
      BlockMutationContext
    >({
      mutationKey: [
        ...blockQueryKey,
        "update-content",
        options?.blockId ?? "dynamic",
        options?.handle ?? "global",
      ] as const,
      meta: {
        shouldShowToast: false,
        toastKey: "updateContent",
      },
      mutationFn: async (variables) => {
        const result = await requestUpdateBlockContent({
          ...variables,
          supabase: options.supabase,
          userId: options.userId,
        });
        throwIfFailed(result);
        return variables;
      },
      onMutate: async (variables) => {
        options.callbacks?.onMutate?.(variables);
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        const previous = getProfileSnapshot(queryClient, targetHandle);
        if (previous) {
          setProfileBlocks(queryClient, targetHandle, (blocks) =>
            applyContentPatch(blocks, variables)
          );
        }

        return { handle: targetHandle, previous };
      },
      onError: (error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        rollbackProfile(queryClient, context);
        options.callbacks?.onError?.(error, variables, context);
      },
      onSuccess: (data, variables, context) => {
        options.callbacks?.onSuccess?.(data, variables, context);
      },
      onSettled: (data, error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        if ((error || !context?.previous) && context?.handle) {
          invalidateProfile(queryClient, context.handle);
        }
        options.callbacks?.onSettled?.(data, error ?? null, variables, context);
      },
    }),
};
