import * as Sentry from "@sentry/nextjs";
import type { Tables } from "@/types/database.types";
import { getBaseUrl } from "@/lib/base-url";

export type OwnerPages = Array<
  Pick<Tables<"pages">, "id" | "handle" | "title" | "ordering">
>;

export type FetchPagesByOwnerParams = {
  ownerId: string;
  headers?: HeadersInit;
};

/**
 * 주어진 사용자 ID를 owner_id로 가진 pages 목록을 반환한다.
 * 오류는 Sentry에 기록하고, 호출 측에 영향을 주지 않도록 빈 배열을 리턴한다.
 */
export const fetchPagesByOwnerId = async (
  params: FetchPagesByOwnerParams
): Promise<OwnerPages> => {
  const { ownerId, headers } = params;
  try {
    return await Sentry.startSpan(
      { op: "http.client", name: "Fetch pages by owner" },
      async (span) => {
        span.setAttribute("owner.id", ownerId);

        const baseUrl = getBaseUrl();
        const targetUrl = baseUrl
          ? `${baseUrl}/api/profile/pages?ownerId=${ownerId}`
          : `/api/profile/pages?ownerId=${ownerId}`;

        const response = await fetch(targetUrl, { headers });

        const body = (await response.json()) as {
          status?: "success" | "error";
          pages?: OwnerPages;
          message?: string;
        };
        
        if (!response.ok || body.status === "error") {
          const message = body.message ?? "페이지 목록을 불러오지 못했습니다.";
          throw new Error(message);
        }

        return body.pages ?? [];
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    return [];
  }
};
