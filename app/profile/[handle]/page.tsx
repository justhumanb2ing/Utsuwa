import { notFound } from "next/navigation";
import { headers } from "next/headers";
import {
  // fetchProfileByHandle,
  prefetchProfileByHandle,
} from "@/service/profile/profile-query-options";
import { ProfilePageClient } from "@/components/profile/profile-page-client";
import { HydrationBoundary } from "@tanstack/react-query";

type ProfilePageProps = {
  params: Promise<{ handle: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  const decodedHandle = decodeURIComponent(handle);
  const headerStore = await headers();

  const fetchParams = { handle: decodedHandle, headers: headerStore };

  const { data, dehydrated } = await prefetchProfileByHandle(fetchParams);

  if (!data) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrated}>
      <main className="min-h-dvh flex flex-col relative max-w-7xl mx-auto px-4">
        <ProfilePageClient
          page={data.page}
          blocks={data.blocks}
          isOwner={data.isOwner}
        />
      </main>
    </HydrationBoundary>
  );
}
