import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tables } from "@/types/database.types";

export type OwnerPages = Array<
  Pick<Tables<"pages">, "id" | "handle" | "title">
>;

export type FetchPagesByOwnerParams = {
  supabase: SupabaseClient;
  ownerId: string;
  userId: string | null;
};

/**
 * 주어진 사용자 ID를 owner_id로 가진 pages 목록을 반환한다.
 * - 호출자가 Supabase Client와 userId를 주입한다.
 * - 권한 불일치 시 빈 배열 반환.
 */
export const fetchPagesByOwnerId = async (
  params: FetchPagesByOwnerParams
): Promise<OwnerPages> => {
  const { supabase, ownerId, userId } = params;

  if (!userId || ownerId !== userId) {
    return [];
  }

  try {
    return await Sentry.startSpan(
      { op: "db.query", name: "Fetch pages by owner" },
      async (span) => {
        span.setAttribute("owner.id", ownerId);

        const { data, error } = await supabase
          .from("pages")
          .select("id, handle, title, created_at")
          .eq("owner_id", ownerId)
          .order("created_at", { ascending: true, nullsFirst: false });

        if (error) throw error;

        return (data ?? []).map(({ id, handle, title }) => ({
          id,
          handle,
          title,
        }));
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    return [];
  }
};
