import * as Sentry from "@sentry/nextjs";
import { createServerSupabaseClient } from "@/config/supabase";
import type { Tables } from "@/types/database.types";

export type OwnerPages = Array<
  Pick<Tables<"pages">, "id" | "handle" | "title" | "ordering">
>;

/**
 * 주어진 사용자 ID를 owner_id로 가진 pages 목록을 반환한다.
 * 오류는 Sentry에 기록하고, 호출 측에 영향을 주지 않도록 빈 배열을 리턴한다.
 */
export const fetchPagesByOwnerId = async (ownerId: string): Promise<OwnerPages> => {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("pages")
      .select("id, handle, title, ordering")
      .eq("owner_id", ownerId)
      .order("ordering", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return data ?? [];
  } catch (error) {
    Sentry.captureException(error);
    return [];
  }
};
