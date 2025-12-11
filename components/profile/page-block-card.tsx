"use client";

import { useState, type HTMLAttributes } from "react";
import { Loader2, XIcon } from "lucide-react";
import type { Layout } from "react-grid-layout";
import { Button } from "@/components/ui/button";
import {
  LinkBlockEditor,
  TextBlockEditor,
} from "@/components/profile/block-editors";
import { PageBlockResizeControls } from "@/components/profile/page-block-resize-controls";
import { cn } from "@/lib/utils";
import { MIN_SIZE } from "@/service/blocks/block-layout";
import type { ProfileBlockItem } from "./types/block-item";
import { extractLinkData, extractTextData } from "./utils/block-content";
import type { BlockKey } from "@/config/block-registry";

type DragGuardHandlers = Pick<
  HTMLAttributes<HTMLElement>,
  "onPointerDownCapture" | "onMouseDownCapture" | "onTouchStartCapture"
>;

type PageBlockCardProps = {
  item: ProfileBlockItem;
  handle: string;
  isOwner: boolean;
  isEditable: boolean;
  layout?: Layout;
  dragGuardHandlers: DragGuardHandlers;
  isDeleting?: boolean;
  onDeleteBlock?: (blockId: string) => void;
  onResize: (size: { width: number; height: number }) => void;
  onSavePlaceholder: (
    placeholderId: string,
    type: BlockKey,
    data: Record<string, unknown>
  ) => void;
  onCancelPlaceholder: (placeholderId: string) => void;
};

export const PageBlockCard = ({
  item,
  handle,
  isOwner,
  isEditable,
  layout,
  dragGuardHandlers,
  isDeleting,
  onDeleteBlock,
  onResize,
  onSavePlaceholder,
  onCancelPlaceholder,
}: PageBlockCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const block = item.kind === "persisted" ? item.block : undefined;
  const blockId = block?.id;
  const isPlaceholder = item.kind === "placeholder";
  const blockType: BlockKey | undefined =
    item.kind === "persisted" ? item.block.type : item.type;
  const width = layout?.w ?? MIN_SIZE;
  const height = layout?.h ?? MIN_SIZE;
  const isDeletingPersistedBlock = Boolean(blockId && isDeleting);
  const isDeletable = isPlaceholder || Boolean(blockId);

  const handleDelete = () => {
    if (isPlaceholder) {
      onCancelPlaceholder(item.id);
      return;
    }
    if (blockId) {
      onDeleteBlock?.(blockId);
    }
  };

  return (
    <div
      className={cn(
        "group relative h-full rounded-3xl border border-border/40 bg-background p-4 shadow-sm transition-shadow z-99999",
        isEditable && "cursor-grab active:cursor-grabbing hover:shadow-lg"
      )}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={() => setIsHovered(false)}
    >
      {isEditable && isHovered ? (
        <aside className="pointer-events-none absolute inset-x-0 -bottom-6 z-999 flex justify-center">
          <div
            data-no-drag
            className="pointer-events-auto bg-black/80 backdrop-blur-md p-0.5 px-1 rounded-xl flex gap-1 shadow-xl border border-white/10 animate-in fade-in zoom-in duration-200 items-center"
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            <PageBlockResizeControls
              currentW={width}
              currentH={height}
              onResize={(size) => onResize({ width: size.w, height: size.h })}
            />
            {isDeletable ? (
              <>
                <div className="h-2/3 w-px bg-white/20" aria-hidden />
                <Button
                  type="button"
                  size={"icon-sm"}
                  variant={"ghost"}
                  data-no-drag
                  className={cn(
                    "transition-all p-2 rounded-lg hover:bg-brand-poppy/20 text-brand-poppy hover:text-brand-poppy",
                    isDeletingPersistedBlock
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  )}
                  aria-label="블록 삭제"
                  disabled={isDeletingPersistedBlock}
                  onClick={handleDelete}
                >
                  {isDeletingPersistedBlock ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <XIcon className="size-5" aria-hidden />
                  )}
                </Button>
              </>
            ) : null}
          </div>
        </aside>
      ) : null}

      <div className="flex-1 space-y-3 h-full flex flex-col">
        {(() => {
          switch (blockType) {
            case "link":
              return (
                <LinkBlockEditor
                  className="flex-1"
                  dragGuardHandlers={dragGuardHandlers}
                  mode={isPlaceholder ? "placeholder" : "persisted"}
                  blockId={blockId}
                  handle={handle}
                  isOwner={isOwner}
                  data={extractLinkData(block)}
                  onSavePlaceholder={
                    isPlaceholder
                      ? (data) => onSavePlaceholder(item.id, "link", data)
                      : undefined
                  }
                  onCancelPlaceholder={
                    isPlaceholder
                      ? () => onCancelPlaceholder(item.id)
                      : undefined
                  }
                />
              );
            case "text":
              return (
                <TextBlockEditor
                  className="flex-1"
                  dragGuardHandlers={dragGuardHandlers}
                  mode={isPlaceholder ? "placeholder" : "persisted"}
                  blockId={blockId}
                  handle={handle}
                  isOwner={isOwner}
                  data={extractTextData(block)}
                  onSavePlaceholder={
                    isPlaceholder
                      ? (data) => onSavePlaceholder(item.id, "text", data)
                      : undefined
                  }
                  onCancelPlaceholder={
                    isPlaceholder
                      ? () => onCancelPlaceholder(item.id)
                      : undefined
                  }
                />
              );
            case "image":
              return (
                <p className="text-xs text-muted-foreground">
                  이미지 블록은 업로드 이후에 렌더링됩니다.
                </p>
              );
            case "video":
              return (
                <p className="text-xs text-muted-foreground">
                  비디오 블록은 업로드 이후에 렌더링됩니다.
                </p>
              );
            default:
              return (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    해당 블록 타입에 대한 UI가 아직 준비되지 않았습니다.
                  </p>
                  {isPlaceholder ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCancelPlaceholder(item.id)}
                    >
                      취소
                    </Button>
                  ) : null}
                </div>
              );
          }
        })()}
      </div>
    </div>
  );
};
