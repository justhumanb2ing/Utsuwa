"use client";

import { StatusBadge, useSaveStatus } from "./save-status-context";

export default function SavingStatusSection() {
  const { status } = useSaveStatus();
  
  return (
    <div className="z-10 flex justify-end p-1 px-2">
      <StatusBadge status={status} />
    </div>
  );
}
