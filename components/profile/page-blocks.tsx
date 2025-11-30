"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { BlockWithDetails } from "@/types/block";
import type { BlockType } from "@/config/block-registry";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Item } from "@/components/ui/item";
import { toastManager } from "@/components/ui/toast";

type PlaceholderBlock = { kind: "placeholder"; id: string; type: BlockType };
type PersistedBlock = { kind: "persisted"; block: BlockWithDetails };

type BlockItem = PlaceholderBlock | PersistedBlock;

type PageBlocksProps = {
  items: BlockItem[];
  handle: string;
  isOwner: boolean;
  onSavePlaceholder: (
    placeholderId: string,
    type: BlockType,
    data: Record<string, unknown>
  ) => void;
  onCancelPlaceholder: (placeholderId: string) => void;
};

type SaveResponse =
  | { status: "success"; blockId: string }
  | { status: "error"; reason?: string; message: string };

const saveLinkBlock = async (params: {
  blockId: string;
  handle: string;
  url: string;
  title: string;
}): Promise<SaveResponse> => {
  const response = await fetch("/api/profile/block/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = (await response.json().catch(() => ({}))) as SaveResponse;

  if (!response.ok || data.status === "error") {
    return {
      status: "error",
      reason: data.status === "error" ? data.reason : "REQUEST_FAILED",
      message:
        data.status === "error" ? data.message : "링크를 저장하지 못했습니다.",
    };
  }

  return data;
};

const saveTextBlock = async (params: {
  blockId: string;
  handle: string;
  content: string;
}): Promise<SaveResponse> => {
  const response = await fetch("/api/profile/block/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = (await response.json().catch(() => ({}))) as SaveResponse;

  if (!response.ok || data.status === "error") {
    return {
      status: "error",
      reason: data.status === "error" ? data.reason : "REQUEST_FAILED",
      message:
        data.status === "error"
          ? data.message
          : "텍스트를 저장하지 못했습니다.",
    };
  }

  return data;
};

type LinkBlockEditorProps = {
  mode: "placeholder" | "persisted";
  blockId?: string;
  placeholderId?: string;
  handle: string;
  isOwner: boolean;
  data: { url?: string | null; title?: string | null };
  onSavePlaceholder?: (data: { url: string; title: string }) => void;
  onCancelPlaceholder?: () => void;
};

const LinkBlockEditor = ({
  mode,
  blockId,
  handle,
  isOwner,
  data,
  onSavePlaceholder,
  onCancelPlaceholder,
}: LinkBlockEditorProps) => {
  const [url, setUrl] = useState(data.url ?? "");
  const [title, setTitle] = useState(data.title ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const isPristine =
    url.trim() === (data.url?.trim() ?? "") &&
    (title?.trim() ?? "") === (data.title?.trim() ?? "");

  const handleSave = async () => {
    if (!isOwner) return;
    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();

    if (!trimmedUrl || !trimmedTitle) {
      toastManager.add({
        title: "입력을 확인하세요",
        description: "URL과 제목을 모두 입력해야 합니다.",
        type: "warning",
      });
      return;
    }

    if (mode === "placeholder" && onSavePlaceholder) {
      setIsSaving(true);
      try {
        onSavePlaceholder({ url: trimmedUrl, title: trimmedTitle });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!blockId) return;

    const toastId = toastManager.add({
      title: "링크 저장 중…",
      type: "loading",
      timeout: 0,
    });

    setIsSaving(true);
    try {
      const result = await saveLinkBlock({
        blockId,
        handle,
        url: trimmedUrl,
        title: trimmedTitle,
      });

      if (result.status === "error") {
        throw new Error(result.message);
      }

      toastManager.update(toastId, {
        title: "링크가 저장되었습니다.",
        type: "success",
      });
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.";
      toastManager.update(toastId, {
        title: "저장 실패",
        description,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={!isOwner}
      />
      <Input
        placeholder="링크 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={!isOwner}
      />
      <div className="flex justify-end gap-2">
        {mode === "placeholder" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancelPlaceholder}
            disabled={isSaving}
          >
            취소
          </Button>
        ) : null}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isOwner || isSaving || isPristine}
          aria-busy={isSaving}
        >
          {isSaving ? "저장 중…" : "저장"}
        </Button>
      </div>
    </div>
  );
};

type TextBlockEditorProps = {
  mode: "placeholder" | "persisted";
  blockId?: string;
  handle: string;
  isOwner: boolean;
  data: { content?: string | null };
  onSavePlaceholder?: (data: { content: string }) => void;
  onCancelPlaceholder?: () => void;
};

const TextBlockEditor = ({
  mode,
  blockId,
  handle,
  isOwner,
  data,
  onSavePlaceholder,
  onCancelPlaceholder,
}: TextBlockEditorProps) => {
  const [content, setContent] = useState(data.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const isPristine = (content?.trim() ?? "") === (data.content?.trim() ?? "");

  const handleSave = async () => {
    if (!isOwner) return;
    const trimmed = content.trim();

    if (!trimmed) {
      toastManager.add({
        title: "입력을 확인하세요",
        description: "내용을 입력해주세요.",
        type: "warning",
      });
      return;
    }

    if (mode === "placeholder" && onSavePlaceholder) {
      setIsSaving(true);
      try {
        onSavePlaceholder({ content: trimmed });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!blockId) return;

    const toastId = toastManager.add({
      title: "텍스트 저장 중…",
      type: "loading",
      timeout: 0,
    });

    setIsSaving(true);
    try {
      const result = await saveTextBlock({
        blockId,
        handle,
        content: trimmed,
      });

      if (result.status === "error") {
        throw new Error(result.message);
      }

      toastManager.update(toastId, {
        title: "텍스트가 저장되었습니다.",
        type: "success",
      });
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.";
      toastManager.update(toastId, {
        title: "저장 실패",
        description,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={!isOwner}
      />
      <div className="flex justify-end gap-2">
        {mode === "placeholder" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancelPlaceholder}
            disabled={isSaving}
          >
            취소
          </Button>
        ) : null}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isOwner || isSaving || isPristine}
          aria-busy={isSaving}
        >
          {isSaving ? "저장 중…" : "저장"}
        </Button>
      </div>
    </div>
  );
};

export const PageBlocks = ({
  items,
  handle,
  isOwner,
  onSavePlaceholder,
  onCancelPlaceholder,
}: PageBlocksProps) => {
  const sortedBlocks = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.kind === "persisted" && b.kind === "persisted") {
          const aOrder = a.block.ordering;
          const bOrder = b.block.ordering;
          if (aOrder === null && bOrder === null) {
            return (
              new Date(a.block.created_at ?? 0).getTime() -
              new Date(b.block.created_at ?? 0).getTime()
            );
          }
          if (aOrder === null) return 1;
          if (bOrder === null) return -1;
          return aOrder - bOrder;
        }
        if (a.kind === "persisted") return -1;
        if (b.kind === "persisted") return 1;
        return 0;
      }),
    [items]
  );

  if (!items.length) {
    return (
      <Item
        asChild
        className="flex flex-col items-center space-y-3 max-w-sm text-center font-medium p-0 border-none bg-transparent shadow-none"
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <div className="size-32 rounded-full overflow-hidden">
                <Image
                  src={"/sprite-animation.gif"}
                  alt="There's no data."
                  width={200}
                  height={200}
                  className="object-cover w-full h-full grayscale"
                  unoptimized
                />
              </div>
            </EmptyMedia>
            <EmptyTitle>이곳은 여전히 고요합니다.</EmptyTitle>
            <EmptyDescription>
              비어 있음은 결핍이 아니라, 당신이 채울 가능성들이 아직 이름을 얻지
              않았다는 신호일지 모릅니다.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size={"sm"}>
              <Link href={"/"}>돌아가기</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Item>
    );
  }

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sortedBlocks.map((item) => {
          const isPlaceholder = item.kind === "placeholder";
          const block = item.kind === "persisted" ? item.block : undefined;
          const type = item.kind === "persisted" ? item.block.type : item.type;
          const blockId = block?.id;
          const createdAt =
            item.kind === "persisted" ? item.block.created_at : null;

          return (
            <div
              key={item.kind === "persisted" ? item.block.id : item.id}
              className="rounded-lg border border-zinc-200 p-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-800 capitalize">
                  {type}
                  {isPlaceholder ? " (임시)" : ""}
                </span>
                {block?.ordering !== null && block?.ordering !== undefined ? (
                  <span className="text-xs text-zinc-500">
                    #{block?.ordering}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {createdAt ? new Date(createdAt).toLocaleString() : "임시 블록"}
              </p>

              <div className="mt-3 space-y-3">
                {(() => {
                  switch (type) {
                    case "link":
                      return (
                        <LinkBlockEditor
                          mode={isPlaceholder ? "placeholder" : "persisted"}
                          blockId={blockId}
                          handle={handle}
                          isOwner={isOwner}
                          data={{
                            url: block?.url,
                            title: block?.title,
                          }}
                          onSavePlaceholder={
                            isPlaceholder
                              ? (data) =>
                                  onSavePlaceholder(item.id, "link", data)
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
                          mode={isPlaceholder ? "placeholder" : "persisted"}
                          blockId={blockId}
                          handle={handle}
                          isOwner={isOwner}
                          data={{ content: block?.content }}
                          onSavePlaceholder={
                            isPlaceholder
                              ? (data) =>
                                  onSavePlaceholder(item.id, "text", data)
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
        })}
      </div>
    </section>
  );
};
