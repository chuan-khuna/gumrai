
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "cost_category": {
                  Row: {
                    "colour_slot": number,"created_at": string,"id": string,"name": string,"owner": string,"sort_order": number
                  }
                  Insert: {
                    "colour_slot": number,"created_at"?: string,"id"?: string,"name": string,"owner"?: string,"sort_order": number
                  }
                  Update: {
                    "colour_slot"?: number,"created_at"?: string,"id"?: string,"name"?: string,"owner"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"cost_item": {
                  Row: {
                    "cost_category_id": string | null,"created_at": string,"id": string,"name": string,"owner": string,"unit": string,"unit_cost": number
                  }
                  Insert: {
                    "cost_category_id"?: string | null,"created_at"?: string,"id"?: string,"name": string,"owner"?: string,"unit": string,"unit_cost": number
                  }
                  Update: {
                    "cost_category_id"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"owner"?: string,"unit"?: string,"unit_cost"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "cost_item_cost_category_id_fkey"
      columns: ["owner","cost_category_id"]
isOneToOne: false
      referencedRelation: "cost_category"
      referencedColumns: ["owner","id"]
    }
                  ]
                },"cost_line": {
                  Row: {
                    "cost_category_id": string | null,"cost_item_id": string | null,"id": string,"name": string | null,"owner": string,"position": number,"quantity_used": number,"sheet_id": string,"unit": string | null,"unit_cost": number | null
                  }
                  Insert: {
                    "cost_category_id"?: string | null,"cost_item_id"?: string | null,"id"?: string,"name"?: string | null,"owner"?: string,"position": number,"quantity_used": number,"sheet_id": string,"unit"?: string | null,"unit_cost"?: number | null
                  }
                  Update: {
                    "cost_category_id"?: string | null,"cost_item_id"?: string | null,"id"?: string,"name"?: string | null,"owner"?: string,"position"?: number,"quantity_used"?: number,"sheet_id"?: string,"unit"?: string | null,"unit_cost"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "cost_line_cost_category_id_fkey"
      columns: ["owner","cost_category_id"]
isOneToOne: false
      referencedRelation: "cost_category"
      referencedColumns: ["owner","id"]
    },{
      foreignKeyName: "cost_line_cost_item_id_fkey"
      columns: ["owner","cost_item_id"]
isOneToOne: false
      referencedRelation: "cost_item"
      referencedColumns: ["owner","id"]
    },{
      foreignKeyName: "cost_line_sheet_id_fkey"
      columns: ["owner","sheet_id"]
isOneToOne: false
      referencedRelation: "cost_sheet"
      referencedColumns: ["owner","id"]
    }
                  ]
                },"cost_sheet": {
                  Row: {
                    "created_at": string,"gp_percent": number,"id": string,"name": string,"owner": string,"sale_unit": string,"selling_price": number,"updated_at": string,"vat_percent": number
                  }
                  Insert: {
                    "created_at"?: string,"gp_percent"?: number,"id"?: string,"name": string,"owner"?: string,"sale_unit"?: string,"selling_price"?: number,"updated_at"?: string,"vat_percent"?: number
                  }
                  Update: {
                    "created_at"?: string,"gp_percent"?: number,"id"?: string,"name"?: string,"owner"?: string,"sale_unit"?: string,"selling_price"?: number,"updated_at"?: string,"vat_percent"?: number
                  }
                  Relationships: [
                    
                  ]
                },"seller_profile": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string
                  }
                  Insert: {
                    "created_at"?: string,"display_name": string,"id": string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "delete_cost_item":
{ Args: { "p_id": string }; Returns: undefined
                           },
"duplicate_cost_sheet":
{ Args: { "p_name": string,"p_sheet_id": string }; Returns: string
                           },
"save_cost_sheet":
{ Args: { "p_lines": Json,"p_sheet": Json,"p_sheet_id": string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const

