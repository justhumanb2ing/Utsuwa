# Clerk 웹훅 → Supabase profile 동기화 (단일 handle)

## profile 테이블 스키마

```
user_id text primary key
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
display_name text not null
avatar_url text
handle text not null unique
```

## 처리 규칙
- 온보딩을 통과한 모든 사용자는 `publicMetadata.handle`을 반드시 가진다 → 이를 단일 소스로 사용.
- 동일 handle이 다른 user가 이미 보유하면 409로 응답한다.
- display_name은 `last_name + first_name`을 그대로 사용한다(온보딩 상 존재).
- 이벤트별 insert/update/delete로 처리하며, handle 충돌 시 409로 중단한다.

## Edge Function 예시

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { Webhook, type WebhookRequiredHeaders } from "https://esm.sh/svix@1.15.0";

type ClerkUserPayload = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string | null;
  public_metadata?: { handle?: string | null; [key: string]: unknown };
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

const resolveDisplayName = (payload: ClerkUserPayload): string =>
  `${payload.last_name ?? ""}${payload.first_name ?? ""}`.trim();

const resolveHandle = (payload: ClerkUserPayload): string =>
  typeof payload.public_metadata?.handle === "string"
    ? payload.public_metadata.handle.trim()
    : "";

const ensureHandleAvailable = async (handle: string, userId: string) => {
  if (!handle) throw new Error(MISSING_HANDLE_ERROR);

  const { data, error } = await supabase
    .from("profile")
    .select("user_id")
    .eq("handle", handle)
    .maybeSingle();

  if (error) {
    console.error("Handle lookup failed", error);
    throw new Error("HANDLE_LOOKUP_FAILED");
  }

  if (data && data.user_id !== userId) {
    throw new Error(HANDLE_CONFLICT_ERROR);
  }
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
  if (!userId) return new Response("Missing user id", { status: 400 });

  const handle = resolveHandle(payload);
  if (!handle) {
    return new Response("Missing handle in metadata", { status: 400 });
  }

  try {
    switch (event.type) {
      case "user.created": {
        const profilePayload = {
          user_id: userId,
          display_name: resolveDisplayName(payload),
          avatar_url: payload.image_url ?? null,
          handle,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("profile").insert(profilePayload);
        if (error) {
          console.error("Supabase insert error", error);
          return new Response("Supabase error", { status: 500 });
        }
        break;
      }
      case "user.updated": {
        await ensureHandleAvailable(handle, userId);

        const profilePayload = {
          display_name: resolveDisplayName(payload),
          avatar_url: payload.image_url ?? null,
          handle,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("profile")
          .update(profilePayload)
          .eq("user_id", userId);

        if (error) {
          console.error("Supabase update error", error);
          return new Response("Supabase error", { status: 500 });
        }
        break;
      }
      case "user.deleted": {
        const { error } = await supabase.from("profile").delete().eq("user_id", userId);
        if (error) {
          console.error("Supabase delete error", error);
          return new Response("Supabase error", { status: 500 });
        }
        break;
      }
      default: {
        console.log("Unhandled event type", event.type);
        return new Response("Ignored", { status: 200 });
      }
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
