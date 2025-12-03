import { blockQueryOptions } from "@/service/blocks/block-query-options";
import { useMemo, useState } from "react";
import { useDebouncedMutation } from "./use-debounced-mutation";
import { useMutation } from "@tanstack/react-query";

type TextParams = {
  blockId?: string;
  handle: string;
  mode: "placeholder" | "persisted";
  isOwner: boolean;
  data: { content?: string | null };
  onSavePlaceholder?: (data: { content: string }) => Promise<void>;
};

type TextState = { content: string };

export const useTextBlockEditor = (params: TextParams) => {
  const [values, setValues] = useState<TextState>({
    content: params.data.content ?? "",
  });
  const updateBlockMutation = useMutation(blockQueryOptions.updateContent());
  const getValues = useMemo(
    () => () => ({ content: values.content.trim() }),
    [values.content]
  );

  const save = async (v: TextState) => {
    if (params.mode === "placeholder" && params.onSavePlaceholder) {
      return params.onSavePlaceholder(v);
    }

    if (params.mode === "persisted" && params.blockId) {
      await updateBlockMutation.mutateAsync({
        type: "text",
        blockId: params.blockId,
        handle: params.handle,
        content: v.content,
      });
    }
  };

  useDebouncedMutation<TextState>({
    initial: getValues(),
    getValues,
    save,
    enabled: params.isOwner,
  });

  return {
    values,
    setContent: (value: string) => setValues({ content: value }),
  };
};
