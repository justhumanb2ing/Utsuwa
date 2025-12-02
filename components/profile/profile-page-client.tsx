"use client";

import {
  SaveStatusProvider,
  StatusBadge,
  useSaveStatus,
} from "@/components/profile/save-status-context";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileBlocksClient } from "@/components/profile/profile-blocks-client";
import type { ProfileBffPayload } from "@/types/profile";

type ProfilePageClientProps = ProfileBffPayload;

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

export const ProfilePageClient = ({
  page,
  blocks,
  isOwner,
}: ProfilePageClientProps) => {
  return (
    <SaveStatusProvider>
      <main className="space-y-6">
        {isOwner && <StatusSection />}
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
  );
};
