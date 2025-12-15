import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServerSupabaseClient } from "@/config/supabase";
import type { ResolvedLink } from "@/types/resolved-link";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const body = (await req.json()) as { url?: string };
    const rawUrl = body?.url?.trim();

    if (!rawUrl) {
      return NextResponse.json(
        { error: "유효한 URL을 입력해 주세요." },
        { status: 400 }
      );
    }

    const data = await Sentry.startSpan(
      { op: "http.client", name: "Call url-parser function" },
      async (span) => {
        span.setAttribute("link.url", rawUrl);

        const { data, error } = await supabase.functions.invoke<ResolvedLink>(
          "link-parser",
          {
            body: { url: rawUrl },
          }
        );

        if (error) {
          Sentry.captureException(error);
          throw new Error(error.message ?? "링크 정보를 불러오지 못했습니다.");
        }
        if (!data) {
          throw new Error("링크 정보를 불러오지 못했습니다.");
        }

        span.setAttribute("link.kind", data.kind);
        span.setAttribute("link.source", data.source);
        span.setAttribute("link.hasImage", Boolean(data.imageUrl));

        return data;
      }
    );

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    Sentry.captureException(error);
    const message =
      error instanceof Error
        ? error.message
        : "링크 정보를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
