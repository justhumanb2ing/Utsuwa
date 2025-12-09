"use client";

import Image from "next/image";
import { useId } from "react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { usePageForm } from "@/hooks/use-page-form";
import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileFormProps = {
  pageId: string;
  handle: string;
  ownerId: string;
  isOwner: boolean;
  pageTitle?: string;
  pageDescription?: string;
  pageImageUrl?: string;
  supabase: SupabaseClient;
  userId: string | null;
};

export function ProfileForm({
  pageId,
  handle,
  ownerId,
  isOwner,
  pageTitle,
  pageDescription,
  pageImageUrl,
  supabase,
  userId,
}: ProfileFormProps) {
  const fileInputId = useId();
  const { form, preview, onSubmit } = usePageForm({
    pageId,
    handle,
    ownerId,
    isOwner,
    pageTitle,
    pageDescription,
    pageImageUrl,
    supabase,
    userId,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit(onSubmit)();
        }}
        className="space-y-5 min-w-0"
      >
        <input type="hidden" {...form.register("pageId")} />
        <input type="hidden" {...form.register("ownerId")} />
        <input type="hidden" {...form.register("imageUrl")} />

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Input
              id={fileInputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) =>
                form.setValue("image", event.target.files?.[0], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={!isOwner}
            />
            <Button
              type="button"
              onClick={() =>
                isOwner && document.getElementById(fileInputId)?.click()
              }
              variant={"secondary"}
              className="size-40 xl:size-52 overflow-hidden rounded-full focus:outline-none hover:ring hover:ring-zinc-200 p-0 mb-6"
              aria-label="페이지 이미지 변경"
              disabled={!isOwner}
            >
              {preview ? (
                <Image
                  src={preview}
                  alt="페이지 이미지"
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center" />
              )}
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="페이지 제목"
                  className={cn(
                    "w-full min-w-0 rounded-none border-0 shadow-none px-3 py-2 text-3xl md:text-4xl xl:text-5xl! font-bold! text-zinc-900 h-fit! p-0 wrap-break-word whitespace-normal",
                    "focus:outline-none focus:ring-0 focus-visible:ring-0"
                  )}
                  readOnly={!isOwner}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="페이지 설명을 입력하세요"
                  className={cn(
                    "w-full min-w-0 border-none rounded-none shadow-none p-0 text-zinc-900 min-h-[120px] resize-none wrap-break-word whitespace-pre-wrap",
                    "focus-visible:outline-none focus-visible:ring-0 text-base! xl:text-lg!"
                  )}
                  readOnly={!isOwner}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
