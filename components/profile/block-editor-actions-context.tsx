"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BlockKey } from "@/config/block-registry";
import type { BlockLayout } from "@/service/blocks/block-layout";

export type BlockEditorActions = {
  addPlaceholder: (type: BlockKey) => void;
  cancelPlaceholder: (id: string) => void;
  deleteBlock: (id: string) => void;
  savePlaceholder: (
    id: string,
    type: BlockKey,
    data: Record<string, unknown>
  ) => void;
  layoutChange: (layout: BlockLayout[]) => void;
};

const BlockEditorActionsContext = createContext<BlockEditorActions | null>(
  null
);

export const BlockEditorActionsProvider = ({
  value,
  children,
}: {
  value: BlockEditorActions;
  children: ReactNode;
}) => {
  return (
    <BlockEditorActionsContext.Provider value={value}>
      {children}
    </BlockEditorActionsContext.Provider>
  );
};

export const useBlockEditorActions = (): BlockEditorActions => {
  const ctx = useContext(BlockEditorActionsContext);
  if (!ctx)
    throw new Error("BlockEditorActionsProvider 안에서만 사용할 수 있습니다.");
  return ctx;
};
