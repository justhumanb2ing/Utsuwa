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
import { changePageHandle, type ChangeHandleParams } from "./change-handle";
import {
  togglePageVisibility,
  type TogglePageVisibilityResult,
} from "./toggle-page-visibility";
import { profileQueryOptions } from "../profile/profile-query-options";
import { normalizeHandle } from "@/lib/handle";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileBffPayload } from "@/types/profile";
import { buildHandleCandidates } from "../profile/build-handle-candidates";

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

type ToggleVisibilityOptions = {
  supabase: SupabaseClient;
  userId: string | null;
  pageId: string;
  handle: string;
  ownerId: string;
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
      refetchType: "none",
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

        return {
          ownerId: variables.ownerId,
          currentHandle: variables.currentHandle,
          nextHandle: variables.nextHandle,
        };
      },
      onSuccess: async (_data, variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const nextHandle = variables.nextHandle ?? context?.nextHandle;

        if (nextHandle) {
          await queryClient.prefetchQuery({
            ...profileQueryOptions.byHandle({
              supabase: options.supabase,
              handle: nextHandle,
              userId: options.userId,
            }),
          });

          window.location.replace(`/profile/@${nextHandle}`);
        }
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
      },
    }),
  toggleVisibility: (options: ToggleVisibilityOptions) =>
    mutationOptions<
      TogglePageVisibilityResult,
      Error,
      void,
      { previousProfiles: Record<string, ProfileBffPayload> }
    >({
      mutationKey: [
        ...pageQueryKey,
        "toggle-visibility",
        options.pageId,
      ] as const,
      mutationFn: () =>
        togglePageVisibility({
          supabase: options.supabase,
          userId: options.userId,
          pageId: options.pageId,
          ownerId: options.ownerId,
        }),
      onMutate: async () => {
        const queryClient = resolveQueryClient(options.queryClient);

        const handleCandidates = buildHandleCandidates(options.handle);
        const previousProfiles: Record<string, ProfileBffPayload> = {};

        await Promise.all(
          handleCandidates.map((handle) =>
            queryClient.cancelQueries({
              queryKey: profileQueryOptions.byHandleKey(handle),
            })
          )
        );

        handleCandidates.forEach((handle) => {
          const previousProfile = queryClient.getQueryData<ProfileBffPayload>(
            profileQueryOptions.byHandleKey(handle)
          );

          if (!previousProfile) return;

          previousProfiles[handle] = previousProfile;
          const nextIsPublic = !Boolean(previousProfile.page.is_public);

          queryClient.setQueryData<ProfileBffPayload>(
            profileQueryOptions.byHandleKey(handle),
            {
              ...previousProfile,
              page: {
                ...previousProfile.page,
                is_public: nextIsPublic,
              },
            }
          );
        });

        return { previousProfiles };
      },
      onError: (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);

        Object.entries(context?.previousProfiles ?? {}).forEach(
          ([handle, previousProfile]) => {
            queryClient.setQueryData(
              profileQueryOptions.byHandleKey(handle),
              previousProfile
            );
          }
        );
      },
      onSettled: async () => {
        const queryClient = resolveQueryClient(options.queryClient);

        invalidateProfileByHandleVariants(options.handle, queryClient);

        void queryClient.invalidateQueries({
          queryKey: pageQueryOptions.byOwner(
            options.ownerId,
            options.supabase,
            options.userId
          ).queryKey,
        });
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
