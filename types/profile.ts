import type { Tables } from "@/types/database.types";
import type { BlockWithDetails } from "./block";

export type PagePayload = Pick<
  Tables<"pages">,
  "id" | "handle" | "title" | "description" | "image_url" | "owner_id"
>;

export type ProfileBffPayload = {
  page: PagePayload;
  isOwner: boolean;
  blocks: BlockWithDetails[];
};
