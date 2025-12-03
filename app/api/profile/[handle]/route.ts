import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/config/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PagePayload, ProfileBffPayload } from "@/types/profile";

const normalizeHandle = (rawHandle: string): string =>
  rawHandle.trim().replace(/^@+/, "");

const buildHandleCandidates = (rawHandle: string): string[] => {
  const decodedHandle = decodeURIComponent(rawHandle);
  const normalizedHandle = normalizeHandle(decodedHandle);
  const prefixedHandle = normalizedHandle ? `@${normalizedHandle}` : "";

  return [decodedHandle, normalizedHandle, prefixedHandle].filter(
    (candidate, index, self) => candidate && self.indexOf(candidate) === index
  );
};

const fetchPage = async (
  supabase: SupabaseClient,
  handleCandidates: string[]
): Promise<PagePayload | null> => {
  const { data, error } = await supabase
    .from("pages")
    .select("id, handle, title, description, image_url, owner_id")
    .in("handle", handleCandidates)
    .order("ordering", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .maybeSingle<PagePayload>();

  if (error) throw error;
  return data;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { userId } = await auth();
    console.log(userId)
    const { handle } = await params;
    const handleCandidates = buildHandleCandidates(handle);
    if (handleCandidates.length === 0) {
      return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const page = await fetchPage(supabase, handleCandidates);

    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = Boolean(userId && userId === page.owner_id);

    const { data: blocks, error: blockError } = await supabase.rpc(
      "get_blocks_with_details",
      { p_page_id: page.id }
    );

    if (blockError) throw blockError;

    return NextResponse.json(
      {
        page,
        isOwner,
        blocks: blocks ?? [],
      } satisfies ProfileBffPayload,
      {
        status: 200,
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
