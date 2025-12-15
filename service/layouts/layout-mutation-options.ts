import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlockKey } from "@/config/block-registry";
import type { LayoutItem, PageLayout } from "@/types/layout";
import type { PageHandle, PageId, ProfileBffPayload } from "@/types/profile";
import { getQueryClient } from "@/lib/get-query-client";
import { getDefaultBlockLayout } from "@/service/blocks/block-layout-presets";
import { profileQueryOptions } from "../profile/profile-query-options";
import {
  requestAddLayoutItem,
  type AddLayoutItemParams,
} from "./add-layout-item";
import {
  requestDeleteLayoutItem,
  type DeleteLayoutItemParams,
} from "./delete-layout-item";
import {
  requestReorderLayoutItems,
  type ReorderLayoutItemsParams,
} from "./reorder-layout-items";
import {
  requestSavePageLayout,
  type SavePageLayoutParams,
} from "./save-page-layout";
import {
  applyItemsToLayoutPayload,
  applyMetricsToLayoutItem,
  extractLayoutItems,
  toStyleString,
} from "./page-layout-utils";
import type { BlockLayout, ResponsiveBlockLayout } from "@/service/blocks/block-layout";

const layoutMutationKey = ["layout"] as const;

const resolveQueryClient = (client?: QueryClient): QueryClient =>
  client ?? getQueryClient();

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

const setProfileState = (
  queryClient: QueryClient,
  handle: PageHandle | undefined,
  updater: (previous: ProfileBffPayload) => ProfileBffPayload
) => {
  if (!handle) return;
  queryClient.setQueryData<ProfileBffPayload>(
    profileQueryOptions.byHandleKey(handle),
    (previous) => {
      if (!previous) return previous;
      return updater(previous);
    }
  );
};

