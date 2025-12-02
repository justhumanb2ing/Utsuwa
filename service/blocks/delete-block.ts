import * as Sentry from "@sentry/nextjs";
import type { BlockWithDetails } from "@/types/block";
import type { PageHandle } from "@/types/profile";

export type DeleteBlockParams = {
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
  const { blockId, handle } = params;

  try {
    return await Sentry.startSpan(
      { op: "http.client", name: "Delete profile block" },
      async (span) => {
        span.setAttribute("block.id", blockId);
        span.setAttribute("page.handle", handle);

        const response = await fetch("/api/profile/block", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockId, handle }),
        });

        const body = (await response.json().catch(() => ({}))) as DeleteBlockApiResponse;

        if (!response.ok || body.status === "error") {
          const message = resolveErrorMessage(body);
          return { status: "error", message };
        }

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
