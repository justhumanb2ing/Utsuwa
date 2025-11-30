import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerSupabaseClient } from "@/config/supabase";

const requestSchema = z.object({
  blockId: z.string().min(1),
  handle: z.string().min(1),
  content: z.string().min(1),
});

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

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

    const { blockId, handle, content } = parsed.data;

    if (!isUuid(blockId)) {
      return NextResponse.json(
        {
          status: "error",
          reason: "INVALID_BLOCK_ID",
          message: "올바르지 않은 블록 ID입니다.",
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: block, error: blockError } = await supabase
      .from("blocks")
      .select("id, pages ( owner_id )")
      .eq("id", blockId)
      .maybeSingle();
    
    if (blockError) {
      Sentry.captureException(blockError);
      return NextResponse.json(
        {
          status: "error",
          reason: "BLOCK_LOOKUP_FAILED",
          message: "블록을 조회하지 못했습니다.",
        },
        { status: 500 }
      );
    }

    if (!block) {
      return NextResponse.json(
        {
          status: "error",
          reason: "BLOCK_NOT_FOUND",
          message: "블록을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const ownerId =
      Array.isArray(block.pages) && block.pages.length > 0
        ? block.pages[0]?.owner_id
        : typeof block.pages === "object" && block.pages !== null
          ? (block.pages as { owner_id?: string | null }).owner_id
          : undefined;

    if (ownerId !== userId) {
      return NextResponse.json(
        {
          status: "error",
          reason: "FORBIDDEN",
          message: "블록을 수정할 권한이 없습니다.",
        },
        { status: 403 }
      );
    }
    
    const { error } = await supabase
      .from("block_text")
      .upsert(
        {
          block_id: blockId,
          content: content.trim(),
        },
        { onConflict: "block_id" }
      )
      .select("block_id")
      .single();

    if (error) {
      Sentry.captureException(error);
      return NextResponse.json(
        {
          status: "error",
          reason: "UPSERT_FAILED",
          message: "텍스트를 저장하지 못했습니다.",
        },
        { status: 500 }
      );
    }

    revalidatePath(`/profile/${handle.trim()}`);

    return NextResponse.json(
      { status: "success", blockId },
      { status: 200 }
    );
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { status: "error", reason: "UNKNOWN_ERROR", message: "서버 오류" },
      { status: 500 }
    );
  }
};
