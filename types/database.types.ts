export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      block_divider: {
        Row: {
          block_id: string
        }
        Insert: {
          block_id: string
        }
        Update: {
          block_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_divider_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: true
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      block_image: {
        Row: {
          aspect_ratio: number | null
          block_id: string
          image_url: string
          link_url: string | null
        }
        Insert: {
          aspect_ratio?: number | null
          block_id: string
          image_url: string
          link_url?: string | null
        }
        Update: {
          aspect_ratio?: number | null
          block_id?: string
          image_url?: string
          link_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "block_image_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: true
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      block_link: {
        Row: {
          block_id: string
          description: string | null
          fetched_at: string | null
          icon_url: string | null
          image_url: string | null
          title: string | null
          url: string
        }
        Insert: {
          block_id: string
          description?: string | null
          fetched_at?: string | null
          icon_url?: string | null
          image_url?: string | null
          title?: string | null
          url: string
        }
        Update: {
          block_id?: string
          description?: string | null
          fetched_at?: string | null
          icon_url?: string | null
          image_url?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_link_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: true
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      block_map: {
        Row: {
          block_id: string
          lat: number | null
          lng: number | null
          zoom: number | null
        }
        Insert: {
          block_id: string
          lat?: number | null
          lng?: number | null
          zoom?: number | null
        }
        Update: {
          block_id?: string
          lat?: number | null
          lng?: number | null
          zoom?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "block_map_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: true
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      block_text: {
        Row: {
          block_id: string
          content: string
        }
        Insert: {
          block_id: string
          content: string
        }
        Update: {
          block_id?: string
          content?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_text_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: true
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      block_video: {
        Row: {
          block_id: string
          thumbnail: string | null
          video_url: string
        }
        Insert: {
          block_id: string
          thumbnail?: string | null
          video_url: string
        }
        Update: {
          block_id?: string
          thumbnail?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_video_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: true
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          created_at: string | null
          id: string
          ordering: number | null
          page_id: string
          type: Database["public"]["Enums"]["block_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          ordering?: number | null
          page_id: string
          type: Database["public"]["Enums"]["block_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          ordering?: number | null
          page_id?: string
          type?: Database["public"]["Enums"]["block_type"]
        }
        Relationships: [
          {
            foreignKeyName: "blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string | null
          description: string | null
          handle: string
          id: string
          image_url: string | null
          is_public: boolean | null
          ordering: number | null
          owner_id: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          handle: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          ordering?: number | null
          owner_id: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          handle?: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          ordering?: number | null
          owner_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_block: {
        Args: {
          p_data: Json
          p_page_id: string
          p_type: Database["public"]["Enums"]["block_type"]
        }
        Returns: Json
      }
      get_block_types: { Args: never; Returns: string[] }
      get_blocks_with_details: { Args: { p_page_id: string }; Returns: Json }
      reorder_blocks_after_dnd: {
        Args: { p_blocks: Json; p_page_id: string }
        Returns: undefined
      }
      toggle_page_visibility: {
        Args: { p_page_id: string }
        Returns: {
          created_at: string | null
          description: string | null
          handle: string
          id: string
          image_url: string | null
          is_public: boolean | null
          ordering: number | null
          owner_id: string
          title: string | null
        }
        SetofOptions: {
          from: "*"
          to: "pages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      block_type:
        | "link"
        | "text"
        | "section"
        | "image"
        | "video"
        | "map"
        | "divider"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      block_type: [
        "link",
        "text",
        "section",
        "image",
        "video",
        "map",
        "divider",
      ],
    },
  },
} as const
