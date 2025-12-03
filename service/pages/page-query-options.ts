import {
  dehydrate,
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { fetchPagesByOwnerId } from "./fetch-pages-by-owner";
import {
  updatePage,
  type UpdatePageParams,
  type UpdatePageResult,
} from "./update-page";
import {
  changePageHandle,
  type ChangeHandleParams,
} from "./change-handle";
import { profileQueryOptions } from "../profile/profile-query-options";
import { normalizeHandle } from "@/lib/handle";
import type { SupabaseClient } from "@supabase/supabase-js";

const pageQueryKey = ["page"] as const;

const resolveQueryClient = (client?: QueryClient): QueryClient =>
  client ?? getQueryClient();

type UpdateOptions = {
  supabase: SupabaseClient;
  userId: string | null;
  pageId?: string;
  handle?: string;
  ownerId?: string;
  queryClient?: QueryClient;
};

type ChangeHandleOptions = {
  supabase: SupabaseClient;
  userId: string | null;
  pageId?: string;
  handle?: string;
  ownerId?: string;
  queryClient?: QueryClient;
};

type UpdatePageVariables = Omit<UpdatePageParams, "supabase" | "userId">;
type ChangeHandleVariables = Omit<ChangeHandleParams, "supabase" | "userId">;

const invalidateProfileByHandleVariants = (
  handle: string | undefined,
  queryClient: QueryClient
) => {
  if (!handle) return;

  const normalized = normalizeHandle(handle);
  const prefixed = normalized ? `@${normalized}` : "";

  [handle, normalized, prefixed].forEach((candidate) => {
    if (!candidate) return;

    queryClient.invalidateQueries({
      queryKey: profileQueryOptions.byHandleKey(candidate),
    });
  });
};

/**
 * Page 도메인의 쿼리/뮤테이션 옵션을 정의한다.
 * - 소유자별 페이지 조회와 업데이트 흐름을 단일 키 공간에서 관리한다.
 */
export const pageQueryOptions = {
  all: pageQueryKey,
  byOwner: (
    ownerId: string | null | undefined,
    supabase: SupabaseClient,
    userId: string | null
  ) =>
    queryOptions({
      queryKey: [...pageQueryKey, "owner", ownerId ?? ""] as const,
      queryFn: () =>
        !!ownerId
          ? fetchPagesByOwnerId({ ownerId, supabase, userId })
          : Promise.resolve([]),
      enabled: !!ownerId,
    }),
  update: (options: UpdateOptions) =>
    mutationOptions<
      UpdatePageResult,
      Error,
      UpdatePageVariables,
      { ownerId?: string; handle?: string }
    >({
      mutationKey: [
        ...pageQueryKey,
        "update",
        options.pageId ?? "global",
      ] as const,
      meta: {
        shouldShowToast: true,
        toastKey: "hello!!!",
      },
      mutationFn: (variables: UpdatePageVariables) =>
        updatePage({
          supabase: options.supabase,
          userId: options.userId,
          ...variables,
        }),
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options.queryClient);

        if (variables.ownerId) {
          await queryClient.cancelQueries({
            queryKey: pageQueryOptions.byOwner(
              variables.ownerId,
              options.supabase,
              options.userId
            ).queryKey,
          });
        }

        if (variables.handle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(variables.handle),
          });
        }

        return {
          ownerId: variables.ownerId,
          handle: variables.handle,
        };
      },
      onError: async (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);

        if (context?.ownerId) {
          void queryClient.invalidateQueries({
            queryKey: pageQueryOptions.byOwner(
              context.ownerId,
              options.supabase,
              options.userId
            ).queryKey,
          });
        }

        if (context?.handle) {
          void queryClient.invalidateQueries({
            queryKey: profileQueryOptions.byHandleKey(context.handle),
          });
        }
      },
      onSettled: async (_data, _error, variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const targetOwnerId = variables.ownerId ?? context?.ownerId;
        const targetHandle = variables.handle ?? context?.handle;

        if (targetOwnerId) {
          void queryClient.invalidateQueries({
            queryKey: pageQueryOptions.byOwner(
              targetOwnerId,
              options.supabase,
              options.userId
            ).queryKey,
          });
        }

        if (targetHandle) {
          void queryClient.invalidateQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
          });
        }
      },
    }),
  changeHandle: (options: ChangeHandleOptions) =>
    mutationOptions({
      mutationKey: [
        ...pageQueryKey,
        "change-handle",
        options.pageId ?? "global",
      ] as const,
      mutationFn: (variables: ChangeHandleVariables) =>
        changePageHandle({
          supabase: options.supabase,
          userId: options.userId,
          ...variables,
        }),
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options.queryClient);

        if (variables.ownerId) {
          await queryClient.cancelQueries({
            queryKey: pageQueryOptions.byOwner(
              variables.ownerId,
              options.supabase,
              options.userId
            ).queryKey,
          });
        }

        invalidateProfileByHandleVariants(variables.currentHandle, queryClient);

        return {
          ownerId: variables.ownerId,
          currentHandle: variables.currentHandle,
          nextHandle: variables.nextHandle,
        };
      },
      onError: async (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);

        if (context?.ownerId) {
          void queryClient.invalidateQueries({
            queryKey: pageQueryOptions.byOwner(
              context.ownerId,
              options.supabase,
              options.userId
            ).queryKey,
          });
        }

        invalidateProfileByHandleVariants(context?.currentHandle, queryClient);
        // invalidateProfileByHandleVariants(context?.nextHandle, queryClient);
      },
      onSettled: async (_data, _error, variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const targetOwnerId = variables.ownerId ?? context?.ownerId;

        if (targetOwnerId) {
          void queryClient.invalidateQueries({
            queryKey: pageQueryOptions.byOwner(
              targetOwnerId,
              options.supabase,
              options.userId
            ).queryKey,
          });
        }

        invalidateProfileByHandleVariants(
          context?.currentHandle ?? options.handle,
          queryClient
        );
        // invalidateProfileByHandleVariants(
        //   variables.nextHandle ?? context?.nextHandle ?? options.handle,
        //   queryClient
        // );
      },
    }),
};

export const prefetchPageListByOwner = async (
  ownerId: string,
  supabase: SupabaseClient,
  userId: string | null
) => {
  const queryClient = getQueryClient();
  await queryClient.fetchQuery({
    ...pageQueryOptions.byOwner(ownerId, supabase, userId),
  });

  return { dehydrated: dehydrate(queryClient) };
};
