import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServerSupabaseClient } from "@/config/supabase";
import type { Tables } from "@/types/database.types";
import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type PagePayload = Pick<
  Tables<"pages">,
  "id" | "handle" | "title" | "description" | "image_url" | "owner_id"
>;

type BlocksPayload = Pick<
  Tables<"blocks">,
  "id" | "type" | "ordering" | "created_at"
>;

type BffPayload = {
  page: PagePayload;
  isOwner: boolean;
  blocks: BlocksPayload[];
};

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

const fetchPageAndProfile = async (
  supabase: SupabaseClient,
  handleCandidates: string[]
): Promise<{ page: PagePayload; blocks: BlocksPayload[] } | null> => {
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id, handle, title, description, image_url, owner_id")
    .in("handle", handleCandidates)
    .order("ordering", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .maybeSingle<PagePayload>();

  if (pageError) throw pageError;
  if (!page) return null;

  const { data: blocks, error: blocksError } = await supabase
    .from("blocks")
    .select("id, type, ordering, created_at")
    .eq("page_id", page.id)
    .order("ordering", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  if (blocksError) throw blocksError;

  return { page, blocks: blocks ?? [] };
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { userId } = await auth();
    const { handle } = await params;
    const handleCandidates = buildHandleCandidates(handle);
    if (handleCandidates.length === 0) {
      return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const result = await fetchPageAndProfile(supabase, handleCandidates);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = Boolean(userId && userId === result.page.owner_id);

    return NextResponse.json(
      { ...result, isOwner } satisfies BffPayload,
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

export async function OPTIONS() {
  return NextResponse.json(
    { methods: ["GET", "OPTIONS"] },
    {
      status: 204,
      headers: {
        Allow: "GET, OPTIONS",
      },
    }
  );
}
