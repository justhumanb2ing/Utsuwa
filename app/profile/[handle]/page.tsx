import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import type { Tables } from "@/types/database.types";
import { createServerSupabaseClient } from "@/config/supabase";

type ProfilePageProps = {
  params: Promise<{ handle: string }>;
};

type PageSummary = Pick<
  Tables<"pages">,
  "id" | "handle" | "title" | "description" | "owner_id"
>;
type ProfileSummary = Pick<
  Tables<"profile">,
  "user_id" | "display_name" | "avatar_url"
>;

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
  handle: string
): Promise<{ page: PageSummary; profile: ProfileSummary } | null> => {
  const handleCandidates = buildHandleCandidates(handle);
  if (handleCandidates.length === 0) return null;

  const supabase = await createServerSupabaseClient();
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id, handle, title, description, owner_id")
    .in("handle", handleCandidates)
    .order("ordering", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .maybeSingle<PageSummary>();

  if (pageError) {
    throw pageError;
  }

  if (!page) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("user_id, display_name, avatar_url")
    .eq("user_id", page.owner_id)
    .maybeSingle<ProfileSummary>();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    return null;
  }

  return { page, profile };
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  const user = await currentUser();
  const result = await fetchPageAndProfile(handle);

  if (!result) {
    notFound();
  }

  const { page, profile } = result;

  const isOwner = Boolean(user?.id && user.id === profile.user_id);

  const formatHandleForPath = (rawHandle: string): string => {
    const normalizedHandle = normalizeHandle(rawHandle);
    return normalizedHandle ? `@${normalizedHandle}` : "";
  };
  const canonicalHandle = formatHandleForPath(page.handle);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <section className="space-y-6">
        <ProfileForm
          handle={canonicalHandle || page.handle}
          isOwner={isOwner}
          pageTitle={page.title ?? undefined}
          pageDescription={page.description ?? undefined}
          profileAvatarUrl={profile.avatar_url ?? undefined}
        />
      </section>
    </div>
  );
}
