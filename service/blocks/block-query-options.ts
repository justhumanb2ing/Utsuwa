import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getQueryClient } from "@/lib/get-query-client";
import type { PageHandle, PageId } from "@/types/profile";
import { profileQueryOptions } from "../profile/profile-query-options";
import {
  requestCreateBlock,
  type CreateBlockParams,
  type CreateBlockResult,
} from "./create-block";
import {
  requestDeleteBlock,
  type DeleteBlockParams,
  type DeleteBlockResult,
} from "./delete-block";
import {
  requestReorderBlocks,
  type ReorderBlocksParams,
  type ReorderBlocksResult,
} from "./reorder-blocks";
import {
  requestUpdateBlockContent,
  type UpdateBlockContentParams,
  type UpdateBlockResponse,
} from "./update-block-content";

const blockQueryKey = ["block"] as const;
const resolveQueryClient = (client?: QueryClient): QueryClient =>
  client ?? getQueryClient();

const invalidateProfile = (
  handle: PageHandle | undefined,
  queryClient: QueryClient
): void => {
  if (!handle) return;

  void queryClient.invalidateQueries({
    queryKey: profileQueryOptions.byHandleKey(handle),
  });
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
type ReorderBlocksVariables = Omit<
  ReorderBlocksParams,
  "supabase" | "userId"
>;
type UpdateBlockContentVariables = UpdateBlockContentParams;

/**
 * Block 도메인의 mutation 옵션 모음.
 * - 생성/삭제/순서변경을 단일 키 아래에서 관리한다.
 */
export const blockQueryOptions = {
  all: blockQueryKey,
  create: (options: BlockMutationOptionsArgs) =>
    mutationOptions<
      CreateBlockResult,
      Error,
      CreateBlockVariables,
      { handle?: PageHandle }
    >({
      mutationKey: [
        ...blockQueryKey,
        "create",
        options?.pageId ?? "global",
        options?.handle ?? "global",
      ] as const,
      mutationFn: (variables: CreateBlockVariables) =>
        requestCreateBlock({
          supabase: options.supabase,
          userId: options.userId,
          ...variables,
        }),
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = variables.handle ?? options?.handle;
        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        return { handle: targetHandle };
      },
      onError: async (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        invalidateProfile(context?.handle, queryClient);
      },
      onSettled: async (_data, _error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = variables.handle ?? context?.handle ?? options?.handle;
        invalidateProfile(targetHandle, queryClient);
      },
    }),
  delete: (options: BlockMutationOptionsArgs) =>
    mutationOptions<
      DeleteBlockResult,
      Error,
      DeleteBlockVariables,
      { handle?: PageHandle }
    >({
      mutationKey: [
        ...blockQueryKey,
        "delete",
        options?.blockId ?? "dynamic",
        options?.handle ?? "global",
      ] as const,
      mutationFn: (variables: DeleteBlockVariables) =>
        requestDeleteBlock({
          supabase: options.supabase,
          userId: options.userId,
          ...variables,
        }),
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = variables.handle ?? options?.handle;

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        return { handle: targetHandle };
      },
      onError: async (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        invalidateProfile(context?.handle, queryClient);
      },
      onSettled: async (_data, _error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = variables.handle ?? context?.handle ?? options?.handle;
        invalidateProfile(targetHandle, queryClient);
      },
    }),
  reorder: (options: BlockMutationOptionsArgs) =>
    mutationOptions<
      ReorderBlocksResult,
      Error,
      ReorderBlocksVariables,
      { handle?: PageHandle }
    >({
      mutationKey: [
        ...blockQueryKey,
        "reorder",
        options?.pageId ?? "global",
        options?.handle ?? "global",
      ] as const,
      mutationFn: (variables: ReorderBlocksVariables) =>
        requestReorderBlocks({
          supabase: options.supabase,
          userId: options.userId,
          ...variables,
        }),
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = variables.handle ?? options?.handle;

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        return { handle: targetHandle };
      },
      onError: async (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        invalidateProfile(context?.handle, queryClient);
      },
      onSettled: async (_data, _error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = variables.handle ?? context?.handle ?? options?.handle;
        invalidateProfile(targetHandle, queryClient);
      },
    }),
  updateContent: (options: BlockMutationOptionsArgs) =>
    mutationOptions<
      UpdateBlockResponse,
      Error,
      UpdateBlockContentVariables,
      { handle?: PageHandle }
    >({
      mutationKey: [
        ...blockQueryKey,
        "update-content",
        options?.blockId ?? "dynamic",
        options?.handle ?? "global",
      ] as const,
      meta: {
        shouldShowToast: true,
        toastKey: "updateContent",
      },
      mutationFn: (variables: UpdateBlockContentVariables) =>
        requestUpdateBlockContent({
          ...variables,
          supabase: options.supabase,
          userId: options.userId,
        }),
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = variables.handle ?? options?.handle;

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        return { handle: targetHandle };
      },
      onError: async (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        invalidateProfile(context?.handle, queryClient);
      },
      onSettled: async (_data, _error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = variables.handle ?? context?.handle ?? options?.handle;
        invalidateProfile(targetHandle, queryClient);
      },
    }),
};
