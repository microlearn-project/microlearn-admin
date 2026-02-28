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
      activity_log: {
        Row: {
          action: string | null
          created_at: string
          id_activity_log: string
          meta: Json | null
          objet_id: string | null
          objet_type: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          id_activity_log?: string
          meta?: Json | null
          objet_id?: string | null
          objet_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          id_activity_log?: string
          meta?: Json | null
          objet_id?: string | null
          objet_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "agent"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_agent"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id_agent: string
          id_session: string
          ip_address: unknown
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id_agent: string
          id_session?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id_agent?: string
          id_session?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "agent"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "admin_sessions_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_agent"]
          },
        ]
      }
      agent: {
        Row: {
          actif: boolean
          code_agent: string
          created_at: string
          deleted_at: string | null
          email: string
          id_agent: string
          id_departement: string
          id_direction: string
          last_login: string | null
          nom: string
          password_hash: string
          prenom: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          code_agent: string
          created_at?: string
          deleted_at?: string | null
          email: string
          id_agent?: string
          id_departement: string
          id_direction: string
          last_login?: string | null
          nom: string
          password_hash: string
          prenom: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          code_agent?: string
          created_at?: string
          deleted_at?: string | null
          email?: string
          id_agent?: string
          id_departement?: string
          id_direction?: string
          last_login?: string | null
          nom?: string
          password_hash?: string
          prenom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_id_departement_fkey"
            columns: ["id_departement"]
            isOneToOne: false
            referencedRelation: "departement"
            referencedColumns: ["id_departement"]
          },
          {
            foreignKeyName: "agent_id_departement_fkey"
            columns: ["id_departement"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_departement"]
          },
          {
            foreignKeyName: "agent_id_direction_fkey"
            columns: ["id_direction"]
            isOneToOne: false
            referencedRelation: "direction"
            referencedColumns: ["id_direction"]
          },
          {
            foreignKeyName: "agent_id_direction_fkey"
            columns: ["id_direction"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_direction"]
          },
        ]
      }
      autorite_superieure: {
        Row: {
          actif: boolean
          code: string
          created_at: string
          designation: string
          id_autorite: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          code: string
          created_at?: string
          designation: string
          id_autorite?: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          code?: string
          created_at?: string
          designation?: string
          id_autorite?: string
          updated_at?: string
        }
        Relationships: []
      }
      cours: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string
          documents: string[] | null
          duree_lecture: string
          id_cours: string
          id_module: string
          ordre: number
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description: string
          documents?: string[] | null
          duree_lecture: string
          id_cours?: string
          id_module: string
          ordre: number
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          documents?: string[] | null
          duree_lecture?: string
          id_cours?: string
          id_module?: string
          ordre?: number
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cours_id_module_fkey"
            columns: ["id_module"]
            isOneToOne: false
            referencedRelation: "module"
            referencedColumns: ["id_module"]
          },
        ]
      }
      departement: {
        Row: {
          actif: boolean
          created_at: string
          deleted_at: string | null
          designation: string
          id_departement: string
          id_direction: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          deleted_at?: string | null
          designation: string
          id_departement?: string
          id_direction: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          deleted_at?: string | null
          designation?: string
          id_departement?: string
          id_direction?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departement_id_direction_fkey"
            columns: ["id_direction"]
            isOneToOne: false
            referencedRelation: "direction"
            referencedColumns: ["id_direction"]
          },
          {
            foreignKeyName: "departement_id_direction_fkey"
            columns: ["id_direction"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_direction"]
          },
        ]
      }
      direction: {
        Row: {
          actif: boolean
          created_at: string
          deleted_at: string | null
          designation: string
          id_autorite: string
          id_direction: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          deleted_at?: string | null
          designation: string
          id_autorite: string
          id_direction?: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          deleted_at?: string | null
          designation?: string
          id_autorite?: string
          id_direction?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direction_id_autorite_fkey"
            columns: ["id_autorite"]
            isOneToOne: false
            referencedRelation: "autorite_superieure"
            referencedColumns: ["id_autorite"]
          },
          {
            foreignKeyName: "direction_id_autorite_fkey"
            columns: ["id_autorite"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_autorite"]
          },
        ]
      }
      document: {
        Row: {
          created_at: string
          fichier: string
          id_document: string
          id_module: string
          nom_original: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fichier: string
          id_document?: string
          id_module: string
          nom_original?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fichier?: string
          id_document?: string
          id_module?: string
          nom_original?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_id_module_fkey"
            columns: ["id_module"]
            isOneToOne: false
            referencedRelation: "module"
            referencedColumns: ["id_module"]
          },
        ]
      }
      module: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string
          download_enabled: boolean
          duree_lecture: string
          id_agent: string
          id_module: string
          publish: boolean
          publish_at: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description: string
          download_enabled?: boolean
          duree_lecture: string
          id_agent: string
          id_module?: string
          publish?: boolean
          publish_at?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          download_enabled?: boolean
          duree_lecture?: string
          id_agent?: string
          id_module?: string
          publish?: boolean
          publish_at?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "agent"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "module_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_agent"]
          },
        ]
      }
      module_departement: {
        Row: {
          date_attribution: string
          id_departement: string
          id_module: string
        }
        Insert: {
          date_attribution?: string
          id_departement: string
          id_module: string
        }
        Update: {
          date_attribution?: string
          id_departement?: string
          id_module?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_departement_id_departement_fkey"
            columns: ["id_departement"]
            isOneToOne: false
            referencedRelation: "departement"
            referencedColumns: ["id_departement"]
          },
          {
            foreignKeyName: "module_departement_id_departement_fkey"
            columns: ["id_departement"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_departement"]
          },
          {
            foreignKeyName: "module_departement_id_module_fkey"
            columns: ["id_module"]
            isOneToOne: false
            referencedRelation: "module"
            referencedColumns: ["id_module"]
          },
        ]
      }
      module_tag: {
        Row: {
          id_module: string
          id_tag: string
        }
        Insert: {
          id_module: string
          id_tag: string
        }
        Update: {
          id_module?: string
          id_tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_tag_id_module_fkey"
            columns: ["id_module"]
            isOneToOne: false
            referencedRelation: "module"
            referencedColumns: ["id_module"]
          },
          {
            foreignKeyName: "module_tag_id_tag_fkey"
            columns: ["id_tag"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["id_tag"]
          },
        ]
      }
      question: {
        Row: {
          actif: boolean
          created_at: string
          id_question: string
          id_quiz: string
          texte: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id_question?: string
          id_quiz: string
          texte: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          id_question?: string
          id_quiz?: string
          texte?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_id_quiz_fkey"
            columns: ["id_quiz"]
            isOneToOne: false
            referencedRelation: "quiz"
            referencedColumns: ["id_quiz"]
          },
        ]
      }
      quiz: {
        Row: {
          created_at: string
          description: string | null
          id_cours: string
          id_quiz: string
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id_cours: string
          id_quiz?: string
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id_cours?: string
          id_quiz?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_id_cours_fkey"
            columns: ["id_cours"]
            isOneToOne: true
            referencedRelation: "cours"
            referencedColumns: ["id_cours"]
          },
        ]
      }
      reponse: {
        Row: {
          created_at: string
          est_correcte: boolean
          explication: string | null
          id_question: string
          id_reponse: string
          texte: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          est_correcte?: boolean
          explication?: string | null
          id_question: string
          id_reponse?: string
          texte: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          est_correcte?: boolean
          explication?: string | null
          id_question?: string
          id_reponse?: string
          texte?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reponse_id_question_fkey"
            columns: ["id_question"]
            isOneToOne: false
            referencedRelation: "question"
            referencedColumns: ["id_question"]
          },
        ]
      }
      reponse_agent: {
        Row: {
          date_reponse: string
          id_agent: string
          id_question: string
          id_reponse: string
        }
        Insert: {
          date_reponse?: string
          id_agent: string
          id_question: string
          id_reponse: string
        }
        Update: {
          date_reponse?: string
          id_agent?: string
          id_question?: string
          id_reponse?: string
        }
        Relationships: [
          {
            foreignKeyName: "reponse_agent_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "agent"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "reponse_agent_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "reponse_agent_id_question_fkey"
            columns: ["id_question"]
            isOneToOne: false
            referencedRelation: "question"
            referencedColumns: ["id_question"]
          },
          {
            foreignKeyName: "reponse_agent_id_reponse_fkey"
            columns: ["id_reponse"]
            isOneToOne: false
            referencedRelation: "reponse"
            referencedColumns: ["id_reponse"]
          },
        ]
      }
      resultat_quiz: {
        Row: {
          date_debut: string | null
          date_fin: string | null
          id_agent: string
          id_quiz: string
          score: number | null
          termine: boolean
          updated_at: string
        }
        Insert: {
          date_debut?: string | null
          date_fin?: string | null
          id_agent: string
          id_quiz: string
          score?: number | null
          termine?: boolean
          updated_at?: string
        }
        Update: {
          date_debut?: string | null
          date_fin?: string | null
          id_agent?: string
          id_quiz?: string
          score?: number | null
          termine?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resultat_quiz_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "agent"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "resultat_quiz_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "resultat_quiz_id_quiz_fkey"
            columns: ["id_quiz"]
            isOneToOne: false
            referencedRelation: "quiz"
            referencedColumns: ["id_quiz"]
          },
        ]
      }
      role: {
        Row: {
          created_at: string
          designation: string
          id_role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          designation: string
          id_role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          designation?: string
          id_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      suivi_module: {
        Row: {
          date_debut: string
          date_fin: string | null
          id_agent: string
          id_module: string
          progression: number | null
          updated_at: string
        }
        Insert: {
          date_debut?: string
          date_fin?: string | null
          id_agent: string
          id_module: string
          progression?: number | null
          updated_at?: string
        }
        Update: {
          date_debut?: string
          date_fin?: string | null
          id_agent?: string
          id_module?: string
          progression?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suivi_module_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "agent"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "suivi_module_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "suivi_module_id_module_fkey"
            columns: ["id_module"]
            isOneToOne: false
            referencedRelation: "module"
            referencedColumns: ["id_module"]
          },
        ]
      }
      tag: {
        Row: {
          created_at: string
          deleted_at: string | null
          designation: string
          id_tag: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          designation: string
          id_tag?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          designation?: string
          id_tag?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_role: {
        Row: {
          created_at: string
          date_from: string
          date_to: string | null
          granted_by: string | null
          id_agent: string
          id_role: string
          id_user_role: string
          updated_at: string
          valide: boolean
        }
        Insert: {
          created_at?: string
          date_from?: string
          date_to?: string | null
          granted_by?: string | null
          id_agent: string
          id_role: string
          id_user_role?: string
          updated_at?: string
          valide?: boolean
        }
        Update: {
          created_at?: string
          date_from?: string
          date_to?: string | null
          granted_by?: string | null
          id_agent?: string
          id_role?: string
          id_user_role?: string
          updated_at?: string
          valide?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_role_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "agent"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "user_role_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "user_role_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "agent"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "user_role_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "view_hierarchie_complete"
            referencedColumns: ["id_agent"]
          },
          {
            foreignKeyName: "user_role_id_role_fkey"
            columns: ["id_role"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id_role"]
          },
        ]
      }
    }
    Views: {
      view_hierarchie_complete: {
        Row: {
          actif: boolean | null
          autorite_actif: boolean | null
          autorite_code: string | null
          autorite_designation: string | null
          code_agent: string | null
          departement_actif: boolean | null
          departement_designation: string | null
          direction_actif: boolean | null
          direction_designation: string | null
          email: string | null
          id_agent: string | null
          id_autorite: string | null
          id_departement: string | null
          id_direction: string | null
          nom: string | null
          prenom: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      clean_expired_sessions: { Args: never; Returns: undefined }
      count_modules_for_service: {
        Args: { p_service_ids?: string[] }
        Returns: number
      }
      get_cours_with_quiz_status: {
        Args: { p_agent_id: string; p_module_id: string }
        Returns: {
          description: string
          documents: string[]
          duree_lecture: string
          id_cours: string
          is_completed: boolean
          ordre: number
          quiz_id: string
          quiz_score: number
          titre: string
        }[]
      }
      get_modules_in_progress: {
        Args: { p_agent_id: string; p_limit?: number }
        Returns: {
          cours_completes: number
          created_at: string
          description: string
          download_enabled: boolean
          duree_lecture: string
          id_module: string
          progression: number
          publish: boolean
          publish_at: string
          tags: string[]
          titre: string
          total_cours: number
        }[]
      }
      get_modules_with_progress: {
        Args: {
          p_agent_id: string
          p_limit?: number
          p_offset?: number
          p_service_ids?: string[]
        }
        Returns: {
          cours_completes: number
          created_at: string
          description: string
          download_enabled: boolean
          duree_lecture: string
          id_module: string
          progression: number
          publish: boolean
          publish_at: string
          tags: string[]
          titre: string
          total_cours: number
        }[]
      }
      get_recommended_modules: {
        Args: { p_agent_id: string; p_limit?: number; p_service_id: string }
        Returns: {
          cours_completes: number
          created_at: string
          description: string
          download_enabled: boolean
          duree_lecture: string
          id_module: string
          progression: number
          publish: boolean
          publish_at: string
          tags: string[]
          titre: string
          total_cours: number
        }[]
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
    Enums: {},
  },
} as const
