"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import { LinkIcon } from "@phosphor-icons/react";
import { Textarea } from "@/components/ui/textarea";
import { useLinkBlockEditor } from "@/hooks/use-link-block-editor";
import { useTextBlockEditor } from "@/hooks/use-text-block-editor";
import { useSectionBlockEditor } from "@/hooks/use-section-block-editor";
import type {
  LinkBlockParams,
  SectionBlockParams,
  TextBlockParams,
} from "@/types/block-editor";
import { cn } from "@/lib/utils";
import Link from "next/link";

type DragGuardHandlers = Pick<
  HTMLAttributes<HTMLElement>,
  "onPointerDownCapture" | "onMouseDownCapture" | "onTouchStartCapture"
>;

export type LinkBlockEditorProps = LinkBlockParams & {
  sizeVariant: "compact" | "expanded";
  layoutSize: { width: number; height: number };
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
  sizeVariant,
  onCancelPlaceholder,
  layoutSize,
}: LinkBlockEditorProps) => {
  const titleRef = useRef<HTMLParagraphElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const { values, setTitle } = useLinkBlockEditor({
    mode,
    blockId,
    handle,
    isOwner,
    data,
    onSavePlaceholder,
  });

  const {
    displayTitle,
    siteName,
    displayUrl,
    imageUrl,
    faviconUrl,
    containerLayoutClass,
    isStandardLayout,
    isFullSizeLayout,
    isRowLayout,
  } = useMemo(() => {
    const fallbackTitle =
      data.title?.trim() ??
      data.siteName?.trim() ??
      data.url?.trim() ??
      "제목 없는 링크";
    const resolvedTitle =
      values.title.trim().length > 0 ? values.title : fallbackTitle;
    const hostname = resolveHostname(data.url);
    const resolvedSiteName =
      sizeVariant === "expanded"
        ? data.siteName ?? hostname ?? undefined
        : undefined;
    const resolvedUrl =
      sizeVariant === "expanded" ? hostname ?? data.url ?? "" : "";
    const resolvedImageUrl =
      sizeVariant === "expanded" ? data.imageUrl ?? null : null;
    const resolvedFaviconUrl = data.faviconUrl ?? null;
    const isStandard = layoutSize.width === 2 && layoutSize.height === 2;
    const isFull = layoutSize.width === 4 && layoutSize.height === 4;
    const isRow = layoutSize.width === 4 && layoutSize.height === 2;
    const isColumn =
      (layoutSize.width === 2 && layoutSize.height === 4) || isFull;
    const layoutClass = isRow
      ? "flex-row items-start justify-between gap-6"
      : isColumn
      ? "flex-col justify-between gap-4"
      : "flex-col gap-3";

    return {
      displayTitle: resolvedTitle,
      siteName: resolvedSiteName,
      displayUrl: resolvedUrl,
      imageUrl: resolvedImageUrl,
      faviconUrl: resolvedFaviconUrl,
      containerLayoutClass: layoutClass,
      isStandardLayout: isStandard,
      isFullSizeLayout: isFull,
      isRowLayout: isRow,
    };
  }, [
    data.faviconUrl,
    data.imageUrl,
    data.siteName,
    data.title,
    data.url,
    layoutSize.height,
    layoutSize.width,
    sizeVariant,
    values.title,
  ]);

  const handleTitleBlur = useCallback(
    (event: React.FocusEvent<HTMLParagraphElement>) => {
      setIsEditingTitle(false);
      setTitle((event.currentTarget.textContent ?? "").trim());
    },
    [setTitle]
  );

  const handleTitleFocus = useCallback(() => {
    setIsEditingTitle(true);
  }, []);

  useEffect(() => {
    if (isEditingTitle) return;
    const element = titleRef.current;
    if (element && element.textContent !== displayTitle) {
      element.textContent = displayTitle;
    }
  }, [displayTitle, isEditingTitle]);

  if (mode === "placeholder") {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-between rounded-2xl border border-dashed border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground",
          className
        )}
      >
        <span>URL 파싱 후 링크 블록이 생성됩니다.</span>
        {onCancelPlaceholder ? (
          <button
            type="button"
            className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
            onClick={onCancelPlaceholder}
          >
            취소
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      <div
        className={cn(
          "group/link flex w-full h-full rounded-2xl transition-colors"
          // containerLayoutClass
        )}
        {...dragGuardHandlers}
      >
        <div
          className={cn(
            "flex min-w-0 flex-1 gap-4",
            containerLayoutClass
            // isRowLayout ? "items-start" : "items-center"
          )}
        >
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-col gap-4">
              <LinkFavicon
                faviconUrl={faviconUrl}
                title={displayTitle}
                siteName={siteName}
                url={data.url ?? undefined}
              />
              <p
                className={cn(
                  "text-lg font-semibold leading-tight text-foreground/90 rounded-lg p-1.5",
                  "line-clamp-3 truncate whitespace-normal overflow-hidden text-ellipsis wrap-break-word transition-colors duration-150",
                  "hover:cursor-text hover:bg-muted"
                )}
                ref={titleRef}
                contentEditable={isOwner}
                suppressContentEditableWarning
                onFocus={handleTitleFocus}
                onBlur={handleTitleBlur}
                role={isOwner ? "textbox" : undefined}
                aria-label="링크 제목"
                spellCheck={false}
              >
                {displayTitle}
              </p>
            </div>

            {siteName ? (
              <div className="flex flex-wrap items-center gap-2 text-sm p-1.5">
                <span className="font-medium text-neutral-200">{siteName}</span>
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "max-w-full w-40 bg-muted rounded-xl",
              isRowLayout
                ? "h-full"
                : isFullSizeLayout
                ? "w-full h-40"
                : "h-20",
              isStandardLayout && "hidden"
            )}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={displayTitle}
                fill
                className="object-cover"
                sizes="128px"
                unoptimized
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const resolveHostname = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname || null;
  } catch {
    return null;
  }
};

