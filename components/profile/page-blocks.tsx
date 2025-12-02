"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import type { BlockWithDetails } from "@/types/block";
import type { BlockType } from "@/config/block-registry";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Item } from "@/components/ui/item";
import {
  LinkBlockEditor,
  TextBlockEditor,
} from "@/components/profile/block-editors";
import { useSaveStatus } from "@/components/profile/save-status-context";

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
  onDeleteBlock?: (blockId: BlockWithDetails["id"]) => void;
  deletingBlockIds?: Set<BlockWithDetails["id"]>;
};

const extractLinkData = (
  block?: BlockWithDetails
): { url?: string | null; title?: string | null } => {
  if (!block) return {};
  return {
    url: block.url ?? null,
    title: block.title ?? null,
  };
};

const extractTextData = (
  block?: BlockWithDetails
): { content?: string | null } => {
  if (!block) return {};
  return {
    content: block.content ?? null,
  };
};

export const PageBlocks = ({
  items,
  handle,
  isOwner,
  onSavePlaceholder,
  onCancelPlaceholder,
  onDeleteBlock,
  deletingBlockIds,
}: PageBlocksProps) => {
  const { setStatus } = useSaveStatus();
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
    <section className="space-y-3 w-full">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sortedBlocks.map((item) => {
          const isPlaceholder = item.kind === "placeholder";
          const block = item.kind === "persisted" ? item.block : undefined;
          const type = item.kind === "persisted" ? item.block.type : item.type;
          const blockId = block?.id;
          const isDeleting =
            Boolean(blockId && deletingBlockIds?.has(blockId));

          return (
            <div
              key={item.kind === "persisted" ? item.block.id : item.id}
              className="group relative rounded-lg border border-zinc-200 p-3 shadow-sm"
            >
              {isOwner && blockId ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className={`absolute right-2 top-2 rounded-full border bg-white/90 shadow-sm transition-opacity ${
                    isDeleting ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  aria-label="블록 삭제"
                  disabled={isDeleting}
                  onClick={() => onDeleteBlock?.(blockId)}
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="size-4" aria-hidden />
                  )}
                </Button>
              ) : null}
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
                          data={extractLinkData(block)}
                          onSavePlaceholder={
                            isPlaceholder
                              ? (data) => {
                                  setStatus("dirty");
                                  onSavePlaceholder(item.id, "link", data);
                                }
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
                          data={extractTextData(block)}
                          onSavePlaceholder={
                            isPlaceholder
                              ? (data) => {
                                  setStatus("dirty");
                                  onSavePlaceholder(item.id, "text", data);
                                }
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
