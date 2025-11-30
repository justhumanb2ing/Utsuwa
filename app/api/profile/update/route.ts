import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updatePage } from "@/service/pages/update-page";

const requestSchema = z.object({
  pageId: z.string().min(1),
  handle: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
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

    const { pageId, handle, title, description, imageUrl } = parsed.data;

    const result = await updatePage({
      pageId,
      ownerId: userId,
      title,
      description,
      imageUrl,
    });

    if (!result.ok) {
      Sentry.captureMessage("페이지 업데이트 실패", {
        level: "error",
        extra: { reason: result.reason },
      });
      return NextResponse.json(
        {
          status: "error",
          reason: result.reason,
          message: "페이지 업데이트에 실패했습니다.",
        },
        { status: 400 }
      );
    }

    revalidatePath(`/profile/${handle.trim()}`);

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
