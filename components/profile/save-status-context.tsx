"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

type SaveStatusContextValue = {
  status: SaveStatus;
  setStatus: (status: SaveStatus) => void;
};

const SaveStatusContext = createContext<SaveStatusContextValue | null>(null);

export const SaveStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [status, setStatusState] = useState<SaveStatus>("idle");
  const resetRef = useRef<NodeJS.Timeout | null>(null);

  const setStatus = (next: SaveStatus) => {
    setStatusState(next);
    if (resetRef.current) {
      clearTimeout(resetRef.current);
      resetRef.current = null;
    }
    if (next === "saved") {
      resetRef.current = setTimeout(() => {
        setStatusState("idle");
        resetRef.current = null;
      }, 3000);
    }
  };

  return (
    <SaveStatusContext.Provider value={{ status, setStatus }}>
      {children}
    </SaveStatusContext.Provider>
  );
};

export const useSaveStatus = (): SaveStatusContextValue => {
  const ctx = useContext(SaveStatusContext);
  if (!ctx) {
    throw new Error("useSaveStatus must be used within SaveStatusProvider");
  }
  return ctx;
};

export const StatusBadge = ({ status }: { status: SaveStatus }) => {
  const { label, indicatorClass } = useMemo(() => {
    switch (status) {
      case "saved":
        return { label: "변경 완료", indicatorClass: "bg-emerald-500" };
      case "dirty":
      case "saving":
        return {
          label: "변경 중...",
          indicatorClass: "bg-blue-500 animate-pulse",
        };
      case "error":
        return { label: "저장 실패", indicatorClass: "bg-red-500" };
      default:
        return { label: "변경 사항 없음", indicatorClass: "bg-zinc-300" };
    }
  }, [status]);

  return (
    <div
      className="flex items-center gap-2 text-sm text-white"
      aria-live="polite"
    >
      {/* <span aria-hidden className={`size-2 rounded-full ${indicatorClass}`} /> */}
      {label}
    </div>
  );
};
