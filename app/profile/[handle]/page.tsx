import { headers } from "next/headers";
import { notFound } from "next/navigation";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";
import type { Tables } from "@/types/database.types";

type ProfilePageProps = {
  params: Promise<{ handle: string }>;
};

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

type BffResponse = {
  page: PagePayload;
  profile: ProfilePayload;
  isOwner: boolean;
  blockTypes?: BlockTypePayload[] | null;
};

const resolveIconComponent = (iconName: string) => {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  const Icon = icons[iconName];
  return Icon ?? LucideIcons.Square;
};

const buildApiUrl = async (handle: string): Promise<string> => {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const encodedHandle = encodeURIComponent(handle);

  if (!host) {
    throw new Error("Missing host header");
  }

  return `${protocol}://${host}/api/profile/${encodedHandle}`;
};

const fetchProfileFromBff = async (
  handle: string
): Promise<BffResponse | null> => {
  const apiUrl = await buildApiUrl(handle);
  const headerStore = await headers();
  const response = await fetch(apiUrl, {
    cache: "no-store",
    headers: {
      cookie: headerStore.get("cookie") ?? "",
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Profile BFF fetch failed: ${response.status}`);
  }
  return (await response.json()) as BffResponse;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  const result = await fetchProfileFromBff(decodeURIComponent(handle));

  if (!result) {
    notFound();
  }
  console.log(result)
  const { page, profile, isOwner } = result;
  const blockTypes: BlockTypePayload[] =
    (result.blockTypes ?? []).map((block) => ({
      ...block,
      icon: block.icon || "Square",
    })) ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <section className="space-y-6">
        <ProfileForm
          isOwner={isOwner}
          pageTitle={page.title ?? undefined}
          pageDescription={page.description ?? undefined}
          profileAvatarUrl={profile.avatar_url ?? undefined}
        />
      </section>
      {isOwner && blockTypes.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900">
            사용 가능한 블록
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {blockTypes.map((block, index) => {
              const Icon = resolveIconComponent(block.icon);
              const key = block.id ?? `${block.icon}-${index}`;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-50 text-zinc-800"
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-zinc-900">
                        {block.name ?? block.icon}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {block.description ??
                          (block.is_available ? "사용 가능" : "준비 중")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      block.is_available ? "text-green-600" : "text-amber-600"
                    }`}
                  >
                    {block.is_available ? "사용 가능" : "준비 중"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
