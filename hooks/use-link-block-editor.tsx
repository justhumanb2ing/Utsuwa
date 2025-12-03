import { useState, useMemo } from "react";
import { blockQueryOptions } from "@/service/blocks/block-query-options";
import { useMutation } from "@tanstack/react-query";
import { useDebouncedMutation } from "./use-debounced-mutation";
import type {
  LinkBlockEditorParams,
  LinkBlockState,
} from "@/types/block-editor";

export const useLinkBlockEditor = (params: LinkBlockEditorParams) => {
  const [values, setValues] = useState<LinkBlockState>({
    url: params.data.url ?? "",
    title: params.data.title ?? "",
  });
  const updateBlockMutation = useMutation(blockQueryOptions.updateContent());
  
  const getValues = useMemo(
    () => () => ({
      url: values.url.trim(),
      title: values.title.trim(),
    }),
    [values.url, values.title]
  );

  const save = async (v: LinkBlockState) => {
    if (params.mode === "placeholder" && params.onSavePlaceholder) {
      return params.onSavePlaceholder(v);
    }

    if (params.mode === "persisted" && params.blockId) {
      await updateBlockMutation.mutateAsync({
        type: "link",
        blockId: params.blockId,
        handle: params.handle,
        url: v.url,
        title: v.title,
      });
    }
  };

  useDebouncedMutation<LinkBlockState>({
    initial: getValues(),
    getValues,
    save,
    enabled: params.isOwner,
    mode: params.mode,
  });

  return {
    values,
    setUrl: (value: string) =>
      setValues((prev) => ({ ...prev, url: value })),
    setTitle: (value: string) =>
      setValues((prev) => ({ ...prev, title: value })),
  };
};
