import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlockType } from "@/config/block-registry";
import type { BlockWithDetails } from "@/types/block";
import type { PageHandle, PageId } from "@/types/profile";

export type CreateBlockParams = {
  supabase: SupabaseClient;
  userId: string | null;
  pageId: PageId;
  handle: PageHandle;
  type: BlockType;
  data: Record<string, unknown>;
};

export type CreateBlockResult =
  | { status: "success"; block: BlockWithDetails }
  | { status: "error"; message: string };

type BlockApiResponse = {
  status?: "success" | "error";
  block?: BlockWithDetails;
  reason?: string;
  message?: string;
};

const DEFAULT_ERROR_MESSAGE = "블록을 생성하지 못했습니다.";

const resolveErrorMessage = (body: BlockApiResponse): string =>
  body.message ?? body.reason ?? DEFAULT_ERROR_MESSAGE;

/**
 * 프로필 페이지에 새로운 블록을 생성한다.
 * - API 요청/응답을 Sentry span으로 추적한다.
 * - 실패 시 사용자 친화적인 메시지를 반환하고 예외를 캡처한다.
 */
export const requestCreateBlock = async (
  params: CreateBlockParams
): Promise<CreateBlockResult> => {
  const { supabase, userId, pageId, handle, type, data } = params;

  if (!userId) {
    return { status: "error", message: "로그인이 필요합니다." };
  }

  try {
    return await Sentry.startSpan(
      { op: "db.mutation", name: "Create profile block" },
      async (span) => {
        span.setAttribute("block.type", type);
        span.setAttribute("page.id", pageId);
        span.setAttribute("page.handle", handle);

        const { data: page, error: pageLookupError } = await supabase
          .from("pages")
          .select("id, owner_id")
          .eq("id", pageId)
          .maybeSingle();

        if (pageLookupError) {
          throw pageLookupError;
        }

        if (!page) {
          return { status: "error", message: "페이지를 찾을 수 없습니다." };
        }

        if (page.owner_id !== userId) {
          return { status: "error", message: "블록을 생성할 권한이 없습니다." };
        }

        const { data: created, error: rpcError } = await supabase.rpc(
          "create_block",
          { p_page_id: pageId, p_type: type, p_data: data ?? null }
        );

        if (rpcError) {
          throw rpcError;
        }

        if (!created) {
          return { status: "error", message: DEFAULT_ERROR_MESSAGE };
        }

        return { status: "success", block: created as BlockWithDetails };
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    const message =
      error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
    return { status: "error", message };
  }
};
