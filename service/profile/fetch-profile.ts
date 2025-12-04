import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tables } from "@/types/database.types";
import type { ProfileBffPayload } from "@/types/profile";
import { buildHandleCandidates } from "./build-handle-candidates";

type PageRecord = Pick<
  Tables<"pages">,
  | "id"
  | "handle"
  | "title"
  | "description"
  | "image_url"
  | "owner_id"
  | "is_public"
>;

type BlocksPayload = ProfileBffPayload["blocks"];

export type FetchProfileParams = {
  supabase: SupabaseClient;
  handle: string;
  userId: string | null;
};

/**
 * Supabase 기반 프로필 조회 (서버/클라이언트 공통)
 * - Supabase Client와 userId를 DI로 주입해 인증/토큰 생성을 호출자에 위임한다.
 * - 404는 null로 반환한다.
 */
export const fetchProfile = async (
  params: FetchProfileParams
): Promise<ProfileBffPayload | null> => {
  const { supabase, handle, userId } = params;
  const handleCandidates = buildHandleCandidates(handle);

  if (handleCandidates.length === 0) throw new Error("Invalid handle");

  try {
    return await Sentry.startSpan(
      { op: "db.query", name: "Fetch profile" },
      async (span) => {
        span.setAttribute("profile.handle", handle);

        const { data: page, error: pageError } = await supabase
          .from("pages")
          .select(
            "id, handle, title, description, image_url, owner_id, is_public"
          )
          .in("handle", handleCandidates)
          .order("ordering", { ascending: true, nullsFirst: true })
          .order("created_at", { ascending: true })
          .maybeSingle<PageRecord>();

        if (pageError) throw pageError;
        if (!page) return null;

        const { data: blocks, error: blockError } = await supabase.rpc(
          "get_blocks_with_details",
          { p_page_id: page.id }
        );

        if (blockError) throw blockError;

        return {
          page,
          isOwner: Boolean(userId && userId === page.owner_id),
          blocks: (blocks ?? []) as BlocksPayload,
        };
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
};
