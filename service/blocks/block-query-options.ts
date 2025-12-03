import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import type { PageHandle, PageId } from "@/types/profile";
import { profileQueryOptions } from "../profile/profile-query-options";
import { requestCreateBlock } from "./create-block";
import { requestDeleteBlock } from "./delete-block";
import { requestReorderBlocks } from "./reorder-blocks";
import { requestUpdateBlockContent } from "./update-block-content";

const blockQueryKey = ["block"] as const;
const resolveQueryClient = (client?: QueryClient): QueryClient =>
  client ?? getQueryClient();

const invalidateProfile = (
  handle: PageHandle | undefined,
  queryClient: QueryClient
): void => {
  if (!handle) return;

  void queryClient.invalidateQueries({
    queryKey: profileQueryOptions.byHandle({ handle }).queryKey,
  });
};

type BlockMutationOptionsArgs = {
  pageId?: PageId;
  blockId?: string;
  handle?: PageHandle;
  queryClient?: QueryClient;
};

/**
 * Block 도메인의 mutation 옵션 모음.
 * - 생성/삭제/순서변경을 단일 키 아래에서 관리한다.
 */
export const blockQueryOptions = {
  all: blockQueryKey,
  create: (options?: BlockMutationOptionsArgs) =>
    mutationOptions({
      mutationKey: [
        ...blockQueryKey,
        "create",
        options?.pageId ?? "global",
        options?.handle ?? "global",
      ] as const,
      mutationFn: requestCreateBlock,
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = variables.handle ?? options?.handle;
        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandle({ handle: targetHandle }).queryKey,
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
  delete: (options?: BlockMutationOptionsArgs) =>
    mutationOptions({
      mutationKey: [
        ...blockQueryKey,
        "delete",
        options?.blockId ?? "dynamic",
        options?.handle ?? "global",
      ] as const,
      mutationFn: requestDeleteBlock,
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = variables.handle ?? options?.handle;

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandle({ handle: targetHandle }).queryKey,
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
  reorder: (options?: BlockMutationOptionsArgs) =>
    mutationOptions({
      mutationKey: [
        ...blockQueryKey,
        "reorder",
        options?.pageId ?? "global",
        options?.handle ?? "global",
      ] as const,
      mutationFn: requestReorderBlocks,
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = variables.handle ?? options?.handle;

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandle({ handle: targetHandle }).queryKey,
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
  updateContent: (options?: BlockMutationOptionsArgs) =>
    mutationOptions({
      mutationKey: [
        ...blockQueryKey,
        "update-content",
        options?.blockId ?? "dynamic",
        options?.handle ?? "global",
      ] as const,
      meta: {
        shouldShowToast: true,
        toastKey: 'updateContent'
      },
      mutationFn: requestUpdateBlockContent,
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetHandle = variables.handle ?? options?.handle;

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandle({ handle: targetHandle })
              .queryKey,
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
