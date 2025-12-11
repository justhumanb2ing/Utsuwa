import {
  ArticleNyTimesIcon,
  GifIcon,
  LinkIcon,
  MapPinIcon,
  TextTIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

export type BlockUIType = "popover" | "upload" | "none";

export type BlockRegistryItem = {
  label: string;
  icon: PhosphorIcon;
  enabled: boolean;
  ui: BlockUIType;
};

export const BLOCK_REGISTRY = {
  link: { label: "Link", icon: LinkIcon, ui: "popover" },
  text: { label: "Text", icon: TextTIcon, ui: "popover" },
  image: { label: "Image", icon: GifIcon, ui: "upload" },
  map: { label: "Map", icon: MapPinIcon, ui: "none" },
  section: { label: "Section", icon: ArticleNyTimesIcon, ui: "popover" },
} as const;

export type BlockRegistry = typeof BLOCK_REGISTRY;
export type BlockKey = keyof BlockRegistry;
export type BlockConfig = BlockRegistry[BlockKey];
