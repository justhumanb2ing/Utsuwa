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

const deleteRequestSchema = z.object({
  blockId: z.string().uuid(),
  handle: z.string().min(1),
});

const reorderRequestSchema = z.object({
  pageId: z.string().uuid(),
  handle: z.string().min(1),
  blocks: z
    .array(
      z.object({
        id: z.string().uuid(),
        ordering: z.number(),
      })
    )
    .min(1),
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

export const DELETE = async (req: Request) => {
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

    const parsed = deleteRequestSchema.safeParse(await req.json());
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

    const { blockId, handle } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { data: block, error: blockLookupError } = await supabase
      .from("blocks")
      .select("id, type, page_id")
      .eq("id", blockId)
      .maybeSingle();

    if (blockLookupError) {
      Sentry.captureException(blockLookupError);
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

    const { data: page, error: pageLookupError } = await supabase
      .from("pages")
      .select("id, handle, owner_id")
      .eq("id", block.page_id)
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
          message: "블록을 삭제할 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

    const deleteDetail = async () => {
      switch (block.type) {
        case "link":
          return supabase.from("block_link").delete().eq("block_id", blockId);
        case "text":
          return supabase.from("block_text").delete().eq("block_id", blockId);
        case "image":
          return supabase.from("block_image").delete().eq("block_id", blockId);
        case "video":
          return supabase.from("block_video").delete().eq("block_id", blockId);
        case "map":
          return supabase.from("block_map").delete().eq("block_id", blockId);
        default:
          return { error: null };
      }
    };

    const { error: detailDeleteError } = await deleteDetail();

    if (detailDeleteError) {
      Sentry.captureException(detailDeleteError);
      return NextResponse.json(
        {
          status: "error",
          reason: "DETAIL_DELETE_FAILED",
          message: "블록 세부 정보를 삭제하지 못했습니다.",
        },
        { status: 500 }
      );
    }

    const { error: blockDeleteError } = await supabase
      .from("blocks")
      .delete()
      .eq("id", blockId);

    if (blockDeleteError) {
      Sentry.captureException(blockDeleteError);
      return NextResponse.json(
        {
          status: "error",
          reason: "BLOCK_DELETE_FAILED",
          message: "블록을 삭제하지 못했습니다.",
        },
        { status: 500 }
      );
    }

    const normalizedPageHandle = page.handle?.trim() ?? "";
    const normalizedRequestHandle = handle.trim().replace(/^@+/, "");
    const targetHandle = normalizedPageHandle || normalizedRequestHandle;

    if (targetHandle) {
      revalidatePath(`/profile/${targetHandle}`);
      revalidatePath(`/api/profile/${targetHandle}`);
    }

    if (normalizedRequestHandle && normalizedRequestHandle !== targetHandle) {
      revalidatePath(`/profile/${normalizedRequestHandle}`);
      revalidatePath(`/api/profile/${normalizedRequestHandle}`);
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { status: "error", reason: "UNKNOWN_ERROR", message: "서버 오류" },
      { status: 500 }
    );
  }
};

export const PATCH = async (req: Request) => {
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

    const parsed = reorderRequestSchema.safeParse(await req.json());
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

    const { pageId, handle, blocks } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { data: page, error: pageLookupError } = await supabase
      .from("pages")
      .select("id, handle, owner_id")
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
          message: "블록을 수정할 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

    const { error: rpcError } = await supabase.rpc(
      "reorder_blocks_after_dnd",
      { p_page_id: pageId, p_blocks: blocks }
    );

    if (rpcError) {
      Sentry.captureException(rpcError);
      return NextResponse.json(
        {
          status: "error",
          reason: "BLOCK_REORDER_FAILED",
          message: "블록 순서를 변경하지 못했습니다.",
        },
        { status: 500 }
      );
    }

    const normalizedPageHandle = page.handle?.trim() ?? "";
    const normalizedRequestHandle = handle.trim().replace(/^@+/, "");
    const targetHandle = normalizedPageHandle || normalizedRequestHandle;

    if (targetHandle) {
      revalidatePath(`/profile/${targetHandle}`);
      revalidatePath(`/api/profile/${targetHandle}`);
    }

    if (normalizedRequestHandle && normalizedRequestHandle !== targetHandle) {
      revalidatePath(`/profile/${normalizedRequestHandle}`);
      revalidatePath(`/api/profile/${normalizedRequestHandle}`);
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { status: "error", reason: "UNKNOWN_ERROR", message: "서버 오류" },
      { status: 500 }
    );
  }
};
