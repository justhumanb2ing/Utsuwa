import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/config/supabase";
import { normalizeHandleValue } from "@/lib/handle";

export const dynamic = "force-dynamic";

const FALLBACK_REDIRECT = "/";
const CTA_PATH = "/go/profile";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const baseUrl = new URL(request.url);

  if (!userId) {
    const signInUrl = new URL("/sign-in", baseUrl.origin);
    signInUrl.searchParams.set("redirect_url", CTA_PATH);

    return NextResponse.redirect(signInUrl);
  }

  try {
    return await Sentry.startSpan(
      { op: "http.redirect", name: "go_profile" },
      async (span) => {
        span.setAttribute("user.id", userId);

        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase.rpc("get_primary_page", {
          p_owner_id: userId,
        });

        if (error) {
          throw error;
        }

        const normalizedHandle = normalizeHandleValue(data);

        if (!normalizedHandle) {
          span.setAttribute("redirect.fallback", true);
          const fallbackUrl = new URL(FALLBACK_REDIRECT, baseUrl.origin);
          return NextResponse.redirect(fallbackUrl);
        }

        const targetUrl = new URL(
          `/profile/@${encodeURIComponent(normalizedHandle)}`,
          baseUrl.origin
        );

        span.setAttribute("redirect.target", targetUrl.pathname);

        return NextResponse.redirect(targetUrl);
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    const fallbackUrl = new URL(FALLBACK_REDIRECT, baseUrl.origin);
    return NextResponse.redirect(fallbackUrl);
  }
}
