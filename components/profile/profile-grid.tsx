"use client";

import { memo, useMemo } from "react";
import type { Layout, Layouts } from "react-grid-layout";
import { Responsive, WidthProvider } from "react-grid-layout";
import {
  GRID_BREAKPOINTS,
  GRID_MARGIN,
  GRID_RESPONSIVE_COLUMNS,
  GRID_ROW_HEIGHT,
} from "@/service/blocks/block-layout";

type ProfileGridProps = {
  layouts: Layouts;
  isEditable: boolean;
  onLayoutChange: (currentLayout: Layout[], allLayouts: Layouts) => void;
  onBreakpointChange: (breakpoint: string) => void;
  onDragStop?: (layout: Layout[]) => void;
  children: React.ReactNode;
};

export const ProfileGrid = memo(
  ({
    layouts,
    isEditable,
    onLayoutChange,
    onBreakpointChange,
    onDragStop,
    children,
  }: ProfileGridProps) => {
    const ResponsiveGridLayout = useMemo(
      () => WidthProvider(Responsive),
      []
    );

    return (
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={GRID_BREAKPOINTS}
        cols={GRID_RESPONSIVE_COLUMNS}
        rowHeight={GRID_ROW_HEIGHT}
        margin={GRID_MARGIN}
        onLayoutChange={onLayoutChange}
        onBreakpointChange={onBreakpointChange}
        onDragStop={onDragStop}
        isDraggable={isEditable}
        isResizable={false}
        draggableCancel=".no-drag,[data-no-drag]"
        compactType="vertical"
        preventCollision={false}
        useCSSTransforms
      >
        {children}
      </ResponsiveGridLayout>
    );
  }
);

ProfileGrid.displayName = "ProfileGrid";
