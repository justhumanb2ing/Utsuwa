"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { profileQueryOptions } from "@/service/profile/profile-query-options";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary, Suspense } from "@suspensive/react";
import { SuspenseQuery } from "@suspensive/react-query";
import { createBrowserSupabaseClient } from "@/config/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SaveStatusProvider,
  StatusBadge,
  useSaveStatus,
} from "./save-status-context";
import { ProfileForm } from "./profile-form";
import { ProfileBlocksClient } from "./profile-blocks-client";

import { SettingDropdownMenu } from "./setting-dropdownmenu";

const StatusSection = () => {
  const { status } = useSaveStatus();
  return (
    <div className="z-10 bg-background flex justify-end">
      <div className="p-1 px-2 rounded-md min-w-24 text-center">
        <StatusBadge status={status} />
      </div>
    </div>
  );
};

type ProfilePageClientProps = {
  handle: string;
  userId: string | null;
};

export default function ProfilePageClient({
  handle,
  userId,
}: ProfilePageClientProps) {
  const { getToken } = useAuth();
  const supabase: SupabaseClient = useMemo(
    () => createBrowserSupabaseClient(getToken),
    [getToken]
  );

  return (
    <main className="min-h-dvh w-full flex flex-col bg-background">
      <SaveStatusProvider>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary onReset={reset} fallback={<div>Error</div>}>
              <Suspense fallback={<div>Loading</div>}>
                <SuspenseQuery
                  {...profileQueryOptions.byHandle({
                    supabase,
                    handle,
                    userId,
                  })}
                >
                  {({ data: { isOwner, page, blocks } }) => {
                    const profile = { isOwner, page };

                    return (
                      <div className="w-full px-4 md:px-6 xl:px-8 py-6  relative">
                        <div className="max-w-lg xl:max-w-[1400px] mx-auto flex flex-col xl:flex-row items-start justify-center gap-8">
                          <section className="w-full xl:w-7xl flex flex-col gap-6 shrink">
                            {isOwner ? (
                              <div className="flex w-full justify-end">
                                <StatusSection />
                              </div>
                            ) : null}
                            <div className="px-10 sm:px-16">
                              <ProfileForm
                                pageId={page.id}
                                handle={page.handle}
                                ownerId={page.owner_id}
                                isOwner={isOwner}
                                pageTitle={page.title ?? undefined}
                                pageDescription={page.description ?? undefined}
                                pageImageUrl={page.image_url ?? undefined}
                                supabase={supabase}
                                userId={userId}
                              />
                            </div>
                            <div className="fixed bottom-10 w-full">
                              <SettingDropdownMenu
                                profile={profile}
                                supabase={supabase}
                                userId={userId}
                              />
                            </div>
                          </section>
                          <section className="w-[420px] xl:w-[800px] shrink-0 transition-all duration-300 mx-auto xl:mx-0">
                            <ProfileBlocksClient
                              initialBlocks={blocks}
                              handle={page.handle}
                              pageId={page.id}
                              isOwner={isOwner}
                              supabase={supabase}
                              userId={userId}
                            />
                          </section>
                        </div>
                      </div>
                    );
                  }}
                </SuspenseQuery>
              </Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </SaveStatusProvider>
    </main>
  );
}
