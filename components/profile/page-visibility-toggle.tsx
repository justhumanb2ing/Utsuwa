"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { pageQueryOptions } from "@/service/pages/page-query-options";
import { useSaveStatus } from "./save-status-context";
import type { SupabaseClient } from "@supabase/supabase-js";

type PageVisibilityToggleProps = {
  pageId: string;
  ownerId: string;
  handle: string;
  isPublic: boolean | null;
  isOwner: boolean;
  supabase: SupabaseClient;
  userId: string | null;
};

export function PageVisibilityToggle({
  pageId,
  ownerId,
  handle,
  isPublic,
  isOwner,
  supabase,
  userId,
}: PageVisibilityToggleProps) {
  const queryClient = useQueryClient();
  const { setStatus } = useSaveStatus();

  const toggleVisibility = useMutation(
    pageQueryOptions.toggleVisibility({
      pageId,
      ownerId,
      handle,
      supabase,
      userId,
      queryClient,
    })
  );

  const checked = useMemo(
    () => Boolean(isPublic),
    [isPublic]
  );

  const handleToggle = useCallback(async () => {
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
    }
  }, [setStatus, toggleVisibility]);

  if (!isOwner) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">페이지 공개</p>
        <p className="text-xs text-muted-foreground">
          공개 시 누구나 프로필을 볼 수 있어요.
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
