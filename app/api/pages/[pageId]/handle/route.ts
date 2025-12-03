import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  formatStoredHandle,
  normalizeHandle,
  validateHandle,
} from "@/lib/handle";
import { createServerSupabaseClient } from "@/config/supabase";

const paramsSchema = z.object({ pageId: z.string().uuid() });
const payloadSchema = z.object({ handle: z.string().min(1) });

const DEFAULT_ERROR_MESSAGE = "핸들을 변경하지 못했습니다.";

const buildHandleCandidates = (handle: string): string[] => {
  const normalized = normalizeHandle(handle);
  const prefixed = normalized ? formatStoredHandle(normalized) : "";
  const trimmed = handle.trim();

  return [trimmed, normalized, prefixed].filter(
    (candidate, index, self) => candidate && self.indexOf(candidate) === index
  );
};

const revalidateHandlePaths = (handles: string[]) => {
  const candidates = handles.flatMap(buildHandleCandidates);
  const uniqueHandles = Array.from(
    new Set(candidates.filter((candidate) => candidate.length > 0))
  );

  uniqueHandles.forEach((handle) => {
    revalidatePath(`/profile/${handle}`);
    revalidatePath(`/api/profile/${handle}`);
  });
};

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) => {
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

    const resolvedParams = paramsSchema.safeParse(await params);
    if (!resolvedParams.success) {
      return NextResponse.json(
        {
          status: "error",
          reason: "INVALID_PARAMS",
          message: DEFAULT_ERROR_MESSAGE,
        },
        { status: 400 }
      );
    }

    const parsedBody = payloadSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          status: "error",
          reason: "INVALID_PAYLOAD",
          message: DEFAULT_ERROR_MESSAGE,
        },
        { status: 400 }
      );
    }

    const handleValidation = validateHandle(parsedBody.data.handle);
    if (!handleValidation.ok) {
      const isReserved = handleValidation.reason === "RESERVED";
      const hasAt = handleValidation.reason === "CONTAINS_AT_SYMBOL";
      const invalidCase = handleValidation.reason === "INVALID_CASE";
      return NextResponse.json(
        {
          status: "error",
          reason: "INVALID_HANDLE",
          message: isReserved
            ? "사용할 수 없는 핸들입니다."
            : hasAt
              ? "핸들에 @를 포함할 수 없습니다."
              : invalidCase
                ? "소문자만 사용할 수 있습니다."
                : "3~20자의 영문 소문자와 숫자만 사용할 수 있습니다.",
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const pageId = resolvedParams.data.pageId;
    const nextHandle = handleValidation.normalized;
    const storedHandle = formatStoredHandle(nextHandle);

    return await Sentry.startSpan(
      {
        op: "api.pages.handle.patch",
        name: "Update page handle",
      },
      async (span) => {
        span.setAttribute("page.id", pageId);
        span.setAttribute("page.handle.next", storedHandle);

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
              reason: "NOT_AUTHORIZED",
              message: "페이지 핸들을 변경할 권한이 없습니다.",
            },
            { status: 403 }
          );
        }

        const previousHandle = page.handle ?? "";
        const currentNormalized = normalizeHandle(previousHandle);

        if (currentNormalized === nextHandle) {
          revalidateHandlePaths([storedHandle]);
          return NextResponse.json(
            { status: "success", handle: nextHandle },
            { status: 200 }
          );
        }

        const { error: updateError } = await supabase
          .from("pages")
          .update({ handle: storedHandle })
          .eq("id", pageId)
          .eq("owner_id", userId);

        if (updateError) {
          if (updateError.code === "23505") {
            return NextResponse.json(
              {
                status: "error",
                reason: "HANDLE_ALREADY_EXISTS",
                message: "이미 사용 중인 핸들입니다.",
              },
              { status: 409 }
            );
          }

          if (updateError.code === "42501") {
            return NextResponse.json(
              {
                status: "error",
                reason: "NOT_AUTHORIZED",
                message: "페이지 핸들을 변경할 권한이 없습니다.",
              },
              { status: 403 }
            );
          }

          Sentry.captureException(updateError);
          return NextResponse.json(
            {
              status: "error",
              reason: "HANDLE_UPDATE_FAILED",
              message: DEFAULT_ERROR_MESSAGE,
            },
            { status: 500 }
          );
        }

        span.setAttribute("page.handle.previous", previousHandle);

        revalidateHandlePaths([previousHandle, storedHandle]);

        return NextResponse.json(
          { status: "success", handle: nextHandle },
          { status: 200 }
        );
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { status: "error", reason: "UNKNOWN_ERROR", message: DEFAULT_ERROR_MESSAGE },
      { status: 500 }
    );
  }
};
