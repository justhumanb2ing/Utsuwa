import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BLOCK_REGISTRY, type BlockType } from "@/config/block-registry";
import { createServerSupabaseClient } from "@/config/supabase";

const blockTypeSchema = z.enum(
  Object.keys(BLOCK_REGISTRY) as [BlockType, ...BlockType[]]
);

const requestSchema = z.object({
  pageId: z.string().min(1),
  handle: z.string().min(1),
  type: blockTypeSchema,
  data: z.record(z.string(), z.any()).optional(),
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

    const { pageId, handle, type, data } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { data: page, error: pageLookupError } = await supabase
      .from("pages")
      .select("id, owner_id")
      .eq("id", pageId)
      .maybeSingle();

    if (pageLookupError) {
      Sentry.captureException(pageLookupError);
      return NextResponse.json(
        {
          status: "error",
          reason: "PAGE_LOOKUP_FAILED",
          message: "페이지를 조회하지 못했습니다.",
        },
        { status: 500 }
      );
    }

    if (!page) {
      return NextResponse.json(
        {
          status: "error",
          reason: "PAGE_NOT_FOUND",
          message: "페이지를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    if (page.owner_id !== userId) {
      return NextResponse.json(
        {
          status: "error",
          reason: "FORBIDDEN",
          message: "블록을 생성할 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

    const { data: created, error: rpcError } = await supabase.rpc(
      "create_block",
      { p_page_id: pageId, p_type: type, p_data: data ?? null }
    );

    if (rpcError) {
      Sentry.captureException(rpcError);
      return NextResponse.json(
        {
          status: "error",
          reason: "BLOCK_CREATE_FAILED",
          message: "블록을 생성하지 못했습니다.",
        },
        { status: 500 }
      );
    }

    const trimmedHandle = handle.trim();
    revalidatePath(`/profile/${trimmedHandle}`);
    revalidatePath(`/api/profile/${trimmedHandle}`);

    return NextResponse.json(
      {
        status: "success",
        block: created,
      },
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
