import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { fetchProfileDirect } from "@/service/profile/fetch-profile.server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const payload = await fetchProfileDirect(handle);

    if (!payload) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
