import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

type CommonParams = {
  blockId: string;
  handle: string;
};

export type UpdateBlockContentParams =
  | (CommonParams & { type: "link"; url: string; title: string })
  | (CommonParams & { type: "text"; content: string })
  | (CommonParams & { type: "section"; title: string });

export type UpdateBlockResponse =
  | { status: "success"; blockId: string }
  | { status: "error"; reason?: string; message: string };

const DEFAULT_ERROR_MESSAGE = "블록을 저장하지 못했습니다.";

const resolveErrorMessage = (body: UpdateBlockResponse): string =>
  body.status === "error"
    ? body.message ?? body.reason ?? DEFAULT_ERROR_MESSAGE
    : DEFAULT_ERROR_MESSAGE;

export const requestUpdateBlockContent = async (
  params: UpdateBlockContentParams & {
    supabase: SupabaseClient;
    userId: string | null;
  }
): Promise<UpdateBlockResponse> => {
  const { supabase, userId } = params;

  if (!userId) {
    return { status: "error", message: "로그인이 필요합니다." };
  }

  try {
    return await Sentry.startSpan(
      { op: "db.mutation", name: "Update block content" },
      async (span) => {
        span.setAttribute("block.id", params.blockId);
        span.setAttribute("block.type", params.type);
        span.setAttribute("page.handle", params.handle);

        const { data: block, error: blockLookupError } = await supabase
          .from("blocks")
          .select("id, page_id, type")
          .eq("id", params.blockId)
          .maybeSingle();

        if (blockLookupError) throw blockLookupError;
        if (!block) {
          return { status: "error", message: "블록을 찾을 수 없습니다." };
        }

        if (block.type !== params.type) {
          return { status: "error", message: "유효하지 않은 블록 타입입니다." };
        }

        const { data: page, error: pageLookupError } = await supabase
          .from("pages")
          .select("owner_id")
          .eq("id", block.page_id)
          .maybeSingle();

        if (pageLookupError) throw pageLookupError;
        if (!page) {
          return { status: "error", message: "페이지를 찾을 수 없습니다." };
        }

        if (page.owner_id !== userId) {
          return { status: "error", message: "블록을 수정할 권한이 없습니다." };
        }

        if (params.type === "text") {
          const { error } = await supabase
            .from("block_text")
            .upsert(
              { block_id: params.blockId, content: params.content.trim() },
              { onConflict: "block_id" }
            )
            .select("block_id")
            .single();

          if (error) throw error;
        }

        if (params.type === "link") {
          const { error } = await supabase
            .from("block_link")
            .upsert(
              {
                block_id: params.blockId,
                url: params.url.trim(),
                title: params.title.trim(),
              },
              { onConflict: "block_id" }
            )
            .select("block_id")
            .single();

          if (error) throw error;
        }

        if (params.type === "section") {
          const { error } = await supabase
            .from("block_section")
            .upsert(
              { block_id: params.blockId, title: params.title.trim() },
              { onConflict: "block_id" }
            )
            .select("block_id")
            .single();

          if (error) throw error;
        }

        return { status: "success", blockId: params.blockId };
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    const message =
      error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
    return { status: "error", message };
  }
};
