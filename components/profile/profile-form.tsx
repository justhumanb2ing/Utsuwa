"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
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
  const titleRef = useRef<HTMLParagraphElement | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const { form, preview, onSubmit, handleImageChange } = usePageForm({
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
  const titleValue = form.watch("title") ?? "";
  const descriptionValue = form.watch("description") ?? "";

  useEffect(() => {
    const element = titleRef.current;
    if (!element) return;
    const currentText = element.textContent ?? "";
    if (currentText !== titleValue) {
      element.textContent = titleValue;
    }
  }, [titleValue]);

  useEffect(() => {
    const element = descriptionRef.current;
    if (!element) return;
    const currentText = element.textContent ?? "";
    if (currentText !== descriptionValue) {
      element.textContent = descriptionValue;
    }
  }, [descriptionValue]);

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
                handleImageChange(event.target.files?.[0] ?? undefined)
              }
              disabled={!isOwner}
            />
            <Button
              type="button"
              onClick={() =>
                isOwner && document.getElementById(fileInputId)?.click()
              }
              variant={"secondary"}
              className="size-40 xl:size-52 overflow-hidden rounded-full focus:outline-none hover:ring hover:ring-zinc-200 p-0 mb-6 disabled:opacity-100"
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
                <p
                  role="textbox"
                  aria-label="페이지 제목"
                  aria-placeholder="페이지 제목"
                  contentEditable={isOwner}
                  suppressContentEditableWarning
                  className={cn(
                    "w-full min-w-0 rounded-none border-0 shadow-none px-2 py-2 text-3xl md:text-4xl xl:text-5xl! font-bold! text-zinc-900 h-fit! wrap-break-word",
                    "truncate sm:whitespace-normal! sm:line-clamp-2 md:line-clamp-3 focus:line-clamp-none focus:whitespace-normal! focus:overflow-visible",
                    "focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:overflow-visible",
                    "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:block",
                    !isOwner && "cursor-default select-text",
                    isOwner && "cursor-text"
                  )}
                  data-placeholder="페이지 제목"
                  onInput={(event: FormEvent<HTMLParagraphElement>) => {
                    const nextValue = event.currentTarget.textContent ?? "";
                    if (nextValue !== field.value) {
                      field.onChange(nextValue);
                    }
                  }}
                  onBlur={(event) => {
                    field.onBlur();
                    const nextValue = event.currentTarget.textContent ?? "";
                    if (nextValue !== field.value) {
                      field.onChange(nextValue);
                    }
                  }}
                  onKeyDown={(event: KeyboardEvent<HTMLParagraphElement>) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                  ref={(node) => {
                    field.ref(node);
                    titleRef.current = node;
                  }}
                />
              </FormControl>
              <FormMessage className="ml-2"/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <p
                  role="textbox"
                  aria-label="페이지 설명"
                  aria-placeholder="페이지 설명을 입력하세요"
                  contentEditable={isOwner}
                  suppressContentEditableWarning
                  className={cn(
                    "w-full min-w-0 border-none rounded-none shadow-none px-2 text-zinc-900 min-h-[60px] resize-none wrap-break-word whitespace-pre-wrap",
                    "truncate whitespace-pre-wrap!",
                    "line-clamp-4 sm:line-clamp-6 md:line-clamp-8 focus:line-clamp-none focus:overflow-visible focus:whitespace-pre-wrap!",
                    "focus-visible:outline-none focus-visible:ring-0 text-base! xl:text-lg!",
                    "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:block",
                    !isOwner && "cursor-default select-text",
                    isOwner && "cursor-text"
                  )}
                  data-placeholder="페이지 설명을 입력하세요"
                  onInput={(event: FormEvent<HTMLParagraphElement>) => {
                    const nextValue = event.currentTarget.textContent ?? "";
                    if (nextValue !== field.value) {
                      field.onChange(nextValue);
                    }
                  }}
                  onBlur={(event) => {
                    field.onBlur();
                    const nextValue = event.currentTarget.textContent ?? "";
                    if (nextValue !== field.value) {
                      field.onChange(nextValue);
                    }
                  }}
                  ref={(node) => {
                    field.ref(node);
                    descriptionRef.current = node;
                  }}
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
