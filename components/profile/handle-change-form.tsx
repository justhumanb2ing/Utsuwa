"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useHandleChangeForm } from "@/hooks/use-handle-change-form";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ProfileBffPayload } from "@/types/profile";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/metadata-config";
import { LoaderIcon, SparklesIcon } from "lucide-react";

interface HandleChangeFormProps {
  profile: Pick<ProfileBffPayload, "isOwner" | "page">;
  supabase: SupabaseClient;
  userId: string | null;
}

export const HandleChangeForm = ({
  profile,
  supabase,
  userId,
}: HandleChangeFormProps) => {
  const { isOwner, page } = profile;
  const { form, onSubmit, isPending } = useHandleChangeForm({
    pageId: page.id,
    ownerId: page.owner_id,
    handle: page.handle,
    supabase,
    userId,
  });

  if (!isOwner) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <input type="hidden" {...form.register("pageId")} />
        <input type="hidden" {...form.register("ownerId")} />

        <FormField
          control={form.control}
          name="handle"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative w-full">
                  <Input
                    {...field}
                    id={"handle"}
                    name="handle"
                    autoFocus
                    placeholder="new handle"
                    type="text"
                    required
                    autoComplete="off"
                    className={cn(
                      "peer ps-44 pe-12 border-none w-full",
                      "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                      "bg-muted shadow-none h-12 rounded-xl focus-visible:ring-0",
                      "data-invalid:border-destructive data-invalid:text-destructive"
                    )}
                    readOnly={isPending}
                  />
                  <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground text-sm peer-disabled:opacity-50">
                    {siteConfig.url.slice(8)}/@
                  </span>
                  <div className="absolute inset-y-0 end-3 flex items-center justify-center">
                    <Button
                      size={"icon-sm"}
                      type="submit"
                      variant={"secondary"}
                      disabled={isPending}
                      className="bg-brand-indigo hover:bg-brand-indigo-hover text-white"
                    >
                      {isPending ? (
                        <LoaderIcon className="animate-spin" />
                      ) : (
                        <SparklesIcon />
                      )}
                    </Button>
                  </div>
                </div>
              </FormControl>
              <p className="text-xs text-zinc-500">
                3~20자의 영문 소문자와 숫자만 입력하세요.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
