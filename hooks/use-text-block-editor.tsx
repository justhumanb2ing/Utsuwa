import { blockQueryOptions } from "@/service/blocks/block-query-options";
import { useMemo, useState } from "react";
import { useDebouncedMutation } from "./use-debounced-mutation";
import { useMutation } from "@tanstack/react-query";
import { useBlockEnv } from "./use-block-env";
import type {
  TextBlockEditorParams,
  TextBlockState,
} from "@/types/block-editor";

export const useTextBlockEditor = (params: TextBlockEditorParams) => {
  const { supabase, userId } = useBlockEnv();
  const [values, setValues] = useState<TextBlockState>({
    content: params.data.content ?? "",
  });
  const updateBlockMutation = useMutation(
    blockQueryOptions.updateContent({ supabase, userId })
  );
  const getValues = useMemo(
    () => () => ({ content: values.content.trim() }),
    [values.content]
  );

  const save = async (v: TextBlockState) => {
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

  useDebouncedMutation<TextBlockState>({
    initial: getValues(),
    getValues,
    save,
    enabled: params.isOwner,
    mode: params.mode,
  });

  return {
    values,
    setContent: (value: string) => setValues({ content: value }),
  };
};
