import Image from "next/image";
import type { Tables } from "@/types/database.types";

import { Item } from "@/components/ui/item";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "../ui/button";
import Link from "next/link";

type Block = Pick<Tables<"blocks">, "id" | "type" | "ordering" | "created_at">;

type PageBlocksProps = {
  blocks: Block[];
};

export const PageBlocks = ({ blocks }: PageBlocksProps) => {
  if (!blocks.length) {
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
        {blocks.map((block) => (
          <div
            key={block.id}
            className="rounded-lg border border-zinc-200 p-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-800 capitalize">
                {block.type}
              </span>
              {block.ordering !== null ? (
                <span className="text-xs text-zinc-500">#{block.ordering}</span>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {block.created_at
                ? new Date(block.created_at).toLocaleString()
                : "생성일 미상"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
