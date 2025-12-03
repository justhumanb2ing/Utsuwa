import type { ProfileBffPayload } from "@/types/profile";
import { fetchProfile } from "./fetch-profile";

/**
 * 서버 환경에서 직접 Supabase를 조회해 프로필 정보를 가져온다.
 * - 인증 정보는 Clerk의 `auth()`에서 가져와 소유자 여부를 판단한다.
 * - 404는 null을 반환한다.
 */
export const fetchProfileDirect = async (
  handle: string
): Promise<ProfileBffPayload | null> => {
  const [{ auth }, { createServerSupabaseClient }] = await Promise.all([
    import("@clerk/nextjs/server"),
    import("@/config/supabase"),
  ]);

  const { userId } = await auth();
  const supabase = await createServerSupabaseClient();

  return fetchProfile({ supabase, handle, userId });
};
