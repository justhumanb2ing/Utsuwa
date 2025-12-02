import * as Sentry from "@sentry/nextjs";
import type { ProfileBffPayload } from "@/types/profile";

export type FetchProfileParams = {
  handle: string;
  headers?: HeadersInit;
};

/**
 * BFF(`/api/profile/[handle]`)를 호출해 페이지·블록 정보를 가져온다.
 * - 서버 컴포넌트에서 사용할 때는 `origin`과 `cookie`를 전달해 인증 헤더를 보존한다.
 * - 404는 null로 변환해 호출부에서 notFound 처리를 할 수 있게 한다.
 */
export const fetchProfileFromBff = async (
  params: FetchProfileParams
): Promise<ProfileBffPayload | null> => {
  const { handle, headers } = params;
  const encodedHandle = encodeURIComponent(handle);
  const baseUrl = (process.env.URL ?? "").replace(/\/$/, "");
  const targetUrl = `${baseUrl}/api/profile/${encodedHandle}`;

  try {
    return await Sentry.startSpan(
      { op: "http.client", name: "Fetch profile BFF" },
      async (span) => {
        span.setAttribute("profile.handle", handle);
        span.setAttribute("request.url", targetUrl);

        const response = await fetch(targetUrl, { headers });

        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(`Profile BFF fetch failed: ${response.status}`);
        }

        return (await response.json()) as ProfileBffPayload;
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
};
