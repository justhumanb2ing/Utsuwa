import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlockWithDetails } from "@/types/block";
import type { PageHandle, PageId } from "@/types/profile";

export type ReorderBlockPayload = {
  id: BlockWithDetails["id"];
  ordering: number;
};

export type ReorderBlocksParams = {
  supabase: SupabaseClient;
  userId: string | null;
  pageId: PageId;
  handle: PageHandle;
  blocks: ReorderBlockPayload[];
};

export type ReorderBlocksResult =
  | { status: "success" }
  | { status: "error"; message: string };

const DEFAULT_ERROR_MESSAGE = "블록 순서를 변경하지 못했습니다.";

/**
 * Drag-and-drop 이후 프로필 블록 순서를 Supabase RPC로 일괄 업데이트한다.
 * - 클라이언트에서 `{ id, ordering }` 배열을 전달한다.
 * - 실패 시 사용자 친화적인 메시지를 반환하고 예외를 Sentry로 전파한다.
 */
export const requestReorderBlocks = async (
  params: ReorderBlocksParams
): Promise<ReorderBlocksResult> => {
  const { supabase, userId, pageId, handle, blocks } = params;

  if (!userId) {
    return { status: "error", message: "로그인이 필요합니다." };
  }

  try {
    return await Sentry.startSpan(
      { op: "db.mutation", name: "Reorder profile blocks" },
      async (span) => {
        span.setAttribute("page.id", pageId);
        span.setAttribute("block.count", blocks.length);

        const { data: page, error: pageLookupError } = await supabase
          .from("pages")
          .select("id, handle, owner_id")
          .eq("id", pageId)
          .maybeSingle();

        if (pageLookupError) throw pageLookupError;
        if (!page) {
          return { status: "error", message: "페이지를 찾을 수 없습니다." };
        }

        if (page.owner_id !== userId) {
          return { status: "error", message: "블록을 수정할 권한이 없습니다." };
        }

        const { error: rpcError } = await supabase.rpc(
          "reorder_blocks_after_dnd",
          { p_page_id: pageId, p_blocks: blocks }
        );

        if (rpcError) throw rpcError;

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
