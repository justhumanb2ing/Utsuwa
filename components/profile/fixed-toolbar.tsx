/* eslint-disable react-hooks/rules-of-hooks */
import { useId, useRef, type ChangeEvent } from "react";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "../ui/toolbar";
import SavingStatusSection from "./saving-status-section";
import { BLOCK_REGISTRY, BlockConfig, BlockKey } from "@/config/block-registry";
import { cn } from "@/lib/utils";

interface FixedToolbarProps {
  isVisible: boolean;
  addPlaceholder: (key: BlockKey) => void;
  onUploadImage?: (file: File) => void;
}

export default function FixedToolbar({
  isVisible,
  addPlaceholder,
  onUploadImage,
}: FixedToolbarProps) {
  if (!isVisible) return null;

  const registryEntries = Object.entries(BLOCK_REGISTRY) as [
    BlockKey,
    BlockConfig
  ][];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadImage?.(file);
    }
    event.target.value = "";
  };

  const handleButtonClick = (key: BlockKey, item: BlockConfig) => {
    if (item.ui === "upload" && key === "image") {
      if (onUploadImage) {
        fileInputRef.current?.click();
        return;
      }
    }
    addPlaceholder(key);
  };

  return (
    <Toolbar
      className={cn(
        "fixed bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 drop-shadow-sm",
        "pointer-events-auto bg-black/80 backdrop-blur-md p-1 rounded-xl flex gap-1 shadow-xl border border-black animate-in fade-in zoom-in duration-200 items-center"
      )}
    >
      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <ToolbarGroup>
        {registryEntries.map(([key, item]) => {
          const Icon = item.icon;

          return (
            <ToolbarButton
              key={key}
              aria-label={`${item.label} block`}
              onClick={() => handleButtonClick(key, item)}
              className={"p-2 text-white hover:bg-background/10 rounded-lg"}
            >
              <Icon className="h-6 w-6" weight="fill" />
            </ToolbarButton>
          );
        })}
      </ToolbarGroup>
      <ToolbarSeparator className={"hidden md:flex bg-white/20"} />
      <ToolbarButton className={"hidden md:flex min-w-24 justify-center"}>
        <SavingStatusSection />
      </ToolbarButton>
    </Toolbar>
  );
}
