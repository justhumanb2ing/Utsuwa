"use client";

import { useCallback, useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { pageQueryOptions } from "@/service/pages/page-query-options";
import { useSaveStatus } from "./save-status-context";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileBffPayload } from "@/types/profile";
import { cn } from "@/lib/utils";

type PageVisibilityToggleProps = {
  profile: Pick<ProfileBffPayload, "isOwner" | "page">;
  supabase: SupabaseClient;
  userId: string | null;
  small?: boolean;
};

export function PageVisibilityToggle({
  profile,
  supabase,
  userId,
  small,
}: PageVisibilityToggleProps) {
  const { isOwner, page } = profile;

  const queryClient = useQueryClient();
  const { setStatus } = useSaveStatus();
  const [checked, setChecked] = useState(Boolean(page.is_public));

  const toggleVisibility = useMutation(
    pageQueryOptions.toggleVisibility({
      pageId: page.id,
      ownerId: page.owner_id,
      handle: page.handle,
      supabase,
      userId,
      queryClient,
    })
  );

  useEffect(() => {
    setChecked(Boolean(page.is_public));
  }, [page.is_public]);

  const handleToggle = useCallback(async () => {
    const previous = checked;
    const next = !previous;

    setChecked(next);
    setStatus("saving");
    try {
      const result = await toggleVisibility.mutateAsync();
      if (!result.ok) {
        setStatus("error");
        throw new Error(result.reason);
      }
      setStatus("saved");
    } catch (error) {
      setStatus("error");
      setChecked(previous);
      Sentry.captureException(error);
    }
  }, [checked, setStatus, toggleVisibility]);

  if (!isOwner) return null;

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div className="space-y-1">
        <p
          className={cn(
            "text-sm font-medium text-foreground",
            small && "text-xs"
          )}
        >
          Change visibility
        </p>
        <p className={cn("text-sm text-muted-foreground", small && "text-xs")}>
          {checked ? (
            <span>Public — Anyone can view</span>
          ) : (
            <span>Private — Only you can view</span>
          )}
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={() => void handleToggle()}
        disabled={toggleVisibility.isPending}
        aria-label="페이지 공개 상태 전환"
      />
    </div>
  );
}
