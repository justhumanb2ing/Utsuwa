"use client";

import { useMemo } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  BLOCK_REGISTRY,
  type BlockRegistryItem,
  type BlockType,
} from "@/config/block-registry";
import { Button } from "../ui/button";

type IconLookup = Record<string, LucideIcon>;
type BlockRegistryKey = keyof typeof BLOCK_REGISTRY;

const resolveIconComponent = (iconName: string): LucideIcon => {
  const icons = LucideIcons as unknown as IconLookup;
  return icons[iconName] ?? LucideIcons.Square;
};

const BLOCK_UI_HINT: Record<BlockRegistryKey, string> = {
  link: "링크 정보를 채워주세요.",
  text: "텍스트를 입력하면 바로 저장됩니다.",
  section: "섹션 구성은 추후 설정을 통해 확장됩니다.",
  image: "이미지 파일을 업로드해 주세요.",
  video: "동영상 파일을 업로드해 주세요.",
  map: "맵 블록은 별도 설정 없이 생성됩니다.",
  divider: "구분선이 추가됩니다.",
};

type BlockRegistryPanelProps = {
  onSelectBlock: (type: BlockType) => void;
};

export const BlockRegistryPanel = ({ onSelectBlock }: BlockRegistryPanelProps) => {
  const registryEntries = useMemo(
    () => Object.entries(BLOCK_REGISTRY) as [BlockRegistryKey, BlockRegistryItem][],
    []
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-1">
        {registryEntries.map(([key, item]) => {
          const Icon = resolveIconComponent(item.icon);
          return (
            <div key={key} className="flex items-center">
              <Button
                size={"icon-sm"}
                variant={"outline"}
                disabled={!item.enabled}
                aria-label={`${item.label} 블록 추가`}
                title={BLOCK_UI_HINT[key]}
                onClick={() => onSelectBlock(key)}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
