## Supabase 클라이언트 구성

- 클라이언트 팩토리: `lib/supabase-clients.ts`
  - `createSupabaseBrowserClient()`: Client Component 전용, 익명 키 기반.
  - `createSupabaseServerClient()`: 서버 컴포넌트/Route Handler/서버 액션 전용. `SUPABASE_SERVICE_ROLE_KEY`가 있으면 우선 사용(민감하므로 클라이언트 번들에 포함 금지).
- 환경변수
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (선택, 서버 전용)
- 사용 예시

```ts
// app/(server)/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase-clients";

export default async function Page() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from("example").select("*");

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

```ts
// components/SomeClientComponent.tsx
"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-clients";

export function SomeClientComponent() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.from("example").select("*").then(({ data }) => setRows(data ?? []));
  }, []);

  return <pre>{JSON.stringify(rows, null, 2)}</pre>;
}
```
