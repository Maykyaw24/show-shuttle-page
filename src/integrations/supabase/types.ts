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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      events: {
        Row: {
          artist: string
          category: Database["public"]["Enums"]["event_category"]
          city: string
          created_at: string
          description: string | null
          event_date: string
          id: string
          image_url: string | null
          price: number
          rejection_reason: string | null
          seller_id: string
          status: Database["public"]["Enums"]["event_status"]
          ticket_count: number
          tickets_sold: number
          title: string
          trust_level: Database["public"]["Enums"]["trust_level"] | null
          trust_reason: string | null
          updated_at: string
          venue: string
        }
        Insert: {
          artist: string
          category?: Database["public"]["Enums"]["event_category"]
          city: string
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          price: number
          rejection_reason?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["event_status"]
          ticket_count: number
          tickets_sold?: number
          title: string
          trust_level?: Database["public"]["Enums"]["trust_level"] | null
          trust_reason?: string | null
          updated_at?: string
          venue: string
        }
        Update: {
          artist?: string
          category?: Database["public"]["Enums"]["event_category"]
          city?: string
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          price?: number
          rejection_reason?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["event_status"]
          ticket_count?: number
          tickets_sold?: number
          title?: string
          trust_level?: Database["public"]["Enums"]["trust_level"] | null
          trust_reason?: string | null
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_note: string | null
          buyer_id: string
          created_at: string
          event_id: string
          id: string
          payment_proof_url: string | null
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          buyer_id: string
          created_at?: string
          event_id: string
          id?: string
          payment_proof_url?: string | null
          quantity: number
          status?: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          buyer_id?: string
          created_at?: string
          event_id?: string
          id?: string
          payment_proof_url?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          event_category: string | null
          full_name: string | null
          id: string
          organization: string | null
          phone: string | null
          seller_type: Database["public"]["Enums"]["seller_type"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          event_category?: string | null
          full_name?: string | null
          id: string
          organization?: string | null
          phone?: string | null
          seller_type?: Database["public"]["Enums"]["seller_type"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          event_category?: string | null
          full_name?: string | null
          id?: string
          organization?: string | null
          phone?: string | null
          seller_type?: Database["public"]["Enums"]["seller_type"] | null
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          buyer_id: string
          created_at: string
          event_id: string
          id: string
          order_id: string
          qr_code: string
          status: Database["public"]["Enums"]["ticket_status"]
          used_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          event_id: string
          id?: string
          order_id: string
          qr_code: string
          status?: Database["public"]["Enums"]["ticket_status"]
          used_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          event_id?: string
          id?: string
          order_id?: string
          qr_code?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "buyer" | "seller" | "admin"
      event_category:
        | "rock"
        | "pop"
        | "edm"
        | "hiphop"
        | "jazz"
        | "classical"
        | "indie"
        | "metal"
        | "folk"
        | "other"
      event_status: "pending" | "approved" | "rejected" | "cancelled"
      order_status:
        | "pending"
        | "awaiting_review"
        | "paid"
        | "confirmed"
        | "cancelled"
        | "refunded"
      seller_type: "artist" | "organizer" | "promoter" | "venue" | "agency"
      ticket_status: "valid" | "used" | "pending" | "cancelled"
      trust_level: "trusted" | "needs_review" | "suspicious"
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
      app_role: ["buyer", "seller", "admin"],
      event_category: [
        "rock",
        "pop",
        "edm",
        "hiphop",
        "jazz",
        "classical",
        "indie",
        "metal",
        "folk",
        "other",
      ],
      event_status: ["pending", "approved", "rejected", "cancelled"],
      order_status: [
        "pending",
        "awaiting_review",
        "paid",
        "confirmed",
        "cancelled",
        "refunded",
      ],
      seller_type: ["artist", "organizer", "promoter", "venue", "agency"],
      ticket_status: ["valid", "used", "pending", "cancelled"],
      trust_level: ["trusted", "needs_review", "suspicious"],
    },
  },
} as const
