import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeHandle } from "@/lib/handle";

export type UpdatePageParams = {
  supabase: SupabaseClient;
  userId: string | null;
  pageId: string;
  ownerId: string;
  handle: string;
  title?: string;
  description?: string;
  imageUrl?: string;
};

export type UpdatePageResult =
  | { ok: true }
  | { ok: false; reason: string };

export const updatePage = async (
  params: UpdatePageParams
): Promise<UpdatePageResult> => {
  const {
    supabase,
    userId,
    pageId,
    ownerId,
    handle,
    title,
    description,
    imageUrl,
  } = params;

  if (!userId) {
    return { ok: false, reason: "로그인이 필요합니다." };
  }

  if (userId !== ownerId) {
    return { ok: false, reason: "권한이 없습니다." };
  }

  const normalizedHandle = normalizeHandle(handle);

  try {
    return await Sentry.startSpan(
      { op: "db.mutation", name: "Update page" },
      async (span) => {
        span.setAttribute("page.id", pageId);
        span.setAttribute("page.handle", normalizedHandle);

        const { data: updatedPage, error: updateError } = await supabase
          .from("pages")
          .update({
            title,
            description,
            image_url: imageUrl,
          })
          .eq("id", pageId)
          .eq("owner_id", ownerId)
          .select("id")
          .maybeSingle();

        if (updateError) {
          if (updateError.code === "23505") {
            return { ok: false, reason: "이미 사용 중인 핸들입니다." };
          }
          throw updateError;
        }

        if (!updatedPage) {
          return { ok: false, reason: "페이지를 찾을 수 없습니다." };
        }

        return { ok: true };
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    const reason = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, reason };
  }
};
