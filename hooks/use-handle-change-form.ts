"use client";

import { useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { pageQueryOptions } from "@/service/pages/page-query-options";
import { useSaveStatus } from "@/components/profile/save-status-context";
import {
  normalizeHandle,
  validateHandle,
} from "@/lib/handle";
import type { SupabaseClient } from "@supabase/supabase-js";

const HandleSchema = z.object({
  pageId: z.string(),
  ownerId: z.string(),
  handle: z
    .string()
    .min(1, "핸들을 입력하세요.")
    .trim()
    .superRefine((value, ctx) => {
      if (value.includes("@")) {
        ctx.addIssue({
          code: "custom",
          message: "@ 없이 입력해 주세요.",
        });
        return;
      }

      const result = validateHandle(value);
      if (!result.ok) {
        const message =
          result.reason === "RESERVED"
            ? "사용할 수 없는 핸들입니다."
            : result.reason === "INVALID_CASE"
            ? "소문자만 사용할 수 있습니다."
            : "3~20자의 영문 소문자와 숫자만 사용할 수 있습니다.";

        ctx.addIssue({
          code: "custom",
          message,
        });
      }
    })
    .transform((value) => normalizeHandle(value)),
});

type HandleSchemaType = z.infer<typeof HandleSchema>;

type UseHandleChangeFormParams = {
  pageId: string;
  ownerId: string;
  handle: string;
  supabase: SupabaseClient;
  userId: string | null;
};

export const useHandleChangeForm = ({
  pageId,
  ownerId,
  handle,
  supabase,
  userId,
}: UseHandleChangeFormParams) => {
  const router = useRouter();
  const { setStatus } = useSaveStatus();
  const queryClient = useQueryClient();
  const normalizedInitialHandle = normalizeHandle(handle);
  const currentHandleRef = useRef<string>(normalizedInitialHandle);

  const changeHandleMutation = useMutation(
    pageQueryOptions.changeHandle({
      pageId,
      ownerId,
      handle: normalizedInitialHandle,
      queryClient,
      supabase,
      userId,
    })
  );

  const form = useForm<HandleSchemaType>({
    resolver: zodResolver(HandleSchema),
    defaultValues: {
      pageId,
      ownerId,
      handle: normalizedInitialHandle,
    },
  });

  // TODO: 핸들 변경 성공 후, URL 변경이 안되는 문제 수정 필요
  const onSubmit = useCallback(
    async (data: HandleSchemaType) => {
      setStatus("saving");
      try {
        const result = await changeHandleMutation.mutateAsync(
          {
            pageId: data.pageId,
            ownerId: data.ownerId,
            currentHandle: currentHandleRef.current,
            nextHandle: data.handle,
          },
        );

        if (!result.ok) {
          setStatus("error");
          const message =
            result.reason === "HANDLE_ALREADY_EXISTS"
              ? "이미 사용 중인 핸들입니다."
              : result.reason;

          form.setError("handle", { message });
          throw new Error(message);
        }

        const normalizedNextHandle = normalizeHandle(data.handle);
        currentHandleRef.current = normalizedNextHandle;
        const nextPath = `/profile/@${normalizedNextHandle}`;
  
        form.reset({
          pageId: data.pageId,
          ownerId: data.ownerId,
          handle: normalizedNextHandle,
        });
        setStatus("saved");

        router.replace(nextPath);
        router.refresh();
      } catch (error) {
        setStatus("error");
        throw error;
      }
    },
    [changeHandleMutation, form, router, setStatus]
  );

  return {
    form,
    onSubmit,
    isPending: changeHandleMutation.isPending,
  };
};
