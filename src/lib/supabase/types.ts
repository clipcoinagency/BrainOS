/**
 * Database types.
 *
 * Hand-authored to match `supabase/migrations`. Once you link a Supabase
 * project you can regenerate this file to stay perfectly in sync:
 *
 *   supabase gen types typescript --linked > src/lib/supabase/types.ts
 *
 * Keep the shape (`Database` export) so the typed clients keep working.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content?: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          priority: "none" | "low" | "medium" | "high";
          due_date: string | null;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          priority?: "none" | "low" | "medium" | "high";
          due_date?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          priority?: "none" | "low" | "medium" | "high";
          due_date?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          status: "active" | "achieved" | "archived";
          target_value: number;
          current_value: number;
          unit: string;
          target_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          status?: "active" | "achieved" | "archived";
          target_value?: number;
          current_value?: number;
          unit?: string;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          status?: "active" | "achieved" | "archived";
          target_value?: number;
          current_value?: number;
          unit?: string;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          status: "active" | "completed" | "archived";
          target_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          status?: "active" | "completed" | "archived";
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          status?: "active" | "completed" | "archived";
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_milestones: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          title: string;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          title: string;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          title?: string;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          mood: "great" | "good" | "okay" | "low" | "rough" | null;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date?: string;
          mood?: "great" | "good" | "okay" | "low" | "rough" | null;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_date?: string;
          mood?: "great" | "good" | "okay" | "low" | "rough" | null;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      knowledge_articles: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

/** Convenience helper: a row type for a public table. */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Profile = Tables<"profiles">;
export type Note = Tables<"notes">;
export type Task = Tables<"tasks">;
export type TaskPriority = Task["priority"];
export type Goal = Tables<"goals">;
export type GoalStatus = Goal["status"];
export type Project = Tables<"projects">;
export type ProjectStatus = Project["status"];
export type Milestone = Tables<"project_milestones">;
export type JournalEntry = Tables<"journal_entries">;
export type JournalMood = NonNullable<JournalEntry["mood"]>;
export type KnowledgeArticle = Tables<"knowledge_articles">;
