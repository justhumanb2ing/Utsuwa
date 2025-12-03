"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type BlockEnvValue = {
  supabase: SupabaseClient;
  userId: string | null;
};

const BlockEnvContext = createContext<BlockEnvValue | null>(null);

export const BlockEnvProvider = ({
  value,
  children,
}: {
  value: BlockEnvValue;
  children: ReactNode;
}) => {
  return <BlockEnvContext.Provider value={value}>{children}</BlockEnvContext.Provider>;
};

export const useBlockEnv = (): BlockEnvValue => {
  const ctx = useContext(BlockEnvContext);
  if (!ctx) {
    throw new Error("BlockEnvProvider가 필요합니다.");
  }
  return ctx;
};
