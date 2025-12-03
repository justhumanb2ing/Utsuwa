import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 클라이언트(브라우저) Supabase 인스턴스를 생성한다.
 * 서버 전용 모듈(`@clerk/nextjs/server`)과 분리해 Client Component에서도 안전하게 사용한다.
 */
export const createBrowserSupabaseClient = (
  getToken?: () => Promise<string | null>
): SupabaseClient => {
  const resolveAccessToken = async (): Promise<string | null> => {
    if (!getToken) return null;

    try {
      return (await getToken()) ?? null;
    } catch (_error) {
      return null;
    }
  };

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: resolveAccessToken,
    }
  );
};
