"use client";

import Image from "next/image";
import { useState, type HTMLAttributes } from "react";
import { Loader2, XIcon } from "lucide-react";
import type { Layout } from "react-grid-layout";
import { Button } from "@/components/ui/button";
import {
  LinkBlockEditor,
  SectionBlockEditor,
  TextBlockEditor,
} from "@/components/profile/block-editors";
import { PageBlockResizeControls } from "@/components/profile/page-block-resize-controls";
import { cn } from "@/lib/utils";
import { MIN_SIZE } from "@/service/blocks/block-layout";
import { getDefaultBlockLayout } from "@/service/blocks/block-layout-presets";
import type { ProfileBlockItem } from "./types/block-item";
import {
  extractImageData,
  extractLinkData,
  extractSectionData,
  extractTextData,
} from "./utils/block-content";
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
  const defaultLayout = blockType
    ? getDefaultBlockLayout(blockType)
    : { w: MIN_SIZE, h: MIN_SIZE };
  const width = layout?.w ?? defaultLayout.w;
  const height = layout?.h ?? defaultLayout.h;
  const isDeletingPersistedBlock = Boolean(blockId && isDeleting);
  const isDeletable = isPlaceholder || Boolean(blockId);
  const isImageBlock = blockType === "image";
  const isSectionBlock = blockType === "section";
  const shouldShowControls = isEditable && isHovered;
  const showResizeControls = shouldShowControls && !isSectionBlock;
  const showDeleteButton = shouldShowControls && isDeletable;

  const cardClassName = cn(
    "group relative h-full rounded-3xl bg-background transition-shadow z-99999",
    isImageBlock ? "p-0" : "p-4",
    isEditable && "cursor-grab active:cursor-grabbing",
    isSectionBlock
      ? isHovered
        ? "border border-border/50 shadow-lg"
        : "border-transparent shadow-none"
      : "border border-border/40 shadow-sm",
    isEditable && !isSectionBlock && "hover:shadow-lg"
  );

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
      className={cardClassName}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={() => setIsHovered(false)}
    >
      {shouldShowControls ? (
        <aside className="pointer-events-none absolute inset-x-0 -bottom-6 z-999 flex justify-center">
          <div
            data-no-drag
            className={cn(
              "pointer-events-auto bg-black/80 backdrop-blur-md p-1 rounded-xl flex shadow-xl border border-white/10 animate-in fade-in zoom-in duration-200 items-center",
              showResizeControls ? "gap-1" : "gap-0"
            )}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            {showResizeControls ? (
              <PageBlockResizeControls
                currentW={width}
                currentH={height}
                onResize={(size) => onResize({ width: size.w, height: size.h })}
              />
            ) : null}
            {showDeleteButton ? (
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
            case "section":
              return (
                <SectionBlockEditor
                  className="flex-1"
                  dragGuardHandlers={dragGuardHandlers}
                  mode={isPlaceholder ? "placeholder" : "persisted"}
                  blockId={blockId}
                  handle={handle}
                  isOwner={isOwner}
                  data={extractSectionData(block)}
                  onSavePlaceholder={
                    isPlaceholder
                      ? (data) => onSavePlaceholder(item.id, "section", data)
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
                <ImageBlock
                  isOwner={isOwner}
                  isPlaceholder={isPlaceholder}
                  data={extractImageData(block)}
                  onCancelPlaceholder={
                    isPlaceholder
                      ? () => onCancelPlaceholder(item.id)
                      : undefined
                  }
                />
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

type ImageBlockProps = {
  data: {
    imageUrl?: string | null;
    linkUrl?: string | null;
    aspectRatio?: number | null;
  };
  dragGuardHandlers?: DragGuardHandlers;
  isOwner: boolean;
  isPlaceholder: boolean;
  onCancelPlaceholder?: () => void;
};

const ImageBlock = ({
  data,
  dragGuardHandlers,
  isOwner,
  isPlaceholder,
  onCancelPlaceholder,
}: ImageBlockProps) => {
  const aspectRatio =
    data.aspectRatio && data.aspectRatio > 0 ? data.aspectRatio : 4 / 3;

  return (
    <div className="flex h-full flex-col gap-2" {...dragGuardHandlers}>
      <div
        className="relative h-full w-full overflow-hidden border border-border/50 bg-muted rounded-3xl"
        style={{ aspectRatio }}
      >
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt="업로드된 이미지"
            fill
            sizes="(min-width: 1280px) 480px, (min-width: 768px) 320px, 100vw"
            className="object-cover w-full h-full"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            {isOwner
              ? "이미지를 업로드하면 여기에 표시됩니다."
              : "이미지를 불러오지 못했습니다."}
          </div>
        )}
      </div>
      {isPlaceholder && onCancelPlaceholder ? (
        <div className="px-4 pb-3">
          <Button size="sm" variant="ghost" onClick={onCancelPlaceholder}>
            취소
          </Button>
        </div>
      ) : null}
    </div>
  );
};
