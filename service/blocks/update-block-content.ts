import * as Sentry from "@sentry/nextjs";

type CommonParams = {
  blockId: string;
  handle: string;
};

export type UpdateBlockContentParams =
  | (CommonParams & { type: "link"; url: string; title: string })
  | (CommonParams & { type: "text"; content: string });

type UpdateBlockResponse =
  | { status: "success"; blockId: string }
  | { status: "error"; reason?: string; message: string };

const DEFAULT_ERROR_MESSAGE = "블록을 저장하지 못했습니다.";

const resolveErrorMessage = (body: UpdateBlockResponse): string =>
  body.status === "error"
    ? body.message ?? body.reason ?? DEFAULT_ERROR_MESSAGE
    : DEFAULT_ERROR_MESSAGE;

export const requestUpdateBlockContent = async (
  params: UpdateBlockContentParams
): Promise<UpdateBlockResponse> => {
  try {
    return await Sentry.startSpan(
      { op: "http.client", name: "Update block content" },
      async (span) => {
        span.setAttribute("block.id", params.blockId);
        span.setAttribute("block.type", params.type);
        span.setAttribute("page.handle", params.handle);

        const response = await fetch(`/api/profile/block/${params.type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        const body = (await response
          .json()
          .catch(() => ({}))) as UpdateBlockResponse;

        if (!response.ok || body.status === "error") {
          const message = resolveErrorMessage(body);
          return { status: "error", message };
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
