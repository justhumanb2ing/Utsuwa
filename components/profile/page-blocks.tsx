"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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

const extractLinkData = (
  block?: BlockWithDetails
): { url?: string | null; title?: string | null } => {
  if (!block) return {};
  const rawData =
    typeof block === "object" && "data" in block && block.data && typeof block.data === "object"
      ? (block.data as Record<string, unknown>)
      : undefined;

  return {
    url: block.link_url ?? (rawData?.url as string | undefined) ?? null,
    title: block.title ?? (rawData?.title as string | undefined) ?? null,
  };
};

const extractTextData = (
  block?: BlockWithDetails
): { content?: string | null } => {
  if (!block) return {};
  const rawData =
    typeof block === "object" && "data" in block && block.data && typeof block.data === "object"
      ? (block.data as Record<string, unknown>)
      : undefined;

  return {
    content: block.content ?? (rawData?.content as string | undefined) ?? null,
  };
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
                    #{block.ordering}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {createdAt
                  ? new Date(createdAt).toLocaleString()
                  : "임시 블록"}
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
                          data={extractLinkData(block)}
                          onSavePlaceholder={
                            isPlaceholder
                              ? (data) =>
                                  onSavePlaceholder(
                                    item.id,
                                    "link",
                                    data
                                  )
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
                              ? (data) =>
                                  onSavePlaceholder(
                                    item.id,
                                    "text",
                                    data
                                  )
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
