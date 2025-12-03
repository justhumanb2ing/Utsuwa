import * as Sentry from "@sentry/nextjs";
import { formatStoredHandle } from "@/lib/handle";

export type ChangeHandleParams = {
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
  const { pageId, ownerId, currentHandle, nextHandle } = params;

  try {
    return await Sentry.startSpan(
      {
        op: "http.client",
        name: "Change page handle",
      },
      async (span) => {
        span.setAttribute("page.id", pageId);
        span.setAttribute("page.handle.current", currentHandle);
        span.setAttribute("page.handle.next", nextHandle);
        span.setAttribute("page.owner_id", ownerId);

        const response = await fetch(`/api/pages/${pageId}/handle`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: formatStoredHandle(nextHandle) }),
        });

        const body = (await response.json().catch(() => ({}))) as {
          status?: "success" | "error";
          reason?: string;
          handle?: string;
          message?: string;
        };

        if (!response.ok || body.status === "error") {
          const reason =
            body.reason ??
            body.message ??
            "핸들을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.";

          return { ok: false, reason, status: response.status };
        }

        const resolvedHandle = body.handle ?? nextHandle;
        span.setAttribute("page.handle.updated", resolvedHandle);

        return { ok: true, handle: resolvedHandle };
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    const reason = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, reason };
  }
};
