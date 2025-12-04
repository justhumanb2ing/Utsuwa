import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prefetchProfileByHandle } from "@/service/profile/profile-query-options";
import { HydrationBoundary } from "@tanstack/react-query";
import { createServerSupabaseClient } from "@/config/supabase";

import ProfilePageClient from "@/components/profile/profile-page-client";

import type { Metadata, ResolvingMetadata } from "next";
import { fetchProfile } from "@/service/profile/fetch-profile";

type ProfilePageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata(
  { params }: ProfilePageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const handle = decodeURIComponent((await params).handle);
  const supabase = await createServerSupabaseClient();

  // Fetch Page information
  const data = await fetchProfile({ supabase, handle, userId: null });

  const title =
    data?.page.title ??
    (handle ? `@${handle.replace(/^@+/, "")} | Nook` : "Profile | Nook");
  const description =
    data?.page.description ??
    "See this Nook profile with links, blocks, and more.";
  const imageUrl = data?.page.image_url ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  const decodedHandle = decodeURIComponent(handle);
  const supabase = await createServerSupabaseClient();
  const { userId } = await auth();

  const fetchParams = {
    supabase,
    handle: decodedHandle,
    userId: userId ?? null,
  };

  const { data, dehydrated } = await prefetchProfileByHandle(fetchParams);

  if (!data) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrated}>
      <ProfilePageClient handle={decodedHandle} userId={userId ?? null} />
    </HydrationBoundary>
  );
}
