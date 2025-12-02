import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createServerSupabaseClient } from "@/config/supabase";
import type { Tables } from "@/types/database.types";

type OwnerPages = Array<
  Pick<Tables<"pages">, "id" | "handle" | "title" | "ordering">
>;

const requestSchema = z.object({
  ownerId: z.string().min(1),
});

export const POST = async (req: Request) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          status: "error",
          reason: "UNAUTHORIZED",
          message: "로그인이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          status: "error",
          reason: "INVALID_PAYLOAD",
          message: "잘못된 요청입니다.",
        },
        { status: 400 }
      );
    }

    const { ownerId } = parsed.data;
    if (ownerId !== userId) {
      return NextResponse.json(
        {
          status: "error",
          reason: "FORBIDDEN",
          message: "페이지를 조회할 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

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

    return NextResponse.json(
      { status: "success", pages: (data ?? []) as OwnerPages },
      { status: 200 }
    );
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      {
        status: "error",
        reason: "UNKNOWN_ERROR",
        message: "페이지 목록을 불러오지 못했습니다.",
      },
      { status: 500 }
    );
  }
};
