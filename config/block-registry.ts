export type BlockUIType = "popover" | "upload" | "none";

export type BlockRegistryItem = {
  label: string;
  icon: string;
  enabled: boolean;
  ui: BlockUIType;
};

export const BLOCK_REGISTRY: Record<string, BlockRegistryItem> = {
  link: { label: "Link", icon: "Link", enabled: true, ui: "popover" },
  text: { label: "Text", icon: "Type", enabled: true, ui: "popover" },
  section: {
    label: "Section",
    icon: "PanelTop",
    enabled: false,
    ui: "popover",
  },
  image: { label: "Image", icon: "Image", enabled: false, ui: "upload" },
  video: { label: "Video", icon: "Video", enabled: false, ui: "upload" },
  map: { label: "Map", icon: "MapPin", enabled: false, ui: "none" },
  divider: { label: "Divider", icon: "Minus", enabled: false, ui: "none" },
} as const;
