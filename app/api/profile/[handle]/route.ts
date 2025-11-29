import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServerSupabaseClient } from "@/config/supabase";
import type { Tables } from "@/types/database.types";
import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type PagePayload = Pick<
  Tables<"pages">,
  "id" | "handle" | "title" | "description" | "owner_id"
>;

type ProfilePayload = Pick<
  Tables<"profile">,
  "user_id" | "display_name" | "avatar_url"
>;

type BlockTypePayload = {
  id?: string;
  name?: string | null;
  description?: string | null;
  icon: string;
  is_available: boolean;
};

type BffPayload = {
  page: PagePayload;
  profile: ProfilePayload;
  blockTypes?: BlockTypePayload[] | null;
  isOwner: boolean;
};

type RawBlockType = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  icon?: unknown;
  is_available?: unknown;
};

const iconByKey: Record<string, string> = {
  link: "Link",
  text: "Type",
  section: "LayoutPanelTop",
  image: "Image",
  video: "Video",
  map: "MapPinned",
  divider: "SeparatorHorizontal",
};

const formatFromStringList = (items: string[]): BlockTypePayload[] =>
  items.map((key) => {
    const normalizedKey = key.trim().toLowerCase();
    const icon = iconByKey[normalizedKey] ?? "Square";

    return {
      id: undefined,
      name: key,
      description: null,
      icon,
      is_available: true,
    };
  });

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
): Promise<{ page: PagePayload; profile: ProfilePayload } | null> => {
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id, handle, title, description, owner_id")
    .in("handle", handleCandidates)
    .order("ordering", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .maybeSingle<PagePayload>();

  if (pageError) throw pageError;
  if (!page) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("user_id, display_name, avatar_url")
    .eq("user_id", page.owner_id)
    .maybeSingle<ProfilePayload>();

  if (profileError) throw profileError;
  if (!profile) return null;

  return { page, profile };
};

const formatBlockTypes = (raw: unknown): BlockTypePayload[] => {
  if (Array.isArray(raw) && raw.every((item) => typeof item === "string")) {
    return formatFromStringList(raw as string[]);
  }

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const typed = item as RawBlockType;

      return {
        id: typeof typed.id === "string" ? typed.id : undefined,
        name: typeof typed.name === "string" ? typed.name : null,
        description:
          typeof typed.description === "string" ? typed.description : null,
        icon:
          typeof typed.icon === "string" && typed.icon.trim()
            ? typed.icon
            : "Square",
        is_available: Boolean(typed.is_available),
      } satisfies BlockTypePayload;
    })
    .filter(Boolean) as BlockTypePayload[];
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
    let blockTypes: BlockTypePayload[] | undefined;

    if (isOwner) {
      const { data, error } = await supabase.rpc("get_block_types");
      if (error) {
        Sentry.captureException(error);
      } else {
        console.log(data);
        blockTypes = formatBlockTypes(data);
      }
    }

    return NextResponse.json(
      { ...result, blockTypes, isOwner } satisfies BffPayload,
      { status: 200 }
    );
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
