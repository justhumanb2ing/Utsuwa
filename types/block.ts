import type { Tables } from "@/types/database.types";

type BlockRow = Tables<"blocks">;

export type BlockWithDetails = {
  id: BlockRow["id"];
  type: BlockRow["type"];
  ordering: BlockRow["ordering"];
  created_at: BlockRow["created_at"];
  content?: Tables<"block_text">["content"] | null;
  url?: Tables<"block_link">["url"] | Tables<"block_video">["video_url"] | null;
  title?: Tables<"block_link">["title"] | null;
  description?: Tables<"block_link">["description"] | null;
  image_url?:
    | Tables<"block_link">["image_url"]
    | Tables<"block_image">["image_url"]
    | null;
  icon_url?: Tables<"block_link">["icon_url"] | null;
  link_url?: Tables<"block_image">["link_url"] | null;
  aspect_ratio?: Tables<"block_image">["aspect_ratio"] | null;
  thumbnail?: Tables<"block_video">["thumbnail"] | null;
  lat?: Tables<"block_map">["lat"] | null;
  lng?: Tables<"block_map">["lng"] | null;
  zoom?: Tables<"block_map">["zoom"] | null;
};
