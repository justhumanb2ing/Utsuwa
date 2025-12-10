import { useCallback, useEffect, useMemo, useState } from "react";
import type { Layout, Layouts } from "react-grid-layout";
import {
  CANONICAL_BREAKPOINT,
  buildResponsiveLayouts,
  createLayoutLookup,
  extractLayoutPayload,
  type BlockLayout,
  type GridBreakpoint,
  type LayoutInput,
} from "@/service/blocks/block-layout";

type UseProfileGridLayoutParams = {
  layoutInputs: LayoutInput[];
  isEditable: boolean;
  persistedIds: Set<string>;
  onCommit?: (payload: BlockLayout[]) => void;
};

type ResizeSize = { width: number; height: number };

export const useProfileGridLayout = ({
  layoutInputs,
  isEditable,
  persistedIds,
  onCommit,
}: UseProfileGridLayoutParams) => {
  const [layouts, setLayouts] = useState<Layouts>(() =>
    buildResponsiveLayouts(layoutInputs, { isEditable })
  );
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<GridBreakpoint>(CANONICAL_BREAKPOINT);

  const publishLayoutPayload = useCallback(
    (nextLayouts: Layouts) => {
      if (!onCommit) return;
      const payload = extractLayoutPayload(nextLayouts, persistedIds);
      if (!payload.length) return;
      onCommit(payload);
    },
    [onCommit, persistedIds]
  );

  useEffect(() => {
    setLayouts((previous) =>
      buildResponsiveLayouts(layoutInputs, {
        isEditable,
        existingLayouts: previous,
      })
    );
  }, [isEditable, layoutInputs]);

  const normalizeAndSetLayouts = useCallback(
    (sourceLayouts?: Layouts) => {
      const normalized = buildResponsiveLayouts(layoutInputs, {
        isEditable,
        existingLayouts: sourceLayouts ?? layouts,
      });
      setLayouts(normalized);
      return normalized;
    },
    [isEditable, layoutInputs, layouts]
  );

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: Layouts) => {
      normalizeAndSetLayouts(allLayouts);
    },
    [normalizeAndSetLayouts]
  );

  const handleLayoutCommit = useCallback(
    (currentLayout?: Layout[], allLayouts?: Layouts) => {
      const mergedLayouts: Layouts | undefined = allLayouts
        ? { ...allLayouts }
        : undefined;

      if (mergedLayouts && currentBreakpoint && currentLayout) {
        mergedLayouts[currentBreakpoint] = currentLayout;
      }

      const normalized = normalizeAndSetLayouts(mergedLayouts);
      publishLayoutPayload(normalized);
    },
    [currentBreakpoint, normalizeAndSetLayouts, publishLayoutPayload]
  );

  const handleResize = useCallback(
    (id: string, size: ResizeSize) => {
      setLayouts((previous) => {
        const nextLayouts: Layouts = { ...previous };
        const current = previous[currentBreakpoint] ?? [];
        const updated = current.map((entry) =>
          entry.i === id ? { ...entry, w: size.width, h: size.height } : entry
        );
        nextLayouts[currentBreakpoint] = updated;

        const normalized = buildResponsiveLayouts(layoutInputs, {
          isEditable,
          existingLayouts: nextLayouts,
        });
        publishLayoutPayload(normalized);
        return normalized;
      });
    },
    [currentBreakpoint, isEditable, layoutInputs, publishLayoutPayload]
  );

  const handleBreakpointChange = useCallback((next: string) => {
    setCurrentBreakpoint(next as GridBreakpoint);
  }, []);

  const layoutLookup = useMemo(
    () => createLayoutLookup(layouts, currentBreakpoint),
    [currentBreakpoint, layouts]
  );

  return {
    layouts,
    layoutLookup,
    currentBreakpoint,
    handleLayoutChange,
    handleLayoutCommit,
    handleBreakpointChange,
    handleResize,
  };
};
