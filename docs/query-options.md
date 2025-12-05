# TanStack Query 도메인 옵션

- 공통 QueryClient: `lib/get-query-client.ts`의 `getQueryClient()`를 사용한다. 서버/클라이언트 동일 옵션(`queries.retry=1`, `mutations.retry=0`, `staleTime=60s`). `queryOptions`/`mutationOptions`는 `@tanstack/react-query`에서 import.
- Block: `service/blocks/block-query-options.ts`에서 `create`, `delete`, `reorder` mutation 키를 `["block", ...]`로 통합 관리.
- Page: `service/pages/page-query-options.ts`에서 소유자별 목록(`byOwner`), 업데이트(`update`), 핸들 변경(`changeHandle`), 공개 상태 토글(`toggleVisibility`)을 `["page", ...]` 키로 제공하며, Supabase Client와 userId를 호출자에서 주입한다. 공개 상태 토글은 `profile` 캐시에 낙관적 업데이트를 적용한 뒤 쿼리를 무효화해 일관성을 유지한다.
- Profile: `service/profile/profile-query-options.ts`에서 Supabase 기반 조회를 `["profile", "handle", handle]` 키로 관리하며, 서버/클라이언트 모두 동일한 `fetchProfile` 호출 경로를 사용한다.

## 서버 사용 예시
```ts
import { getQueryClient } from "@/lib/get-query-client";
import { pageQueryOptions } from "@/service/pages/page-query-options";
import { createServerSupabaseClient } from "@/config/supabase";
import { auth } from "@clerk/nextjs/server";

const queryClient = getQueryClient();
const { userId } = await auth();
const supabase = await createServerSupabaseClient();
const pages = await queryClient.ensureQueryData(
  pageQueryOptions.byOwner(userId, supabase, userId)
);

const updateResult = await queryClient.executeMutation({
  ...pageQueryOptions.update({ pageId, ownerId: userId, handle, supabase, userId }),
  variables: { pageId, ownerId: userId, handle, title },
});
```

## 클라이언트 사용 예시
```tsx
import { useMutation } from "@tanstack/react-query";
import { blockQueryOptions } from "@/service/blocks/block-query-options";
import { createBrowserSupabaseClient } from "@/config/supabase-browser";
import { useAuth } from "@clerk/nextjs";

const { getToken, userId } = useAuth();
const supabase = createBrowserSupabaseClient(() => getToken());

const createBlock = useMutation(
  blockQueryOptions.create({ pageId, handle, supabase, userId })
);

await createBlock.mutateAsync({
  pageId,
  handle,
  type,
  data,
});
```
