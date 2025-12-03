import { useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import deepEqual from "fast-deep-equal";
import { useSaveStatus } from "@/components/profile/save-status-context";
import type { BlockEditorMode } from "@/types/block-editor";

type Params<T> = {
  initial: T;
  getValues: () => T;
  save: (values: T) => Promise<void>;
  enabled: boolean;
  debounceMs?: number;
  mode?: BlockEditorMode;
};

export const useDebouncedMutation = <T,>({
  initial,
  getValues,
  save,
  enabled,
  debounceMs = 1200,
}: Params<T>) => {
  const { setStatus } = useSaveStatus();
  const currentRef = useRef<T>(initial);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const mutation = useMutation({
    mutationFn: save,
    onMutate: () => setStatus("saving"),
    onSuccess: () => {
      currentRef.current = getValues();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    },
    onError: () => setStatus("error"),
  });

  useEffect(() => {
    if (!enabled) return;

    const values = getValues();
    if (deepEqual(values, currentRef.current)) return;

    setStatus("dirty");

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      mutation.mutate(values);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [getValues, enabled]);

  return { mutation };
};
