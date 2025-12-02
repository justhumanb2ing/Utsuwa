# TanStack Query 도메인 옵션

- 공통 QueryClient: `lib/get-query-client.ts`의 `getQueryClient()`를 사용한다. 서버/클라이언트 동일 옵션(`queries.retry=1`, `mutations.retry=0`, `staleTime=60s`). `queryOptions`/`mutationOptions`는 `@tanstack/react-query`에서 import.
- Block: `service/blocks/block-query-options.ts`에서 `create`, `delete`, `reorder` mutation 키를 `["block", ...]`로 통합 관리.
- Page: `service/pages/page-query-options.ts`에서 소유자별 목록(`byOwner`)과 업데이트(`update`)를 `["page", ...]` 키로 제공.
- Profile: `service/profile/profile-query-options.ts`에서 BFF(`/api/profile/[handle]`) 조회를 `["profile", "bff", handle]` 키로 관리하며, 서버/클라이언트 모두 동일 호출 지점을 사용.

## 서버 사용 예시
```ts
import { getQueryClient } from "@/lib/get-query-client";
import { pageQueryOptions } from "@/service/pages/page-query-options";

const queryClient = getQueryClient();
const pages = await queryClient.ensureQueryData(
  pageQueryOptions.byOwner(userId)
);

const updateResult = await queryClient.executeMutation({
  ...pageQueryOptions.update({ pageId, ownerId: userId, handle }),
  variables: { pageId, ownerId: userId, handle, title },
});
```

## 클라이언트 사용 예시
```tsx
import { useMutation } from "@tanstack/react-query";
import { blockQueryOptions } from "@/service/blocks/block-query-options";

const createBlock = useMutation(blockQueryOptions.create({ pageId, handle }));

await createBlock.mutateAsync({
  pageId,
  handle,
  type,
  data,
});
```
