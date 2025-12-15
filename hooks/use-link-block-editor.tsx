import { useState, useMemo } from "react";
import { layoutMutationOptions } from "@/service/layouts/layout-mutation-options";
import { useMutation } from "@tanstack/react-query";
import { useDebouncedMutation } from "./use-debounced-mutation";
import { useBlockEnv } from "./use-block-env";
import type { LinkBlockParams, LinkBlockState } from "@/types/block-editor";

export const useLinkBlockEditor = (params: LinkBlockParams) => {
  const { supabase, userId } = useBlockEnv();
  const initialTitle =
    (params.data.title ??
      params.data.siteName ??
      params.data.url ??
      "")?.trim() ?? "";
  const [values, setValues] = useState<LinkBlockState>({
    title: initialTitle,
  });
  const fallbackTitle = initialTitle;
  const updateBlockMutation = useMutation(
    layoutMutationOptions.updateContent({ supabase, userId })
  );

  const getValues = useMemo(
    () => () => ({
      title: values.title.trim() || fallbackTitle,
    }),
    [fallbackTitle, values.title]
  );

  const save = (v: LinkBlockState) => {
    const nextTitle = v.title.trim() || fallbackTitle;

    if (params.mode === "placeholder" && params.onSavePlaceholder) {
      params.onSavePlaceholder({ title: nextTitle });
      return Promise.resolve();
    }

    const blockId = params.blockId;
    if (params.mode === "persisted" && blockId) {
      return new Promise<void>((resolve, reject) => {
        updateBlockMutation.mutate(
          {
            type: "link",
            blockId,
            handle: params.handle,
            title: nextTitle,
          },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          }
        );
      });
    }

    return Promise.resolve();
  };

  useDebouncedMutation<LinkBlockState>({
    initial: getValues(),
    getValues,
    save,
    enabled: params.isOwner && params.mode === "persisted",
  });

  return {
    values,
    setTitle: (value: string) => setValues({ title: value }),
  };
};
