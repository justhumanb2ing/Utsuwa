export type ResolvedLink = {
  kind: "rich" | "metadata";
  platform?: string;
  tier?: string;
  resource?: string;
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  faviconUrl?: string;
  data?: Record<string, unknown>;
  source: "provider" | "platform-only" | "og";
};
