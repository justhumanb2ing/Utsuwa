import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Layout, Layouts } from "react-grid-layout";
import {
  CANONICAL_BREAKPOINT,
  buildResponsiveLayouts,
  createLayoutLookup,
  extractLayoutPayload,
  projectLayoutsToCanonicalInputs,
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
  const [currentLayoutInputs, setCurrentLayoutInputs] =
    useState<LayoutInput[]>(layoutInputs);
  const [layouts, setLayouts] = useState<Layouts>(() =>
    buildResponsiveLayouts(layoutInputs, { isEditable })
  );
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<GridBreakpoint>(CANONICAL_BREAKPOINT);
  const currentBreakpointRef = useRef<GridBreakpoint>(CANONICAL_BREAKPOINT);
  const isBreakpointTransitionRef = useRef(false);

  const publishLayoutPayload = useCallback(
    (nextLayouts: Layouts) => {
      if (!onCommit) return;
      const payload = extractLayoutPayload(nextLayouts, persistedIds);
      if (!payload.length) return;
      // 부모 상태 업데이트가 렌더 중에 발생하지 않도록 마이크로태스크로 지연
      queueMicrotask(() => onCommit(payload));
    },
    [onCommit, persistedIds]
  );

  useEffect(() => {
    setCurrentLayoutInputs(layoutInputs);
    setLayouts((previous) =>
      buildResponsiveLayouts(layoutInputs, {
        isEditable,
        existingLayouts: previous,
      })
    );
    // 외부에서 layoutInputs가 변경되면 브레이크포인트 전환 상태를 초기화
    isBreakpointTransitionRef.current = false;
  }, [isEditable, layoutInputs]);

  const normalizeAndSetLayouts = useCallback(
    (sourceLayouts?: Layouts, nextInputs?: LayoutInput[]) => {
      const inputs = nextInputs ?? currentLayoutInputs;
      const existingLayouts = nextInputs ? undefined : sourceLayouts ?? layouts;
      const normalized = buildResponsiveLayouts(inputs, {
        isEditable,
        existingLayouts,
      });
      setLayouts(normalized);
      setCurrentLayoutInputs(inputs);
      return normalized;
    },
    [currentLayoutInputs, isEditable, layouts]
  );

  const handleLayoutChange = useCallback(
    (currentLayout: Layout[], allLayouts: Layouts) => {
      const breakpoint = currentBreakpointRef.current;

      setLayouts((previous) =>
        buildResponsiveLayouts(currentLayoutInputs, {
          isEditable,
          existingLayouts: {
            ...previous,
            ...allLayouts,
            [breakpoint]: currentLayout,
          },
        })
      );

      if (isBreakpointTransitionRef.current) {
        // 브레이크포인트 이동 직후 자동으로 호출되는 onLayoutChange는
        // 캐논컬 입력을 덮어쓰지 않고 레이아웃 스냅샷만 동기화한다.
        isBreakpointTransitionRef.current = false;
        return;
      }

      // 편집 모드에서도 브레이크포인트 전환/컴팩션에 의해 호출되는 onLayoutChange가
      // canonical 입력을 덮어쓰지 않도록, 여기서는 레이아웃 상태만 동기화한다.
    },
    [currentLayoutInputs, isEditable]
  );

  const handleLayoutCommit = useCallback(
    (currentLayout?: Layout[], allLayouts?: Layouts) => {
      const breakpoint = currentBreakpointRef.current;
      const mergedLayouts: Layouts | undefined = allLayouts
        ? { ...allLayouts }
        : undefined;

      if (mergedLayouts && breakpoint && currentLayout) {
        mergedLayouts[breakpoint] = currentLayout;
      }

      const inputs = projectLayoutsToCanonicalInputs(
        mergedLayouts ?? layouts,
        breakpoint
      );
      const normalized = normalizeAndSetLayouts(mergedLayouts, inputs);
      publishLayoutPayload(normalized);
    },
    [layouts, normalizeAndSetLayouts, publishLayoutPayload]
  );

  const handleResize = useCallback(
    (id: string, size: ResizeSize) => {
      const breakpoint = currentBreakpointRef.current;
      const nextLayouts: Layouts = { ...layouts };
      const current = layouts[currentBreakpoint] ?? [];
      const updated = current.map((entry) =>
        entry.i === id ? { ...entry, w: size.width, h: size.height } : entry
      );
      nextLayouts[breakpoint] = updated;

      const nextInputs = projectLayoutsToCanonicalInputs(
        nextLayouts,
        breakpoint
      );
      const normalized = normalizeAndSetLayouts(nextLayouts, nextInputs);
      publishLayoutPayload(normalized);
    },
    [
      isEditable,
      layouts,
      publishLayoutPayload,
      normalizeAndSetLayouts,
    ]
  );

  const handleBreakpointChange = useCallback((next: string) => {
    const normalized = next as GridBreakpoint;
    currentBreakpointRef.current = normalized;
    isBreakpointTransitionRef.current = true;
    setCurrentBreakpoint(normalized);
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
