import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prefetchProfileByHandle } from "@/service/profile/profile-query-options";
import { HydrationBoundary } from "@tanstack/react-query";

import ProfilePageClient from "@/components/profile/profile-page-client";

type ProfilePageProps = {
  params: Promise<{ handle: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  const headerStore = await headers();
  const decodedHandle = decodeURIComponent(handle);

  const fetchParams = {
    handle: decodedHandle,
    headers: {
      cookie: headerStore.get("cookie") ?? "",
    },
  };

  const { data, dehydrated } = await prefetchProfileByHandle(fetchParams);

  if (!data) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrated}>
      <ProfilePageClient fetchParams={fetchParams} />
    </HydrationBoundary>
  );
}
