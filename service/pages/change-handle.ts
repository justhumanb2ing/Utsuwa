import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatStoredHandle, normalizeHandle, validateHandle } from "@/lib/handle";

export type ChangeHandleParams = {
  supabase: SupabaseClient;
  userId: string | null;
  pageId: string;
  ownerId: string;
  currentHandle: string;
  nextHandle: string;
};

export type ChangeHandleResult =
  | { ok: true; handle: string }
  | { ok: false; reason: string; status?: number };

/**
 * 페이지 핸들을 변경한다.
 * - 고유성(409) 및 권한(403) 오류를 reason으로 그대로 전달한다.
 */
export const changePageHandle = async (
  params: ChangeHandleParams
): Promise<ChangeHandleResult> => {
  const { supabase, userId, pageId, ownerId, currentHandle, nextHandle } =
    params;

  if (!userId) {
    return { ok: false, reason: "로그인이 필요합니다.", status: 401 };
  }

  if (userId !== ownerId) {
    return { ok: false, reason: "권한이 없습니다.", status: 403 };
  }

  const validation = validateHandle(nextHandle);
  if (!validation.ok) {
    const reason =
      validation.reason === "RESERVED"
        ? "사용할 수 없는 핸들입니다."
        : validation.reason === "INVALID_CASE"
          ? "소문자만 사용할 수 있습니다."
          : validation.reason === "CONTAINS_AT_SYMBOL"
            ? "@ 없이 입력해 주세요."
            : "3~20자의 영문 소문자와 숫자만 사용할 수 있습니다.";

    return { ok: false, reason, status: 400 };
  }

  const storedHandle = formatStoredHandle(validation.normalized);

  try {
    return await Sentry.startSpan(
      {
        op: "db.mutation",
        name: "Change page handle",
      },
      async (span) => {
        span.setAttribute("page.id", pageId);
        span.setAttribute("page.handle.current", currentHandle);
        span.setAttribute("page.handle.next", storedHandle);
        span.setAttribute("page.owner_id", ownerId);

        const { data: page, error: pageLookupError } = await supabase
          .from("pages")
          .select("id, handle, owner_id")
          .eq("id", pageId)
          .maybeSingle();

        if (pageLookupError) throw pageLookupError;
        if (!page) {
          return { ok: false, reason: "페이지를 찾을 수 없습니다.", status: 404 };
        }

        if (page.owner_id !== ownerId) {
          return { ok: false, reason: "권한이 없습니다.", status: 403 };
        }

        const currentInDb = normalizeHandle(page.handle ?? "");
        if (currentInDb === validation.normalized) {
          return { ok: true, handle: validation.normalized };
        }

        const { error: updateError } = await supabase
          .from("pages")
          .update({ handle: storedHandle })
          .eq("id", pageId)
          .eq("owner_id", ownerId);

        if (updateError) {
          if (updateError.code === "23505") {
            return { ok: false, reason: "HANDLE_ALREADY_EXISTS", status: 409 };
          }

          if (updateError.code === "42501") {
            return { ok: false, reason: "권한이 없습니다.", status: 403 };
          }

          throw updateError;
        }

        span.setAttribute("page.handle.updated", storedHandle);

        return { ok: true, handle: validation.normalized };
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    const reason = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, reason };
  }
};
