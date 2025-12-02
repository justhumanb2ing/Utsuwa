import * as Sentry from "@sentry/nextjs";

export type UpdatePageParams = {
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
  const { pageId, ownerId, handle, title, description, imageUrl } = params;

  try {
    return await Sentry.startSpan(
      { op: "http.client", name: "Update page" },
      async (span) => {
        span.setAttribute("page.id", pageId);
        span.setAttribute("page.handle", handle);

        const response = await fetch("/api/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId,
            ownerId,
            handle,
            title,
            description,
            imageUrl,
          }),
        });

        const body = (await response.json().catch(() => ({}))) as {
          status?: "success" | "error";
          reason?: string;
          message?: string;
        };

        if (!response.ok || body.status === "error") {
          const reason =
            body.reason ?? body.message ?? "페이지 업데이트에 실패했습니다.";
          return { ok: false, reason };
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
