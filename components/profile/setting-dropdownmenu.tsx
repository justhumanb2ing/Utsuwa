"use client";

import { ArrowUpRightIcon, Settings2Icon } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProfileBffPayload } from "@/types/profile";
import { Button } from "../ui/button";
import { PageVisibilityToggle } from "./page-visibility-toggle";
import { cn } from "@/lib/utils";

import { HandleChangeForm } from "./handle-change-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

interface SettingDropdownMenuProps {
  profile: Pick<ProfileBffPayload, "isOwner" | "page">;
  supabase: SupabaseClient;
  userId: string | null;
}

export function SettingDropdownMenu({
  profile,
  supabase,
  userId,
}: SettingDropdownMenuProps) {
  const { isOwner, page } = profile;
  const { signOut } = useClerk();
  const pathname = usePathname();

  if (!isOwner) return null;

  return (
    <Dialog>
      <DropdownMenu dir="ltr">
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="rounded-full text-muted-foreground"
          >
            <Settings2Icon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 rounded-xl p-2 space-y-1"
          align="start"
          sideOffset={8}
          side="top"
        >
          <DialogTrigger asChild>
            <DropdownMenuItem className="text-xs flex-row justify-between items-center gap-1">
              <div className="space-y-1">
                <p className="font-medium">Change Handle</p>
                <p className="text-muted-foreground">{page.handle}</p>
              </div>
              <ArrowUpRightIcon />
            </DropdownMenuItem>
          </DialogTrigger>

          <DropdownMenuItem
            className={cn(
              "flex-col items-start gap-3 p-2",
              "focus:bg-inherit focus:text-inherit"
            )}
            onSelect={(event) => event.preventDefault()}
          >
            <PageVisibilityToggle
              profile={profile}
              supabase={supabase}
              userId={userId}
              small
            />
          </DropdownMenuItem>

          <DropdownMenuSeparator className="mx-1" />

          <DropdownMenuItem
            onClick={() => signOut({ redirectUrl: pathname })}
            className="text-xs flex-row justify-between items-center gap-1 text-brand-poppy focus:text-brand-poppy"
          >
            <div className="py-1">Logout</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent
        className="sm:max-w-[425px] border-none rounded-xl"
        showCloseButton={false}
      >
        <DialogHeader className="hidden">
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <HandleChangeForm
          profile={profile}
          supabase={supabase}
          userId={userId}
        />
      </DialogContent>
    </Dialog>
  );
}
