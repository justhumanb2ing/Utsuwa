import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { blockQueryOptions } from "@/service/blocks/block-query-options";
import { useDebouncedMutation } from "./use-debounced-mutation";
import { useBlockEnv } from "./use-block-env";
import type {
  SectionBlockParams,
  SectionBlockState,
} from "@/types/block-editor";

export const useSectionBlockEditor = (params: SectionBlockParams) => {
  const { supabase, userId } = useBlockEnv();
  const [values, setValues] = useState<SectionBlockState>({
    title: params.data.title ?? "",
  });
  const updateBlockMutation = useMutation(
    blockQueryOptions.updateContent({ supabase, userId })
  );

  const getValues = useMemo(
    () => () => ({
      title: values.title.trim(),
    }),
    [values.title]
  );

  const save = (state: SectionBlockState) => {
    const payload = { title: state.title.trim() };

    if (params.mode === "placeholder" && params.onSavePlaceholder) {
      params.onSavePlaceholder(payload);
      return Promise.resolve();
    }

    if (params.mode === "persisted" && params.blockId) {
      return new Promise<void>((resolve, reject) => {
        updateBlockMutation.mutate(
          {
            type: "section",
            blockId: params.blockId,
            handle: params.handle,
            title: payload.title,
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

  useDebouncedMutation<SectionBlockState>({
    initial: getValues(),
    getValues,
    save,
    enabled: params.isOwner,
    mode: params.mode,
  });

  return {
    values,
    setTitle: (value: string) => setValues({ title: value }),
  };
};
