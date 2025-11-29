import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import type { Tables } from "@/types/database.types";
import { BlockRegistryPanel } from "@/components/layout/block-registry";
import { PageBlocks } from "@/components/profile/page-blocks";

type ProfilePageProps = {
  params: Promise<{ handle: string }>;
};

type PagePayload = Pick<
  Tables<"pages">,
  "id" | "handle" | "title" | "description" | "image_url" | "owner_id"
>;

type BlockPayload = Pick<
  Tables<"blocks">,
  "id" | "type" | "ordering" | "created_at"
>;

type BffResponse = {
  page: PagePayload;
  isOwner: boolean;
  blocks: BlockPayload[];
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

  const { page, isOwner, blocks } = result;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <section className="space-y-6">
        <ProfileForm
          pageId={page.id}
          handle={page.handle}
          isOwner={isOwner}
          pageTitle={page.title ?? undefined}
          pageDescription={page.description ?? undefined}
          pageImageUrl={page.image_url ?? undefined}
        />
      </section>
      {isOwner ? <BlockRegistryPanel /> : null}
      <PageBlocks blocks={blocks} />
    </div>
  );
}
