import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tables } from "@/types/database.types";

type PageVisibilityPayload = Pick<
  Tables<"pages">,
  | "id"
  | "handle"
  | "title"
  | "description"
  | "image_url"
  | "owner_id"
  | "is_public"
  | "ordering"
>;

export type TogglePageVisibilityParams = {
  supabase: SupabaseClient;
  userId: string | null;
  pageId: string;
  ownerId: string;
};

export type TogglePageVisibilityResult =
  | { ok: true; page: PageVisibilityPayload }
  | { ok: false; reason: string };

const DEFAULT_ERROR_MESSAGE = "페이지 공개 상태를 변경하지 못했습니다.";

/**
 * Supabase RPC(`toggle_page_visibility`)를 호출해 페이지의 공개 여부를 토글한다.
 * - 소유자/로그인 여부를 사전 검증한다.
 * - 실패 시 사용자 친화적인 메시지를 reason으로 반환한다.
 */
export const togglePageVisibility = async (
  params: TogglePageVisibilityParams
): Promise<TogglePageVisibilityResult> => {
  const { supabase, userId, pageId, ownerId } = params;

  if (!userId) {
    return { ok: false, reason: "로그인이 필요합니다." };
  }

  if (userId !== ownerId) {
    return { ok: false, reason: "권한이 없습니다." };
  }

  try {
    return await Sentry.startSpan(
      { op: "db.mutation", name: "Toggle page visibility" },
      async (span) => {
        span.setAttribute("page.id", pageId);
        span.setAttribute("page.owner_id", ownerId);

        const { data, error } = await supabase.rpc("toggle_page_visibility", {
          p_page_id: pageId,
        });

        if (error) {
          if (error.message === "PAGE_NOT_FOUND_OR_NOT_OWNER") {
            return {
              ok: false,
              reason: "페이지를 찾을 수 없거나 권한이 없습니다.",
            };
          }

          throw error;
        }

        if (!data) {
          return { ok: false, reason: DEFAULT_ERROR_MESSAGE };
        }

        const page = data as PageVisibilityPayload;
        span.setAttribute("page.is_public", Boolean(page.is_public));

        return { ok: true, page };
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    const reason =
      error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
    return { ok: false, reason };
  }
};
