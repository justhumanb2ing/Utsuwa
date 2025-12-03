import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prefetchProfileByHandle } from "@/service/profile/profile-query-options";
import { HydrationBoundary } from "@tanstack/react-query";
import { createServerSupabaseClient } from "@/config/supabase";

import ProfilePageClient from "@/components/profile/profile-page-client";

type ProfilePageProps = {
  params: Promise<{ handle: string }>;
};

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
