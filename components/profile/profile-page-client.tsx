"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { profileQueryOptions } from "@/service/profile/profile-query-options";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary, Suspense } from "@suspensive/react";
import { SuspenseQueries } from "@suspensive/react-query";
import { createBrowserSupabaseClient } from "@/config/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SaveStatusProvider } from "./save-status-context";
import { ProfileForm } from "./profile-form";
import { ProfileBlocksClient } from "./profile-blocks-client";

import { SettingDropdownMenu } from "./setting-dropdownmenu";
import { pageQueryOptions } from "@/service/pages/page-query-options";
import { cn } from "@/lib/utils";
import SettingMobileSheet from "./setting-mobile-sheet";

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
    <main
      id="container"
      className="relative min-h-dvh h-dvh max-h-dvh w-full overflow-y-auto flex flex-col bg-background"
    >
      <SaveStatusProvider>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary onReset={reset} fallback={<div>Error</div>}>
              <Suspense fallback={<div>Loading</div>}>
                <SuspenseQueries
                  queries={[
                    profileQueryOptions.byHandle({
                      supabase,
                      handle,
                      userId,
                    }),
                    pageQueryOptions.byOwner(userId, supabase, userId),
                  ]}
                >
                  {([
                    {
                      data: { isOwner, page, blocks },
                    },
                    { data: pages },
                  ]) => {
                    const profile = { isOwner, page };

                    return (
                      <div className="w-full pt-16 relative h-full">
                        <div className="max-w-lg xl:max-w-[1600px] mx-auto flex flex-col xl:flex-row items-start justify-center gap-8 h-full px-4 md:px-6 xl:px-0">
                          <section className="w-full xl:w-7xl flex flex-col gap-6 shrink xl:sticky xl:top-16">
                            <div className="px-10 sm:px-16 relative">
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

                              <div className="absolute top-0 right-10 xl:hidden">
                                <SettingMobileSheet
                                  profile={profile}
                                  supabase={supabase}
                                  userId={userId}
                                />
                              </div>
                            </div>
                          </section>
                          <section className="w-[420px] xl:w-[800px] shrink-0 transition-all duration-300 mx-auto xl:mx-0 grow">
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
                        <aside
                          className={cn(
                            "bg-brand-cloud/20 p-6",
                            "xl:fixed xl:bottom-10 xl:left-24 xl:bg-transparent"
                          )}
                        >
                          <div className="max-w-lg mx-auto flex items-center w-full gap-2 px-4 md:px-8 xl:px-0">
                            <div>
                              {pages.map((page) => (
                                <p
                                  key={page.id}
                                  // href={page.href}
                                  className="p-2 text-sm text-neutral-700 font-medium"
                                >
                                  {page.label}
                                </p>
                              ))}
                            </div>
                            <div className="hidden xl:flex">
                              <SettingDropdownMenu
                                profile={profile}
                                supabase={supabase}
                                userId={userId}
                              />
                            </div>
                          </div>
                        </aside>
                      </div>
                    );
                  }}
                </SuspenseQueries>
              </Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </SaveStatusProvider>
    </main>
  );
}
