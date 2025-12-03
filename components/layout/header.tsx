import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { prefetchPageListByOwner } from "@/service/pages/page-query-options";
import HeaderClient from "./header-client";
import { HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/config/supabase";

export default async function Header() {
  const { userId, sessionClaims } = await auth();
  const isOnboardingComplete =
    sessionClaims?.metadata?.onboardingComplete === true;
  const shouldPrefetchPages = Boolean(userId && isOnboardingComplete);

  let dehydrated;

  if (shouldPrefetchPages) {
    try {
      const supabase = await createServerSupabaseClient();
      dehydrated = (
        await prefetchPageListByOwner(userId!, supabase, userId!)
      ).dehydrated;
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  return (
    <HydrationBoundary state={dehydrated}>
      <HeaderClient
        userId={userId ?? null}
        canLoadPages={shouldPrefetchPages}
      />
    </HydrationBoundary>
  );
}
