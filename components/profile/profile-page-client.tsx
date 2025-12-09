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
    <main className="min-h-dvh w-full px-12 lg:px-24 mx-auto flex flex-col max-w-xl container xl:max-w-none">
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
                    <SaveStatusProvider>
                      <div className="w-full flex flex-col gap-8 xl:gap-10">
                        {isOwner ? (
                          <div className="flex w-full justify-end">
                            <StatusSection />
                          </div>
                        ) : null}
                        <div className="flex w-full flex-col gap-10 md:gap-12 xl:flex-row xl:items-start xl:justify-between">
                          <div className="w-full xl:w-[40%] min-w-0 space-y-6 xl:sticky xl:top-14">
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
                          <div className="w-full flex-1 min-w-0 space-y-6 xl:max-w-[60%] xl:pl-4">
                            <ProfileBlocksClient
                              initialBlocks={blocks}
                              handle={page.handle}
                              pageId={page.id}
                              isOwner={isOwner}
                              supabase={supabase}
                              userId={userId}
                            />
                          </div>
                        </div>
                        <aside className="sticky bottom-5 left-0 bg-background w-fit">
                          <SettingDropdownMenu
                            profile={profile}
                            supabase={supabase}
                            userId={userId}
                          />
                        </aside>
                      </div>
                    </SaveStatusProvider>
                  );
                }}
              </SuspenseQuery>
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </main>
  );
}
