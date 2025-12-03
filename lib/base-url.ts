const stripTrailingSlash = (url: string): string => url.replace(/\/$/, "");

/**
 * 환경에 맞는 베이스 URL을 계산한다.
 * - 개발: http://localhost:3000
 * - 배포: NEXT_PUBLIC_VERCEL_URL (https:// 프리픽스 자동 부여)
 * - 설정이 없으면 빈 문자열을 반환해 상대 경로 호출을 허용한다.
 */
export const getBaseUrl = (): string => {
  const isDev = process.env.NODE_ENV === "development";
  const raw = isDev ? "http://localhost:3000" : process.env.NEXT_PUBLIC_VERCEL_URL ?? "";

  if (!raw) return "";

  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return stripTrailingSlash(withProtocol);
};
