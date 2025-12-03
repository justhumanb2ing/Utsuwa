import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlockWithDetails } from "@/types/block";
import type { PageHandle } from "@/types/profile";

export type DeleteBlockParams = {
  supabase: SupabaseClient;
  userId: string | null;
  blockId: BlockWithDetails["id"];
  handle: PageHandle;
};

export type DeleteBlockResult =
  | { status: "success" }
  | { status: "error"; message: string };

type DeleteBlockApiResponse = {
  status?: "success" | "error";
  reason?: string;
  message?: string;
};

const DEFAULT_ERROR_MESSAGE = "블록을 삭제하지 못했습니다.";

const resolveErrorMessage = (body: DeleteBlockApiResponse): string =>
  body.message ?? body.reason ?? DEFAULT_ERROR_MESSAGE;

/**
 * 프로필 페이지에서 블록을 삭제한다.
 * - 서버 API(`/api/profile/block`)에 DELETE 요청을 보낸다.
 * - 실패 시 사용자 친화적인 메시지로 반환한다.
 */
export const requestDeleteBlock = async (
  params: DeleteBlockParams
): Promise<DeleteBlockResult> => {
  const { supabase, userId, blockId, handle } = params;

  if (!userId) {
    return { status: "error", message: "로그인이 필요합니다." };
  }

  try {
    return await Sentry.startSpan(
      { op: "db.mutation", name: "Delete profile block" },
      async (span) => {
        span.setAttribute("block.id", blockId);
        span.setAttribute("page.handle", handle);

        const { data: block, error: blockLookupError } = await supabase
          .from("blocks")
          .select("id, type, page_id")
          .eq("id", blockId)
          .maybeSingle();

        if (blockLookupError) throw blockLookupError;
        if (!block) {
          return { status: "error", message: "블록을 찾을 수 없습니다." };
        }

        const { data: page, error: pageLookupError } = await supabase
          .from("pages")
          .select("id, owner_id")
          .eq("id", block.page_id)
          .maybeSingle();

        if (pageLookupError) throw pageLookupError;
        if (!page) {
          return { status: "error", message: "페이지를 찾을 수 없습니다." };
        }

        if (page.owner_id !== userId) {
          return { status: "error", message: "블록을 삭제할 권한이 없습니다." };
        }

        const deleteDetail = async () => {
          switch (block.type) {
            case "link":
              return supabase.from("block_link").delete().eq("block_id", blockId);
            case "text":
              return supabase.from("block_text").delete().eq("block_id", blockId);
            case "image":
              return supabase.from("block_image").delete().eq("block_id", blockId);
            case "video":
              return supabase.from("block_video").delete().eq("block_id", blockId);
            case "map":
              return supabase.from("block_map").delete().eq("block_id", blockId);
            default:
              return { error: null };
          }
        };

        const { error: detailDeleteError } = await deleteDetail();

        if (detailDeleteError) throw detailDeleteError;

        const { error: blockDeleteError } = await supabase
          .from("blocks")
          .delete()
          .eq("id", blockId);

        if (blockDeleteError) throw blockDeleteError;

        return { status: "success" };
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    const message =
      error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
    return { status: "error", message };
  }
};
