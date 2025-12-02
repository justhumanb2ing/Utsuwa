import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/config/supabase";

const requestSchema = z.object({
  pageId: z.string().min(1),
  handle: z.string().min(1),
  ownerId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

const DEFAULT_ERROR_MESSAGE = "페이지 업데이트에 실패했습니다.";

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

    const { pageId, handle, ownerId, title, description, imageUrl } = parsed.data;

    if (ownerId !== userId) {
      return NextResponse.json(
        {
          status: "error",
          reason: "FORBIDDEN",
          message: "페이지를 수정할 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

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
          message: DEFAULT_ERROR_MESSAGE,
        },
        { status: 500 }
      );
    }

    if (!page) {
      return NextResponse.json(
        {
          status: "error",
          reason: "PAGE_NOT_FOUND",
          message: DEFAULT_ERROR_MESSAGE,
        },
        { status: 404 }
      );
    }

    if (page.owner_id !== userId) {
      return NextResponse.json(
        {
          status: "error",
          reason: "FORBIDDEN",
          message: "페이지를 수정할 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("pages")
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        image_url: imageUrl?.trim() || null,
      })
      .eq("id", pageId)
      .eq("owner_id", userId);

    if (error) {
      Sentry.captureException(error);
      return NextResponse.json(
        {
          status: "error",
          reason: error.code ?? "UPDATE_FAILED",
          message: DEFAULT_ERROR_MESSAGE,
        },
        { status: 500 }
      );
    }

    const normalizedHandle = handle.trim();

    revalidatePath(`/profile/${normalizedHandle}`);
    revalidatePath(`/api/profile/${normalizedHandle}`);

    return NextResponse.json(
      { status: "success", message: "페이지가 업데이트되었습니다." },
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
