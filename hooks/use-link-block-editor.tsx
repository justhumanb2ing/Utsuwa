import { useState, useMemo } from "react";
import { blockQueryOptions } from "@/service/blocks/block-query-options";
import { useMutation } from "@tanstack/react-query";
import { useDebouncedMutation } from "./use-debounced-mutation";

type LinkParams = {
  blockId?: string;
  handle: string;
  mode: "placeholder" | "persisted";
  isOwner: boolean;
  data: { url?: string | null; title?: string | null };
  onSavePlaceholder?: (data: { url: string; title: string }) => Promise<void>;
};

type LinkState = { url: string; title: string };

export const useLinkBlockEditor = (params: LinkParams) => {
  const [values, setValues] = useState<LinkState>({
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

  const save = async (v: LinkState) => {
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

  useDebouncedMutation<LinkState>({
    initial: getValues(),
    getValues,
    save,
    enabled: params.isOwner,
  });

  return {
    values,
    setUrl: (value: string) =>
      setValues((prev) => ({ ...prev, url: value })),
    setTitle: (value: string) =>
      setValues((prev) => ({ ...prev, title: value })),
  };
};