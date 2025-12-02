"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastManager } from "@/components/ui/toast";
import { useSaveStatus } from "@/components/profile/save-status-context";

const PageSchema = z.object({
  pageId: z.string(),
  handle: z.string(),
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

type UpdatePageResponse =
  | { status: "success"; message: string }
  | { status: "error"; message: string; reason?: string };

const requestUpdatePage = async (
  payload: PageSchemaType
): Promise<UpdatePageResponse> => {
  const res = await fetch("/api/profile/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as UpdatePageResponse;

  if (!res.ok || data.status === "error") {
    return {
      status: "error",
      reason: data.status === "error" ? data.reason : "REQUEST_FAILED",
      message:
        data.status === "error"
          ? data.message
          : "페이지 업데이트 요청이 실패했습니다.",
    };
  }

  return data;
};

export const usePageForm = ({
  pageId,
  handle,
  ownerId,
  isOwner,
  pageTitle,
  pageDescription,
  pageImageUrl,
}: UsePageFormParams) => {
  const { setStatus } = useSaveStatus();
  const wasDirtyRef = useRef<boolean>(false);
  const form = useForm<PageSchemaType>({
    resolver: zodResolver(PageSchema),
    defaultValues: {
      pageId,
      handle,
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
      const loadingId = toastManager.add({
        title: "저장 중…",
        type: "loading",
        timeout: 0,
      });

      try {
        let resolvedImageUrl = data.imageUrl ?? pageImageUrl ?? "";
        if (data.image instanceof File && data.image.size > 0) {
          resolvedImageUrl = await uploadImage(data.image, data.handle);
        }

        const result = await requestUpdatePage({
          pageId: data.pageId,
          handle: data.handle,
          ownerId: data.ownerId,
          title: data.title,
          description: data.description ?? "",
          imageUrl: resolvedImageUrl,
          image: undefined,
        });

        if (result.status === "error") {
          throw new Error(result.reason ?? result.message);
        }

        toastManager.update(loadingId, {
          title: result.message ?? "저장 완료",
          type: "success",
        });

        form.reset({
          ...data,
          image: undefined,
          imageUrl: resolvedImageUrl,
        });
        setStatus("saved");
        wasDirtyRef.current = false;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "잠시 후 다시 시도해 주세요.";

        toastManager.update(loadingId, {
          title: "저장 실패",
          description: message,
          type: "error",
        });
        setStatus("error");
      }
    },
    [form, pageImageUrl, setStatus]
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
