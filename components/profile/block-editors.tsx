"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";

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
        data.status === "error"
          ? data.message
          : "링크를 저장하지 못했습니다.",
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
  const [content, setContent] = useState(data.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const isPristine =
    (content?.trim() ?? "") === (data.content?.trim() ?? "");

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