const rollbackProfile = (
  queryClient: QueryClient,
  handle: PageHandle | undefined,
  previous: ProfileBffPayload | undefined
) => {
  if (!handle) return;
  if (previous) {
    queryClient.setQueryData(
      profileQueryOptions.byHandleKey(handle),
      previous
    );
    return;
  }
  void queryClient.invalidateQueries({
    queryKey: profileQueryOptions.byHandleKey(handle),
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

const appendLayoutItem = (layout: PageLayout, item: LayoutItem): PageLayout =>
  applyItemsToLayoutPayload(layout ?? null, [
    ...extractLayoutItems(layout ?? null),
    item,
  ]);

const removeLayoutItem = (layout: PageLayout, itemId: string): PageLayout =>
  applyItemsToLayoutPayload(
    layout ?? null,
    extractLayoutItems(layout ?? null).filter(
      (item) => (item.id ? String(item.id) : "") !== itemId
    )
  );

const reorderLayout = (
  layout: PageLayout,
  nextItems: LayoutItem[]
): PageLayout => applyItemsToLayoutPayload(layout ?? null, nextItems);

const applyLayoutMetrics = (
  layout: PageLayout,
  metrics: ResponsiveBlockLayout[]
): PageLayout => {
  const items = extractLayoutItems(layout ?? null);
  const metricMap = new Map(metrics.map((metric) => [metric.id, metric]));

  const nextItems = items.map((item) => {
    const metric = item.id ? metricMap.get(item.id) : undefined;
    if (!metric) return item;
    return applyMetricsToLayoutItem(item, {
      desktop: metric.desktop,
      mobile: metric.mobile,
    });
  });

  return applyItemsToLayoutPayload(layout ?? null, nextItems);
};

const patchLayoutItemData = (
  layout: PageLayout,
  itemId: string,
  dataPatch: Record<string, unknown>
): PageLayout => {
  const items = extractLayoutItems(layout ?? null);
  const nextItems = items.map((item) => {
    if (!item.id || String(item.id) !== itemId) return item;
    return {
      ...item,
      data: { ...(item.data ?? {}), ...dataPatch },
    };
  });

  return applyItemsToLayoutPayload(layout ?? null, nextItems);
};

const resolveLayoutItems = (profile: ProfileBffPayload): LayoutItem[] =>
  extractLayoutItems(profile.layout ?? null);

const createLayoutItem = (params: {
  type: BlockKey;
  data: Record<string, unknown>;
  currentLength: number;
  itemId?: string;
}): LayoutItem => {
  const defaultLayout = getDefaultBlockLayout(params.type);
  const baseWidth = Math.max(defaultLayout.w, 2);
  const baseHeight = Math.max(defaultLayout.h, 2);
  const id = params.itemId ?? crypto.randomUUID();

  return {
    id,
    type: params.type,
    data: params.data,
    style: {
      desktop: toStyleString(baseWidth, baseHeight),
      mobile: toStyleString(baseWidth, baseHeight),
    },
    position: {
      desktop: {
        x: params.currentLength,
        y: 0,
      },
      mobile: {
        x: params.currentLength,
        y: 0,
      },
    },
    created_at: new Date().toISOString(),
  };
};

export type LayoutMutationContext = {
  handle?: PageHandle;
  previous?: ProfileBffPayload;
};

type LayoutMutationOptionsArgs = {
  supabase: SupabaseClient;
  userId: string | null;
  pageId?: PageId;
  handle?: PageHandle;
  queryClient?: QueryClient;
};

type AddLayoutItemVariables = {
  pageId: PageId;
  handle?: PageHandle;
  type: BlockKey;
  data: Record<string, unknown>;
  itemId?: string;
};

type DeleteLayoutItemVariables = {
  pageId: PageId;
  handle?: PageHandle;
  itemId: string;
};

type ReorderLayoutItemsVariables = {
  pageId: PageId;
  handle?: PageHandle;
  items: LayoutItem[];
};

export type SaveLayoutVariables = {
  pageId: PageId;
  handle?: PageHandle;
  layouts: ResponsiveBlockLayout[];
};

type UpdateLayoutContentVariables =
  | {
      type: "text";
      blockId: string;
      content: string;
      handle?: PageHandle;
    }
  | {
      type: "link";
      blockId: string;
      title: string;
      handle?: PageHandle;
    }
  | {
      type: "section";
      blockId: string;
      title: string;
      handle?: PageHandle;
    };

/**
 * 레이아웃 스냅샷 기반 mutation 옵션 모음.
 * - profile.byHandle 캐시의 layout을 일관되게 갱신한다.
 */
export const layoutMutationOptions = {
  addItem: (options: LayoutMutationOptionsArgs) =>
    mutationOptions<LayoutItem, Error, AddLayoutItemVariables, LayoutMutationContext>({
      mutationKey: [
        ...layoutMutationKey,
        "add",
        options?.pageId ?? "global",
        options?.handle ?? "global",
      ] as const,
      mutationFn: async (variables) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);
        const profile = getProfileSnapshot(queryClient, targetHandle);
        if (!profile) throw new Error("프로필 정보를 불러오지 못했습니다.");
        const currentItems = resolveLayoutItems(profile);

        const optimisticItem = createLayoutItem({
          type: variables.type,
          data: variables.data,
          currentLength: currentItems.length,
          itemId: variables.itemId,
        });
        variables.itemId = optimisticItem.id ? String(optimisticItem.id) : undefined;

        const result = await requestAddLayoutItem({
          supabase: options.supabase,
          userId: options.userId,
          pageId: variables.pageId,
          layout: profile.layout,
          newItem: optimisticItem,
        } satisfies AddLayoutItemParams);

        throwIfFailed(result);

        return optimisticItem;
      },
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        const previous = getProfileSnapshot(queryClient, targetHandle);
        if (previous) {
          const currentItems = resolveLayoutItems(previous);
          const optimisticItem = createLayoutItem({
            type: variables.type,
            data: variables.data,
            currentLength: currentItems.length,
            itemId: variables.itemId,
          });
          variables.itemId = optimisticItem.id ? String(optimisticItem.id) : undefined;
          const nextLayout = appendLayoutItem(
            previous.layout,
            optimisticItem
          );

          setProfileState(queryClient, targetHandle, () => ({
            ...previous,
            layout: nextLayout,
          }));

          return {
            handle: targetHandle,
            previous,
          };
        }

        return { handle: targetHandle };
      },
      onError: (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        rollbackProfile(
          queryClient,
          context?.handle,
          context?.previous
        );
      },
      onSettled: (_data, error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        if ((error || !context?.previous) && context?.handle) {
          invalidateProfile(queryClient, context.handle);
        }
      },
    }),
  deleteItem: (options: LayoutMutationOptionsArgs) =>
    mutationOptions<void, Error, DeleteLayoutItemVariables, LayoutMutationContext>({
      mutationKey: [
        ...layoutMutationKey,
        "delete",
        options?.pageId ?? "dynamic",
        options?.handle ?? "global",
      ] as const,
      mutationFn: async (variables) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);
        const profile = getProfileSnapshot(queryClient, targetHandle);
        if (!profile) throw new Error("프로필 정보를 불러오지 못했습니다.");

        const result = await requestDeleteLayoutItem({
          supabase: options.supabase,
          userId: options.userId,
          pageId: variables.pageId,
          layout: profile.layout,
          itemId: variables.itemId,
        } satisfies DeleteLayoutItemParams);

        throwIfFailed(result);
      },
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        const previous = getProfileSnapshot(queryClient, targetHandle);
        if (previous) {
          const nextLayout = removeLayoutItem(previous.layout, variables.itemId);

          setProfileState(queryClient, targetHandle, () => ({
            ...previous,
            layout: nextLayout,
          }));
        }

        return { handle: targetHandle, previous };
      },
      onError: (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        rollbackProfile(
          queryClient,
          context?.handle,
          context?.previous
        );
      },
      onSettled: (_data, error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        if ((error || !context?.previous) && context?.handle) {
          invalidateProfile(queryClient, context.handle);
        }
      },
    }),
  reorderItems: (options: LayoutMutationOptionsArgs) =>
    mutationOptions<void, Error, ReorderLayoutItemsVariables, LayoutMutationContext>({
      mutationKey: [
        ...layoutMutationKey,
        "reorder",
        options?.pageId ?? "global",
        options?.handle ?? "global",
      ] as const,
      mutationFn: async (variables) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);
        const profile = getProfileSnapshot(queryClient, targetHandle);
        if (!profile) throw new Error("프로필 정보를 불러오지 못했습니다.");

        const result = await requestReorderLayoutItems({
          supabase: options.supabase,
          userId: options.userId,
          pageId: variables.pageId,
          layout: profile.layout,
          nextItems: variables.items,
        } satisfies ReorderLayoutItemsParams);

        throwIfFailed(result);
      },
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        const previous = getProfileSnapshot(queryClient, targetHandle);
        if (previous) {
          const nextLayout = reorderLayout(previous.layout, variables.items);

          setProfileState(queryClient, targetHandle, () => ({
            ...previous,
            layout: nextLayout,
          }));
        }

        return { handle: targetHandle, previous };
      },
      onError: (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        rollbackProfile(
          queryClient,
          context?.handle,
          context?.previous
        );
      },
      onSettled: (_data, error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        if ((error || !context?.previous) && context?.handle) {
          invalidateProfile(queryClient, context.handle);
        }
      },
    }),
  saveLayout: (options: LayoutMutationOptionsArgs) =>
    mutationOptions<void, Error, SaveLayoutVariables, LayoutMutationContext>({
      mutationKey: [
        ...layoutMutationKey,
        "save",
        options?.pageId ?? "global",
        options?.handle ?? "global",
      ] as const,
      mutationFn: async (variables) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);
        const profile = getProfileSnapshot(queryClient, targetHandle);
        if (!profile) throw new Error("프로필 정보를 불러오지 못했습니다.");

        const nextLayout = applyLayoutMetrics(
          profile.layout,
          variables.layouts
        );

        const result = await requestSavePageLayout({
          supabase: options.supabase,
          userId: options.userId,
          pageId: variables.pageId,
          layout: nextLayout,
        } satisfies SavePageLayoutParams);

        throwIfFailed(result);
      },
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        const previous = getProfileSnapshot(queryClient, targetHandle);
        if (previous) {
          const nextLayout = applyLayoutMetrics(
            previous.layout,
            variables.layouts
          );

          setProfileState(queryClient, targetHandle, () => ({
            ...previous,
            layout: nextLayout,
          }));
        }

        return { handle: targetHandle, previous };
      },
      onError: (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        rollbackProfile(
          queryClient,
          context?.handle,
          context?.previous
        );
      },
      onSettled: (_data, error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        if ((error || !context?.previous) && context?.handle) {
          invalidateProfile(queryClient, context.handle);
        }
      },
    }),
  updateContent: (options: LayoutMutationOptionsArgs) =>
    mutationOptions<
      UpdateLayoutContentVariables,
      Error,
      UpdateLayoutContentVariables,
      LayoutMutationContext
    >({
      mutationKey: [
        ...layoutMutationKey,
        "update-content",
        options?.pageId ?? "dynamic",
        options?.handle ?? "global",
      ] as const,
      meta: {
        shouldShowToast: false,
        toastKey: "updateContent",
      },
      mutationFn: async (variables) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);
        const profile = getProfileSnapshot(queryClient, targetHandle);
        if (!profile) throw new Error("프로필 정보를 불러오지 못했습니다.");

        const dataPatch =
          variables.type === "text"
            ? { content: variables.content }
            : variables.type === "section"
              ? { title: variables.title }
              : {
                  title: variables.title,
                };

        const nextLayout = patchLayoutItemData(
          profile.layout,
          variables.blockId,
          dataPatch
        );

        const result = await requestSavePageLayout({
          supabase: options.supabase,
          userId: options.userId,
          pageId: profile.page.id,
          layout: nextLayout,
        } satisfies SavePageLayoutParams);

        throwIfFailed(result);

        return variables;
      },
      onMutate: async (variables) => {
        const queryClient = resolveQueryClient(options.queryClient);
        const targetHandle = resolveHandle(variables.handle, options.handle);

        if (targetHandle) {
          await queryClient.cancelQueries({
            queryKey: profileQueryOptions.byHandleKey(targetHandle),
            exact: true,
          });
        }

        const previous = getProfileSnapshot(queryClient, targetHandle);
        if (previous) {
          const dataPatch =
            variables.type === "text"
              ? { content: variables.content }
              : variables.type === "section"
                ? { title: variables.title }
                : {
                    title: variables.title,
                  };
          const nextLayout = patchLayoutItemData(
            previous.layout,
            variables.blockId,
            dataPatch
          );

          setProfileState(queryClient, targetHandle, () => ({
            ...previous,
            layout: nextLayout,
          }));
        }

        return { handle: targetHandle, previous };
      },
      onError: (_error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        rollbackProfile(
          queryClient,
          context?.handle,
          context?.previous
        );
      },
      onSettled: (_data, error, _variables, context) => {
        const queryClient = resolveQueryClient(options.queryClient);
        if ((error || !context?.previous) && context?.handle) {
          invalidateProfile(queryClient, context.handle);
        }
      },
    }),
};
