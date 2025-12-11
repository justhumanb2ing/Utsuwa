import * as Icons from "lucide-react";

export type BlockUIType = "popover" | "upload" | "none";

export type BlockRegistryItem = {
  label: string;
  icon: string;
  enabled: boolean;
  ui: BlockUIType;
};

export const BLOCK_REGISTRY = {
  link: { label: "Link", icon: Icons.LinkIcon, ui: "popover" },
  text: { label: "Text", icon: Icons.TypeIcon, ui: "popover" },
  image: { label: "Image", icon: Icons.ImageIcon, ui: "upload" },
  video: { label: "Video", icon: Icons.VideoIcon, ui: "upload" },
  map: { label: "Map", icon: Icons.MapPinIcon, ui: "none" },
  divider: { label: "Divider", icon: Icons.DivideIcon, ui: "none" },
  section: { label: "Section", icon: Icons.SectionIcon, ui: "popover" },
} as const;

export type BlockRegistry = typeof BLOCK_REGISTRY;
export type BlockKey = keyof BlockRegistry;
export type BlockConfig = BlockRegistry[BlockKey];
