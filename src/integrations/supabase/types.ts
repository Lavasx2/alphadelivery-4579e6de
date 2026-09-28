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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      courier_applications: {
        Row: {
          created_at: string
          fee_amount: number | null
          full_name: string
          id: string
          paid_at: string | null
          paused: boolean
          payment_holder: string | null
          payment_last4: string | null
          payment_reference: string | null
          payment_status: string
          phone: string
          status: string
          subscription_until: string | null
          user_id: string
          vehicle: string | null
        }
        Insert: {
          created_at?: string
          fee_amount?: number | null
          full_name: string
          id?: string
          paid_at?: string | null
          paused?: boolean
          payment_holder?: string | null
          payment_last4?: string | null
          payment_reference?: string | null
          payment_status?: string
          phone: string
          status?: string
          subscription_until?: string | null
          user_id: string
          vehicle?: string | null
        }
        Update: {
          created_at?: string
          fee_amount?: number | null
          full_name?: string
          id?: string
          paid_at?: string | null
          paused?: boolean
          payment_holder?: string | null
          payment_last4?: string | null
          payment_reference?: string | null
          payment_status?: string
          phone?: string
          status?: string
          subscription_until?: string | null
          user_id?: string
          vehicle?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          available: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          popular: boolean
          price: number
          sort_order: number
          store_id: string | null
        }
        Insert: {
          available?: boolean
          category: string
          created_at?: string
          description?: string | null
          id: string
          image_url?: string | null
          name: string
          popular?: boolean
          price?: number
          sort_order?: number
          store_id?: string | null
        }
        Update: {
          available?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          popular?: boolean
          price?: number
          sort_order?: number
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          address: string
          courier_id: string | null
          created_at: string
          customer_name: string
          delivered_at: string | null
          delivery_fee: number
          distance_km: number | null
          id: string
          items: Json
          lat: number | null
          lng: number | null
          maps_url: string | null
          notes: string | null
          phone: string
          status: string
          store_id: string | null
          total: number
        }
        Insert: {
          accepted_at?: string | null
          address: string
          courier_id?: string | null
          created_at?: string
          customer_name: string
          delivered_at?: string | null
          delivery_fee?: number
          distance_km?: number | null
          id?: string
          items: Json
          lat?: number | null
          lng?: number | null
          maps_url?: string | null
          notes?: string | null
          phone: string
          status?: string
          store_id?: string | null
          total: number
        }
        Update: {
          accepted_at?: string | null
          address?: string
          courier_id?: string | null
          created_at?: string
          customer_name?: string
          delivered_at?: string | null
          delivery_fee?: number
          distance_km?: number | null
          id?: string
          items?: Json
          lat?: number | null
          lng?: number | null
          maps_url?: string | null
          notes?: string | null
          phone?: string
          status?: string
          store_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_owner: boolean | null
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_owner?: boolean | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_owner?: boolean | null
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string | null
          banner_url: string | null
          category: string | null
          created_at: string
          delivery_fee_max: number
          delivery_fee_min: number
          delivery_max_km: number
          description: string | null
          featured: boolean
          fee_amount: number | null
          id: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          maps_url: string | null
          name: string
          opening_hours: Json | null
          owner_user_id: string | null
          paid_at: string | null
          payment_holder: string | null
          payment_last4: string | null
          payment_reference: string | null
          payment_status: string
          phone: string | null
          place_id: string | null
          plus_code: string | null
          primary_color: string | null
          rating: number | null
          rating_count: number | null
          secondary_color: string | null
          slug: string
          status: string
          subscription_paid_until: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          category?: string | null
          created_at?: string
          delivery_fee_max?: number
          delivery_fee_min?: number
          delivery_max_km?: number
          description?: string | null
          featured?: boolean
          fee_amount?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          maps_url?: string | null
          name: string
          opening_hours?: Json | null
          owner_user_id?: string | null
          paid_at?: string | null
          payment_holder?: string | null
          payment_last4?: string | null
          payment_reference?: string | null
          payment_status?: string
          phone?: string | null
          place_id?: string | null
          plus_code?: string | null
          primary_color?: string | null
          rating?: number | null
          rating_count?: number | null
          secondary_color?: string | null
          slug: string
          status?: string
          subscription_paid_until?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          category?: string | null
          created_at?: string
          delivery_fee_max?: number
          delivery_fee_min?: number
          delivery_max_km?: number
          description?: string | null
          featured?: boolean
          fee_amount?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          maps_url?: string | null
          name?: string
          opening_hours?: Json | null
          owner_user_id?: string | null
          paid_at?: string | null
          payment_holder?: string | null
          payment_last4?: string | null
          payment_reference?: string | null
          payment_status?: string
          phone?: string | null
          place_id?: string | null
          plus_code?: string | null
          primary_color?: string | null
          rating?: number | null
          rating_count?: number | null
          secondary_color?: string | null
          slug?: string
          status?: string
          subscription_paid_until?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
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
      claim_store_owner_role: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_store_owner: { Args: { _store_id: string }; Returns: boolean }
      store_is_live: { Args: { _store_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "courier" | "customer" | "store_owner"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["owner", "courier", "customer", "store_owner"],
    },
  },
} as const
