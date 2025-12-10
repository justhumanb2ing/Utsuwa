import { memo } from "react";
import { Button } from "../ui/button";

type ResizeOption = { w: number; h: number; label: string };

const SIZE_OPTIONS: ResizeOption[] = [
  { w: 1, h: 1, label: "1x1" },
  { w: 2, h: 1, label: "2x1" },
  { w: 1, h: 2, label: "1x2" },
  { w: 2, h: 2, label: "2x2" },
];

type PageBlockResizeControlsProps = {
  currentW: number;
  currentH: number;
  onResize: (size: { w: number; h: number }) => void;
};

export const PageBlockResizeControls = memo(
  ({ currentW, currentH, onResize }: PageBlockResizeControlsProps) => {
    return (
      <>
        {SIZE_OPTIONS.map((size) => {
          const isActive = currentW === size.w && currentH === size.h;
          return (
            <Button
              size={"icon-sm"}
              variant={"ghost"}
              key={size.label}
              type="button"
              onClick={() => onResize(size)}
              className={`group relative flex flex-col items-center justify-center p-0.5 rounded-lg transition-all ${
                isActive ? "bg-white/20 hover:bg-white/20" : "hover:bg-white/10"
              }`}
              title={size.label}
            >
              <div
                className="grid gap-px"
                style={{
                  gridTemplateColumns: "repeat(2, 6px)",
                  gridTemplateRows: "repeat(2, 6px)",
                }}
              >
                <div
                  className={`w-[5px] h-[5px] rounded-[1px] ${
                    size.w >= 1 && size.h >= 1 ? "bg-white" : "bg-white/20"
                  }`}
                />
                <div
                  className={`w-[5px] h-[5px] rounded-[1px] ${
                    size.w >= 2 && size.h >= 1 ? "bg-white" : "bg-white/20"
                  }`}
                />
                <div
                  className={`w-[5px] h-[5px] rounded-[1px] ${
                    size.w >= 1 && size.h >= 2 ? "bg-white" : "bg-white/20"
                  }`}
                />
                <div
                  className={`w-[5px] h-[5px] rounded-[1px] ${
                    size.w >= 2 && size.h >= 2 ? "bg-white" : "bg-white/20"
                  }`}
                />
              </div>
            </Button>
          );
        })}
      </>
    );
  }
);

PageBlockResizeControls.displayName = "PageBlockResizeControls";
