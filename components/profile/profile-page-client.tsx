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
import SavingStatusSection from "./saving-status-section";
import { pageQueryOptions } from "@/service/pages/page-query-options";

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
                      <div className="w-full px-4 md:px-6 xl:px-8 py-6 relative">
                        <div className="max-w-lg xl:max-w-[1600px] mx-auto flex flex-col xl:flex-row items-start justify-center gap-8">
                          <section className="w-full xl:w-7xl flex flex-col gap-6 shrink">
                            {isOwner ? (
                              <div className="flex w-full justify-end">
                                <SavingStatusSection />
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
                        <aside className="fixed bottom-10 w-full flex items-center gap-2">
                          <div>
                            {pages.map((page) => (
                              <p
                                key={page.id}
                                // href={page.href}
                                className="p-2 text-sm text-neutral-700"
                              >
                                {page.label}
                              </p>
                            ))}
                          </div>
                          <SettingDropdownMenu
                            profile={profile}
                            supabase={supabase}
                            userId={userId}
                          />
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
