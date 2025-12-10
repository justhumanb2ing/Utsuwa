"use client";

import type { HTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLinkBlockEditor } from "@/hooks/use-link-block-editor";
import { useTextBlockEditor } from "@/hooks/use-text-block-editor";
import type { LinkBlockParams, TextBlockParams } from "@/types/block-editor";
import { cn } from "@/lib/utils";

type DragGuardHandlers = Pick<
  HTMLAttributes<HTMLElement>,
  "onPointerDownCapture" | "onMouseDownCapture" | "onTouchStartCapture"
>;

export type LinkBlockEditorProps = LinkBlockParams & {
  onCancelPlaceholder?: () => void;
  className?: string;
  dragGuardHandlers?: DragGuardHandlers;
};

export const LinkBlockEditor = ({
  mode,
  blockId,
  handle,
  isOwner,
  data,
  onSavePlaceholder,
  className,
  dragGuardHandlers,
}: LinkBlockEditorProps) => {
  const { values, setUrl, setTitle } = useLinkBlockEditor({
    mode,
    blockId,
    handle,
    isOwner,
    data,
    onSavePlaceholder,
  });

  return (
    <div className={cn("space-y-2 h-full flex flex-col", className)}>
      <Input
        placeholder="https://example.com"
        value={values.url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={!isOwner}
        className={cn(
          "shadow-none border-none",
          "focus-visible:ring-0 focus-visible:border-none focus-visible:bg-muted transition-colors duration-200",
          "hover:bg-muted"
        )}
        {...dragGuardHandlers}
      />

      <Input
        placeholder="링크 제목"
        value={values.title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={!isOwner}
        className={cn(
          "shadow-none border-none",
          "focus-visible:ring-0 focus-visible:border-none focus-visible:bg-muted transition-colors duration-200",
          "hover:bg-muted"
        )}
        {...dragGuardHandlers}
      />
    </div>
  );
};

export type TextBlockEditorProps = TextBlockParams & {
  onCancelPlaceholder?: () => void;
  className?: string;
  dragGuardHandlers?: DragGuardHandlers;
};

export const TextBlockEditor = ({
  mode,
  blockId,
  handle,
  isOwner,
  data,
  onSavePlaceholder,
  className,
  dragGuardHandlers,
}: TextBlockEditorProps) => {
  const { values, setContent } = useTextBlockEditor({
    mode,
    blockId,
    handle,
    isOwner,
    data,
    onSavePlaceholder,
  });

  return (
    <Textarea
      placeholder="내용을 입력하세요"
      value={values.content}
      onChange={(e) => setContent(e.target.value)}
      disabled={!isOwner}
      className={cn(
        "resize-none border-none shadow-none h-full flex-1 text-xl! font-medium rounded-2xl",
        "focus-visible:border-none focus-visible:ring-0 focus-visible:bg-muted transition-colors duration-200",
        "hover:bg-muted",
        className
      )}
      {...dragGuardHandlers}
    />
  );
};
