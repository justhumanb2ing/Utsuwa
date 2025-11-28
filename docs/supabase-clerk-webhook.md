# Clerk 웹훅 → Supabase 프로필 다중 핸들 동기화

## 스키마(다중 핸들)

`profile`
- `user_id text` PK
- `created_at timestamptz` default now()
- `updated_at timestamptz` default now()
- `display_name text` not null
- `avatar_url text`
- `primary_handle_id uuid` references `profile_handle(user_id, id)` on delete set null

`profile_handle`
- `id uuid` PK default gen_random_uuid()
- `user_id text` not null references `profile(user_id)` on delete cascade
- `handle text` not null unique (전역 유니크)
- `is_primary boolean` not null default false (유저당 하나만 true: partial unique index)
- `created_at timestamptz` default now()
- `unique (user_id, id)` to support composite FK

마이그레이션: `docs/migrations/2024-11-07-profile-handles.sql`
- 기존 `profile.handle`을 `profile_handle`로 이관하고 대표 핸들로 지정 후 컬럼 제거.

## 핵심 처리 규칙
- 온보딩을 통과한 모든 사용자는 `publicMetadata.handle`을 반드시 가진다 → 이를 단일 소스로 사용.
- 동일 handle이 다른 user가 이미 보유하면 409로 응답(온보딩 단계 중복 검증 권장).
- 현재 요청 handle을 그 유저의 대표 핸들(`is_primary=true`, `profile.primary_handle_id`)로 승격하고, 다른 핸들은 모두 `is_primary=false`로 내린다.
- 삭제(`user.deleted`) 시 `profile` 삭제 → `profile_handle`은 cascade로 제거.
- FK 오류(23503) 방지: 항상 `profile`을 먼저 upsert한 뒤 `profile_handle`을 insert/upsert 한다.

## Edge Function 예시

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { Webhook, type WebhookRequiredHeaders } from "https://esm.sh/svix@1.15.0";

type ClerkEmailAddress = {
  email_address: string;
  id: string;
};

type ClerkUserPayload = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string | null;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
  public_metadata?: {
    handle?: string | null;
    [key: string]: unknown;
  };
};

type ClerkWebhookEvent =
  | { type: "user.created"; data: ClerkUserPayload }
  | { type: "user.updated"; data: ClerkUserPayload }
  | { type: "user.deleted"; data: ClerkUserPayload }
  | { type: string; data: ClerkUserPayload };

const supabaseUrl = Deno.env.get("SB_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SB_SERVICE_ROLE_KEY") ?? "";
const clerkWebhookSecret = Deno.env.get("CLERK_WEBHOOK_SECRET") ?? "";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const HANDLE_CONFLICT_ERROR = "HANDLE_CONFLICT";
const MISSING_HANDLE_ERROR = "MISSING_HANDLE";

const sanitizeHandle = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

const resolveRequestedHandle = (payload: ClerkUserPayload): string => {
  const handle = payload.public_metadata?.handle;
  if (typeof handle !== "string") return "";
  return sanitizeHandle(handle);
};

const resolveDisplayName = (payload: ClerkUserPayload): string =>
  `${payload.last_name ?? ""}${payload.first_name ?? ""}`.trim();

const ensureProfileExists = async (payload: ClerkUserPayload) => {
  const userId = payload.id;
  const baseProfile = {
    user_id: userId,
    display_name: resolveDisplayName(payload),
    avatar_url: payload.image_url ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profile")
    .upsert(baseProfile, { onConflict: "user_id" });

  if (error) {
    console.error("Profile upsert (base) failed", error);
    throw new Error("PROFILE_UPSERT_FAILED");
  }
};

const ensureHandle = async (
  payload: ClerkUserPayload,
): Promise<{ id: string; handle: string }> => {
  const userId = payload.id;
  const handle = resolveRequestedHandle(payload);

  if (!handle) {
    throw new Error(MISSING_HANDLE_ERROR);
  }

  const { data: existingHandle, error: handleLookupError } = await supabase
    .from("profile_handle")
    .select("id, user_id, is_primary")
    .eq("handle", handle)
    .maybeSingle();

  if (handleLookupError) {
    console.error("Handle lookup failed", handleLookupError);
    throw new Error("HANDLE_LOOKUP_FAILED");
  }

  if (existingHandle && existingHandle.user_id !== userId) {
    throw new Error(HANDLE_CONFLICT_ERROR);
  }

  let handleId = existingHandle?.id;

  if (!handleId) {
    const { data, error } = await supabase
      .from("profile_handle")
      .insert({ user_id: userId, handle, is_primary: true })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Handle insert failed", error);
      throw new Error("HANDLE_INSERT_FAILED");
    }

    handleId = data.id;
  } else if (!existingHandle?.is_primary) {
    const { error: promoteError } = await supabase
      .from("profile_handle")
      .update({ is_primary: true })
      .eq("id", handleId);

    if (promoteError) {
      console.error("Handle promote failed", promoteError);
      throw new Error("HANDLE_PROMOTE_FAILED");
    }
  }

  const { error: demoteError } = await supabase
    .from("profile_handle")
    .update({ is_primary: false })
    .eq("user_id", userId)
    .neq("id", handleId);

  if (demoteError) {
    console.error("Handle demote failed", demoteError);
  }

  return { id: handleId, handle };
};

console.info("Clerk profile webhook started");

Deno.serve(async (req) => {
  if (!supabaseUrl || !supabaseServiceKey || !clerkWebhookSecret) {
    console.error("Missing Supabase or Clerk env variables");
    return new Response("Server misconfigured", { status: 500 });
  }

  const headers: WebhookRequiredHeaders = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  const body = await req.text();

  let event: ClerkWebhookEvent;
  try {
    const webhook = new Webhook(clerkWebhookSecret);
    event = webhook.verify(body, headers) as ClerkWebhookEvent;
  } catch (error) {
    console.error("Invalid webhook signature", error);
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = event.data;
  const userId = payload?.id;

  if (!userId) {
    return new Response("Missing user id", { status: 400 });
  }

  try {
    if (event.type === "user.deleted") {
      await supabase.from("profile").delete().eq("user_id", userId);
      return new Response("deleted", { status: 200 });
    }

    // FK 보호를 위해 handle 삽입 전에 profile 행을 보장
    await ensureProfileExists(payload);

    const primaryHandle = await ensureHandle(payload);
    const { error: profileError } = await supabase
      .from("profile")
      .update({
        display_name: resolveDisplayName(payload),
        avatar_url: payload.image_url ?? null,
        primary_handle_id: primaryHandle.id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Supabase profile upsert error", profileError);
      return new Response("Supabase error", { status: 500 });
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === MISSING_HANDLE_ERROR) {
      console.error("Missing handle in metadata", error);
      return new Response("Missing handle in metadata", { status: 400 });
    }
    if (error instanceof Error && error.message === HANDLE_CONFLICT_ERROR) {
      console.error("Handle already in use", error);
      return new Response("Handle conflict", { status: 409 });
    }
    console.error("Unexpected error", error);
    return new Response("error", { status: 500 });
  }
});
```
