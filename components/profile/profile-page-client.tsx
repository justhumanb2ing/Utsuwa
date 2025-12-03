"use client";

import { profileQueryOptions } from "@/service/profile/profile-query-options";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary, Suspense } from "@suspensive/react";
import { SuspenseQuery } from "@suspensive/react-query";
import {
  SaveStatusProvider,
  StatusBadge,
  useSaveStatus,
} from "./save-status-context";
import { ProfileForm } from "./profile-form";
import { ProfileBlocksClient } from "./profile-blocks-client";
import { HandleChangeForm } from "./handle-change-form";

import type { FetchProfileParams } from "@/service/profile/fetch-profile";

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

export default function ProfilePageClient({
  fetchParams,
}: {
  fetchParams: FetchProfileParams;
}) {
  return (
    <main className="min-h-dvh flex flex-col relative max-w-7xl mx-auto px-4">
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary onReset={reset} fallback={<div>Error</div>}>
            <Suspense fallback={<div>Loading</div>}>
              <SuspenseQuery {...profileQueryOptions.byHandle(fetchParams)}>
                {({ data: { isOwner, page, blocks } }) => (
                  <SaveStatusProvider>
                    <main className="space-y-6">
                      {isOwner && <StatusSection />}
                      {isOwner ? (
                        <HandleChangeForm
                          pageId={page.id}
                          ownerId={page.owner_id}
                          handle={page.handle}
                          isOwner={isOwner}
                        />
                      ) : null}
                      <ProfileForm
                        pageId={page.id}
                        handle={page.handle}
                        ownerId={page.owner_id}
                        isOwner={isOwner}
                        pageTitle={page.title ?? undefined}
                        pageDescription={page.description ?? undefined}
                        pageImageUrl={page.image_url ?? undefined}
                      />
                      <ProfileBlocksClient
                        initialBlocks={blocks}
                        handle={page.handle}
                        pageId={page.id}
                        isOwner={isOwner}
                      />
                    </main>
                  </SaveStatusProvider>
                )}
              </SuspenseQuery>
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </main>
  );
}
