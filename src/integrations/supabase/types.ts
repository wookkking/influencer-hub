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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      campaign_members: {
        Row: {
          campaign_id: string
          contact_date: string | null
          contact_note: string | null
          contact_status: string
          contract_returned: boolean
          contract_sent: boolean
          created_at: string
          id: string
          memo: string | null
          reply_date: string | null
          reply_note: string | null
          reply_status: string
          result_comments: number | null
          result_likes: number | null
          saved_influencer_id: string
          terms_note: string | null
          updated_at: string
          upload_date: string | null
          upload_link: string | null
          user_id: string
          views: number | null
        }
        Insert: {
          campaign_id: string
          contact_date?: string | null
          contact_note?: string | null
          contact_status?: string
          contract_returned?: boolean
          contract_sent?: boolean
          created_at?: string
          id?: string
          memo?: string | null
          reply_date?: string | null
          reply_note?: string | null
          reply_status?: string
          result_comments?: number | null
          result_likes?: number | null
          saved_influencer_id: string
          terms_note?: string | null
          updated_at?: string
          upload_date?: string | null
          upload_link?: string | null
          user_id: string
          views?: number | null
        }
        Update: {
          campaign_id?: string
          contact_date?: string | null
          contact_note?: string | null
          contact_status?: string
          contract_returned?: boolean
          contract_sent?: boolean
          created_at?: string
          id?: string
          memo?: string | null
          reply_date?: string | null
          reply_note?: string | null
          reply_status?: string
          result_comments?: number | null
          result_likes?: number | null
          saved_influencer_id?: string
          terms_note?: string | null
          updated_at?: string
          upload_date?: string | null
          upload_link?: string | null
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_saved_influencer_id_fkey"
            columns: ["saved_influencer_id"]
            isOneToOne: false
            referencedRelation: "saved_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      influencers: {
        Row: {
          account: string
          avg_comments: number
          avg_likes: number
          bio: string | null
          brand: string | null
          categories: string[]
          created_at: string
          created_by: string | null
          engagement_rate: number | null
          followers: number
          id: string
          last_post_date: string | null
          last_synced_at: string | null
          photo_url: string | null
          platform: string
          profile_url: string | null
          seq: number | null
          updated_at: string
        }
        Insert: {
          account: string
          avg_comments?: number
          avg_likes?: number
          bio?: string | null
          brand?: string | null
          categories?: string[]
          created_at?: string
          created_by?: string | null
          engagement_rate?: number | null
          followers?: number
          id?: string
          last_post_date?: string | null
          last_synced_at?: string | null
          photo_url?: string | null
          platform?: string
          profile_url?: string | null
          seq?: number | null
          updated_at?: string
        }
        Update: {
          account?: string
          avg_comments?: number
          avg_likes?: number
          bio?: string | null
          brand?: string | null
          categories?: string[]
          created_at?: string
          created_by?: string | null
          engagement_rate?: number | null
          followers?: number
          id?: string
          last_post_date?: string | null
          last_synced_at?: string | null
          photo_url?: string | null
          platform?: string
          profile_url?: string | null
          seq?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_influencers: {
        Row: {
          contact_date: string | null
          contact_note: string | null
          contact_status: string
          content_draft: boolean
          contract_returned: boolean
          contract_sent: boolean
          created_at: string
          id: string
          influencer_id: string
          memo: string | null
          reply_date: string | null
          reply_note: string | null
          reply_status: string
          result_comments: number | null
          result_likes: number | null
          terms_note: string | null
          terms_status: string
          updated_at: string
          upload_date: string | null
          upload_link: string | null
          user_id: string
          views: number | null
        }
        Insert: {
          contact_date?: string | null
          contact_note?: string | null
          contact_status?: string
          content_draft?: boolean
          contract_returned?: boolean
          contract_sent?: boolean
          created_at?: string
          id?: string
          influencer_id: string
          memo?: string | null
          reply_date?: string | null
          reply_note?: string | null
          reply_status?: string
          result_comments?: number | null
          result_likes?: number | null
          terms_note?: string | null
          terms_status?: string
          updated_at?: string
          upload_date?: string | null
          upload_link?: string | null
          user_id: string
          views?: number | null
        }
        Update: {
          contact_date?: string | null
          contact_note?: string | null
          contact_status?: string
          content_draft?: boolean
          contract_returned?: boolean
          contract_sent?: boolean
          created_at?: string
          id?: string
          influencer_id?: string
          memo?: string | null
          reply_date?: string | null
          reply_note?: string | null
          reply_status?: string
          result_comments?: number | null
          result_likes?: number | null
          terms_note?: string | null
          terms_status?: string
          updated_at?: string
          upload_date?: string | null
          upload_link?: string | null
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_influencers_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
