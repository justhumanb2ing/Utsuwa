"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import { useSaveStatus } from "@/components/profile/save-status-context";
import { blockQueryOptions } from "@/service/blocks/block-query-options";

export type LinkBlockEditorProps = {
  mode: "placeholder" | "persisted";
  blockId?: string;
  placeholderId?: string;
  handle: string;
  isOwner: boolean;
  data: { url?: string | null; title?: string | null };
  onSavePlaceholder?: (data: { url: string; title: string }) => void;
  onCancelPlaceholder?: () => void;
};

export const LinkBlockEditor = ({
  mode,
  blockId,
  handle,
  isOwner,
  data,
  onSavePlaceholder,
  onCancelPlaceholder,
}: LinkBlockEditorProps) => {
  const { setStatus } = useSaveStatus();
  const updateBlockMutation = useMutation(blockQueryOptions.updateContent());
  const [url, setUrl] = useState(data.url ?? "");
  const [title, setTitle] = useState(data.title ?? "");
  const [lastSaved, setLastSaved] = useState({
    url: (data.url ?? "").trim(),
    title: (data.title ?? "").trim(),
  });
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 초기 데이터만 반영하고 상태는 유지
    setUrl((prev) => (prev === "" ? data.url ?? "" : prev));
    setTitle((prev) => (prev === "" ? data.title ?? "" : prev));
    setLastSaved({
      url: (data.url ?? "").trim(),
      title: (data.title ?? "").trim(),
    });
  }, [data.url, data.title]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isOwner) return;

    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();
    const hasChanges =
      trimmedUrl !== lastSaved.url || trimmedTitle !== lastSaved.title;

    if (!hasChanges) {
      return;
    }

    setStatus("dirty");
    const debounceTimer = setTimeout(async () => {
      setStatus("saving");

      try {
        if (mode === "placeholder" && onSavePlaceholder) {
          await onSavePlaceholder({ url: trimmedUrl, title: trimmedTitle });
        } else if (mode === "persisted" && blockId) {
          const result = await updateBlockMutation.mutateAsync({
            type: "link",
            blockId,
            handle,
            url: trimmedUrl,
            title: trimmedTitle,
          });
          if (result.status === "error") {
            throw new Error(result.message);
          }
        }

        setLastSaved({ url: trimmedUrl, title: trimmedTitle });
        setStatus("saved");

        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => setStatus("idle"), 5000);
      } catch (error) {
        setStatus("error");
      }
    }, 1200);

    return () => clearTimeout(debounceTimer);
  }, [
    blockId,
    handle,
    isOwner,
    lastSaved.title,
    lastSaved.url,
    mode,
    onSavePlaceholder,
    setStatus,
    title,
    url,
    updateBlockMutation,
  ]);

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
      {mode === "placeholder" ? (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={onCancelPlaceholder}>
            취소
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export type TextBlockEditorProps = {
  mode: "placeholder" | "persisted";
  blockId?: string;
  handle: string;
  isOwner: boolean;
  data: { content?: string | null };
  onSavePlaceholder?: (data: { content: string }) => void;
  onCancelPlaceholder?: () => void;
};

export const TextBlockEditor = ({
  mode,
  blockId,
  handle,
  isOwner,
  data,
  onSavePlaceholder,
  onCancelPlaceholder,
}: TextBlockEditorProps) => {
  const { setStatus } = useSaveStatus();
  const updateBlockMutation = useMutation(blockQueryOptions.updateContent());
  const [content, setContent] = useState(data.content ?? "");
  const [lastSaved, setLastSaved] = useState((data.content ?? "").trim());
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setContent((prev) => (prev === "" ? data.content ?? "" : prev));
    setLastSaved((data.content ?? "").trim());
  }, [data.content]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    const trimmed = content.trim();
    const hasChanges = trimmed !== lastSaved;

    if (!hasChanges) {
      return;
    }

    setStatus("dirty");
    const debounceTimer = setTimeout(async () => {
      setStatus("saving");
      try {
        if (mode === "placeholder" && onSavePlaceholder) {
          await onSavePlaceholder({ content: trimmed });
        } else if (mode === "persisted" && blockId) {
          const result = await updateBlockMutation.mutateAsync({
            type: "text",
            blockId,
            handle,
            content: trimmed,
          });
          if (result.status === "error") {
            throw new Error(result.message);
          }
        }

        setLastSaved(trimmed);
        setStatus("saved");

        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => setStatus("idle"), 1500);
      } catch (error) {
        const description =
          error instanceof Error
            ? error.message
            : "잠시 후 다시 시도해 주세요.";
        toastManager.add({
          title: "저장 실패",
          description,
          type: "error",
        });
        setStatus("error");
      }
    }, 1200);

    return () => clearTimeout(debounceTimer);
  }, [
    blockId,
    content,
    handle,
    isOwner,
    lastSaved,
    mode,
    onSavePlaceholder,
    setStatus,
    updateBlockMutation,
  ]);

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={!isOwner}
      />
      {mode === "placeholder" ? (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={onCancelPlaceholder}>
            취소
          </Button>
        </div>
      ) : null}
    </div>
  );
};