const LinkFavicon = ({
  faviconUrl,
  title,
  siteName,
  url,
}: {
  faviconUrl: string | null;
  title: string;
  siteName?: string;
  url?: string;
}) => (
  <Link href={url ?? "#"} target="_blank">
    <div className="flex size-12 items-center justify-center border border-muted rounded-xl bg-muted/70">
      {faviconUrl ? (
        <Image
          src={faviconUrl}
          alt={`favicon for ${siteName ?? title ?? url ?? "link"}`}
          width={28}
          height={28}
          className="h-full w-full rounded-md object-cover"
          unoptimized
        />
      ) : null}
    </div>
  </Link>
);

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

export type SectionBlockEditorProps = SectionBlockParams & {
  onCancelPlaceholder?: () => void;
  className?: string;
  dragGuardHandlers?: DragGuardHandlers;
};

export const SectionBlockEditor = ({
  mode,
  blockId,
  handle,
  isOwner,
  data,
  onSavePlaceholder,
  className,
  dragGuardHandlers,
}: SectionBlockEditorProps) => {
  const { values, setTitle } = useSectionBlockEditor({
    mode,
    blockId,
    handle,
    isOwner,
    data,
    onSavePlaceholder,
  });

  const isEmpty = values.title.trim().length === 0;

  if (!isOwner) {
    return (
      <div
        className={cn(
          "w-full h-full flex items-center",
          isEmpty ? "text-muted-foreground" : "text-foreground",
          className
        )}
        {...dragGuardHandlers}
      >
        <p className="text-2xl font-semibold leading-tight">
          {isEmpty ? "제목이 비어 있습니다." : values.title}
        </p>
      </div>
    );
  }

  return (
    <Textarea
      placeholder="섹션 제목을 입력하세요"
      value={values.title}
      onChange={(event) => setTitle(event.target.value)}
      className={cn(
        "resize-none border-none shadow-none h-full flex-1 text-2xl! font-bold leading-tight rounded-2xl bg-transparent",
        "focus-visible:border-none focus-visible:ring-0 focus-visible:bg-muted transition-colors duration-200",
        "hover:bg-muted",
        className
      )}
      {...dragGuardHandlers}
    />
  );
};
