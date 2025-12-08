/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prefetchProfileByHandle } from "@/service/profile/profile-query-options";
import { HydrationBoundary } from "@tanstack/react-query";
import { createServerSupabaseClient } from "@/config/supabase";
import { JsonLd } from "@/components/seo/json-ld";

import ProfilePageClient from "@/components/profile/profile-page-client";

import type { Metadata, ResolvingMetadata } from "next";
import { fetchProfile } from "@/service/profile/fetch-profile";
import { siteConfig } from "@/config/metadata-config";

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

  const title = data?.page.title!;
  const description = data?.page.description ?? `${title}'s profile`;
  const imageUrl = data?.page.image_url ?? undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteConfig.url}/profile/@${handle}`,
      languages: {
        "ko-KR": `${siteConfig.url}/profile/@${handle}`,
        "en-US": `${siteConfig.url}/profile/@${handle}`,
      },
    },
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      url: `${siteConfig.url}/profile/@${handle}`,
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

  const profileTitle = data.page.title ?? decodedHandle;
  const profileDescription =
    data.page.description ?? `${profileTitle}'s profile`;
  const profileUrl = `${siteConfig.url}/profile/@${decodedHandle}`;

  const profileJsonLd = data.page.is_public
    ? {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        name: profileTitle,
        description: profileDescription,
        url: profileUrl,
        isPartOf: {
          "@type": "WebSite",
          name: siteConfig.title,
          url: siteConfig.url,
        },
        mainEntity: {
          "@type": "Person",
          name: profileTitle,
          alternateName: `@${decodedHandle}`,
          description: profileDescription,
          image: data.page.image_url ?? undefined,
          url: profileUrl,
        },
      }
    : null;

  return (
    <>
      {profileJsonLd ? <JsonLd data={profileJsonLd} /> : null}
      <HydrationBoundary state={dehydrated}>
        <ProfilePageClient handle={decodedHandle} userId={userId ?? null} />
      </HydrationBoundary>
    </>
  );
}
