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
}

export default function FixedToolbar({
  isVisible,
  addPlaceholder,
}: FixedToolbarProps) {
  if (!isVisible) return null;

  const registryEntries = Object.entries(BLOCK_REGISTRY) as [
    BlockKey,
    BlockConfig
  ][];

  return (
    <Toolbar
      className={cn(
        "fixed bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 drop-shadow-sm",
        "pointer-events-auto bg-black/80 backdrop-blur-md p-0.5 px-1 rounded-xl flex gap-1 shadow-xl border border-black animate-in fade-in zoom-in duration-200 items-center"
      )}
    >
      <ToolbarGroup>
        {registryEntries.map(([key, item]) => {
          const Icon = item.icon;

          return (
            <ToolbarButton
              key={key}
              aria-label={`${item.label} block`}
              onClick={() => addPlaceholder(key)}
              className={"p-2 text-white"}
            >
              <Icon className="h-5 w-5" />
            </ToolbarButton>
          );
        })}
      </ToolbarGroup>
      <ToolbarSeparator className={"bg-white/20"} />
      <ToolbarButton className={"hidden md:flex min-w-24 justify-center"}>
        <SavingStatusSection />
      </ToolbarButton>
    </Toolbar>
  );
}
