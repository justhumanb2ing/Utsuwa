import {
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { fetchPagesByOwnerId } from "./fetch-pages-by-owner";
import { updatePage } from "./update-page";
import { profileQueryOptions } from "../profile/profile-query-options";

const pageQueryKey = ["page"] as const;

const resolveQueryClient = (client?: QueryClient): QueryClient =>
  client ?? getQueryClient();

type UpdateOptions = {
  pageId?: string;
  handle?: string;
  ownerId?: string;
  queryClient?: QueryClient;
};

/**
 * Page 도메인의 쿼리/뮤테이션 옵션을 정의한다.
 * - 소유자별 페이지 조회와 업데이트 흐름을 단일 키 공간에서 관리한다.
 */
export const pageQueryOptions = {
  all: pageQueryKey,
  byOwner: (ownerId: string) =>
    queryOptions({
      queryKey: [...pageQueryKey, "owner", ownerId] as const,
      queryFn: () => fetchPagesByOwnerId(ownerId),
    }),
  update: (options?: UpdateOptions) =>
    mutationOptions({
      mutationKey: [
        ...pageQueryKey,
        "update",
        options?.pageId ?? "global",
      ] as const,
      mutationFn: updatePage,
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options?.queryClient);

        if (variables.ownerId) {
          await queryClient.cancelQueries({
            queryKey: pageQueryOptions.byOwner(variables.ownerId).queryKey,
          });
        }

        if (variables.handle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandle({ handle: variables.handle }).queryKey,
          });
        }

        return {
          ownerId: variables.ownerId,
          handle: variables.handle,
        };
      },
      onError: async (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);

        if (context?.ownerId) {
          void queryClient.invalidateQueries({
            queryKey: pageQueryOptions.byOwner(context.ownerId).queryKey,
          });
        }

        if (context?.handle) {
          void queryClient.invalidateQueries({
            queryKey: profileQueryOptions.byHandle({ handle: context.handle }).queryKey,
          });
        }
      },
      onSettled: async (_data, _error, variables, context) => {
        const queryClient = resolveQueryClient(options?.queryClient);
        const targetOwnerId = variables.ownerId ?? context?.ownerId;
        const targetHandle = variables.handle ?? context?.handle;

        if (targetOwnerId) {
          void queryClient.invalidateQueries({
            queryKey: pageQueryOptions.byOwner(targetOwnerId).queryKey,
          });
        }

        if (targetHandle) {
          void queryClient.invalidateQueries({
            queryKey: profileQueryOptions.byHandle({ handle: targetHandle }).queryKey,
          });
        }
      },
    }),
};
