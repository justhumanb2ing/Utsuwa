import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BLOCK_REGISTRY } from "@/config/block-registry";
import { Button } from "../ui/button";

type IconLookup = Record<string, LucideIcon>;

const resolveIconComponent = (iconName: string): LucideIcon => {
  const icons = LucideIcons as unknown as IconLookup;
  return icons[iconName] ?? LucideIcons.Square;
};

export const BlockRegistryPanel = () => {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-1">
        {Object.entries(BLOCK_REGISTRY).map(([key, item]) => {
          const Icon = resolveIconComponent(item.icon);

          return (
            <div key={key} className="flex items-center">
              <Button
                size={"icon-sm"}
                variant={"outline"}
                disabled={!item.enabled}
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
