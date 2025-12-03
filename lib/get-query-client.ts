// app/get-query-client.ts
import {
  isServer,
  QueryClient,
  defaultShouldDehydrateQuery,
  type Mutation,
} from "@tanstack/react-query";
import { CustomToast } from "./custom-toast";

// Mutation과 toastId를 연결하기 위한 WeakMap
const mutationToastIdMap = new WeakMap<Mutation, string>();

// TODO: i18n 라이브러리로 교체 필요
function getTranslation(key: string): string {
  return key;
}

function makeQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 60 * 1000,
      },
      dehydrate: {
        // include pending queries in dehydration
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
        shouldRedactErrors: () => {
          // We should not catch Next.js server errors
          // as that's how Next.js detects dynamic pages
          // so we cannot redact them.
          // Next.js also automatically redacts errors for us
          // with better digests.
          return false;
        },
      },
    },
  });

  // ============================
  // Global Mutation Event Handler
  // ============================
  queryClient.getMutationCache().subscribe((event) => {
    if (event.type !== "updated") return; // 상태 변화는 updated 이벤트에서만 처리
    if (!event.mutation.meta?.shouldShowToast) return;

    const status = event.mutation.state.status; // pending | success | error
    const toastKey = event.mutation.options.meta?.toastKey as
      | string
      | undefined;

    if (!toastKey) return;

    // 최초 pending 시점에 토스트 생성
    if (status === "pending" && !mutationToastIdMap.has(event.mutation)) {
      const id = CustomToast.loading(getTranslation(`${toastKey}.loading`));
      mutationToastIdMap.set(event.mutation, id);
      return;
    }

    const id = mutationToastIdMap.get(event.mutation);

    if (status === "success" && id) {
      CustomToast.success(id, getTranslation(`${toastKey}.success`));
    }

    if (status === "error" && id) {
      CustomToast.error(id, getTranslation(`${toastKey}.error`));
    }
  });

  return queryClient;
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
