"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSaveStatus } from "@/components/profile/save-status-context";
import { pageQueryOptions } from "@/service/pages/page-query-options";
import { normalizeHandle } from "@/lib/handle";
import type { SupabaseClient } from "@supabase/supabase-js";

const PageSchema = z.object({
  pageId: z.string(),
  ownerId: z.string(),
  title: z.string().min(1, "필수 입력"),
  description: z.string().optional(),
  image: z.any().optional(),
  imageUrl: z.string().optional(),
});

export type PageSchemaType = z.infer<typeof PageSchema>;

type UsePageFormParams = {
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

const uploadImage = async (file: File, handle: string): Promise<string> => {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("handle", handle);

  const res = await fetch("/api/uploads/page-image", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "이미지 업로드 실패");
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) {
    throw new Error("업로드 URL이 비어 있습니다.");
  }
  return data.url;
};

export const usePageForm = ({
  pageId,
  handle,
  ownerId,
  isOwner,
  pageTitle,
  pageDescription,
  pageImageUrl,
  supabase,
  userId,
}: UsePageFormParams) => {
  const { setStatus } = useSaveStatus();
  const queryClient = useQueryClient();
  const normalizedHandle = normalizeHandle(handle);
  const updatePageMutation = useMutation(
    pageQueryOptions.update({
      pageId,
      handle: normalizedHandle,
      ownerId,
      queryClient,
      supabase,
      userId,
    })
  );
  const wasDirtyRef = useRef<boolean>(false);
  const form = useForm<PageSchemaType>({
    resolver: zodResolver(PageSchema),
    defaultValues: {
      pageId,
      ownerId,
      title: pageTitle ?? "",
      description: pageDescription ?? "",
      image: undefined,
      imageUrl: pageImageUrl ?? "",
    },
  });

  const watchedImage = form.watch("image") as File | undefined;
  const watchedImageUrl = form.watch("imageUrl");

  const preview = useMemo(() => {
    if (watchedImage instanceof File) {
      return URL.createObjectURL(watchedImage);
    }
    return watchedImageUrl ?? "";
  }, [watchedImage, watchedImageUrl]);

  useEffect(() => {
    return () => {
      if (watchedImage instanceof File && preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview, watchedImage]);

  useEffect(() => {
    if (form.formState.isSubmitting || !isOwner) return;
    if (form.formState.isDirty && !wasDirtyRef.current) {
      wasDirtyRef.current = true;
      setStatus("dirty");
    }
  }, [form.formState.isDirty, form.formState.isSubmitting, isOwner, setStatus]);

  const onSubmit = useCallback(
    async (data: PageSchemaType) => {
      setStatus("saving");

      try {
        let resolvedImageUrl = data.imageUrl ?? pageImageUrl ?? "";
        if (data.image instanceof File && data.image.size > 0) {
          resolvedImageUrl = await uploadImage(data.image, normalizedHandle);
        }

        const shouldUpdatePage =
          Boolean(form.formState.dirtyFields.title) ||
          Boolean(form.formState.dirtyFields.description) ||
          Boolean(form.formState.dirtyFields.image) ||
          Boolean(form.formState.dirtyFields.imageUrl);

        if (shouldUpdatePage) {
          const result = await updatePageMutation.mutateAsync({
            pageId: data.pageId,
            handle: normalizedHandle,
            ownerId: data.ownerId,
            title: data.title,
            description: data.description ?? "",
            imageUrl: resolvedImageUrl,
          });

          if (!result.ok) {
            setStatus("error");
            throw new Error(result.reason);
          }
        }

        form.reset({
          ...data,
          image: undefined,
          imageUrl: resolvedImageUrl,
        });
        setStatus("saved");
        wasDirtyRef.current = false;
      } catch (error) {
        setStatus("error");
        throw error;
      }
    },
    [form, normalizedHandle, pageImageUrl, setStatus, updatePageMutation]
  );

  useEffect(() => {
    if (!isOwner) return;
    if (!form.formState.isDirty || form.formState.isSubmitting) return;
    const timer = setTimeout(() => {
      form.handleSubmit(onSubmit)();
    }, 5000);
    return () => clearTimeout(timer);
  }, [
    form,
    form.formState.isDirty,
    form.formState.isSubmitting,
    isOwner,
    onSubmit,
  ]);

  return { form, preview, isOwner, onSubmit };
};
