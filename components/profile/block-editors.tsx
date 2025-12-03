"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLinkBlockEditor } from "@/hooks/use-link-block-editor";
import { useTextBlockEditor } from "@/hooks/use-text-block-editor";
import type {
  LinkBlockEditorParams,
  TextBlockEditorParams,
} from "@/types/block-editor";

export type LinkBlockEditorProps = LinkBlockEditorParams & {
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
  const { values, setUrl, setTitle } = useLinkBlockEditor({
    mode,
    blockId,
    handle,
    isOwner,
    data,
    onSavePlaceholder,
  });

  const isPlaceholder = mode === "placeholder";

  return (
    <div className="space-y-2">
      <Input
        placeholder="https://example.com"
        value={values.url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={!isOwner}
      />

      <Input
        placeholder="링크 제목"
        value={values.title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={!isOwner}
      />

      {isPlaceholder && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={onCancelPlaceholder}>
            취소
          </Button>
        </div>
      )}
    </div>
  );
};

export type TextBlockEditorProps = TextBlockEditorParams & {
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
  const { values, setContent } = useTextBlockEditor({
    mode,
    blockId,
    handle,
    isOwner,
    data,
    onSavePlaceholder,
  });

  const isPlaceholder = mode === "placeholder";

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="내용을 입력하세요"
        value={values.content}
        onChange={(e) => setContent(e.target.value)}
        disabled={!isOwner}
      />

      {isPlaceholder && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={onCancelPlaceholder}>
            취소
          </Button>
        </div>
      )}
    </div>
  );
};
