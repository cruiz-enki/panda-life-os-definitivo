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
      achievements_unlocked: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      allowed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string | null
          is_owner: boolean
          note: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          is_owner?: boolean
          note?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          is_owner?: boolean
          note?: string | null
        }
        Relationships: []
      }
      battle_pass_levels: {
        Row: {
          created_at: string
          id: string
          level: number
          reward_emoji: string
          reward_id: string | null
          reward_text: string
          season_id: string
          xp_required: number
        }
        Insert: {
          created_at?: string
          id?: string
          level: number
          reward_emoji?: string
          reward_id?: string | null
          reward_text?: string
          season_id: string
          xp_required: number
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          reward_emoji?: string
          reward_id?: string | null
          reward_text?: string
          season_id?: string
          xp_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_levels_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_shop"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_levels_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_pass_mission_progress: {
        Row: {
          claimed: boolean
          id: string
          mission_id: string
          period_key: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed?: boolean
          id?: string
          mission_id: string
          period_key: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          id?: string
          mission_id?: string
          period_key?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_pass_missions: {
        Row: {
          active: boolean
          created_at: string
          description: string
          emoji: string
          id: string
          mission_type: string
          season_id: string
          target: number
          title: string
          updated_at: string
          xp: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          mission_type?: string
          season_id: string
          target?: number
          title: string
          updated_at?: string
          xp?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          mission_type?: string
          season_id?: string
          target?: number
          title?: string
          updated_at?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_missions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_pass_seasons: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          emoji: string
          ends_on: string
          focus: string
          id: string
          motivational_messages: string[]
          name: string
          objective: string
          starts_on: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          emoji?: string
          ends_on: string
          focus?: string
          id?: string
          motivational_messages?: string[]
          name: string
          objective?: string
          starts_on: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          emoji?: string
          ends_on?: string
          focus?: string
          id?: string
          motivational_messages?: string[]
          name?: string
          objective?: string
          starts_on?: string
          updated_at?: string
        }
        Relationships: []
      }
      battle_pass_streaks: {
        Row: {
          current_streak: number
          id: string
          last_active_date: string | null
          longest_streak: number
          season_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          season_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          season_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_streaks_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_pass_unlocks: {
        Row: {
          id: string
          level: number
          redemption_id: string | null
          season_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          level: number
          redemption_id?: string | null
          season_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          level?: number
          redemption_id?: string | null
          season_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_unlocks_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "reward_redemptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_unlocks_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      card_payments: {
        Row: {
          amount: number
          card_id: string
          created_at: string
          date: string
          id: string
          note: string
          payment_method: string
          user_id: string
        }
        Insert: {
          amount: number
          card_id: string
          created_at?: string
          date?: string
          id?: string
          note?: string
          payment_method?: string
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string
          created_at?: string
          date?: string
          id?: string
          note?: string
          payment_method?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_payments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_log: {
        Row: {
          content_type: string
          created_at: string
          current_position: string | null
          end_date: string | null
          genre: string | null
          id: string
          key_learnings: string | null
          notes: string | null
          platform: string | null
          progress_percent: number
          rating: number | null
          recommend: string | null
          start_date: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          current_position?: string | null
          end_date?: string | null
          genre?: string | null
          id?: string
          key_learnings?: string | null
          notes?: string | null
          platform?: string | null
          progress_percent?: number
          rating?: number | null
          recommend?: string | null
          start_date?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          current_position?: string | null
          end_date?: string | null
          genre?: string | null
          id?: string
          key_learnings?: string | null
          notes?: string | null
          platform?: string | null
          progress_percent?: number
          rating?: number | null
          recommend?: string | null
          start_date?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          bank: string
          color: string
          created_at: string
          credit_limit: number
          current_balance: number
          cut_day: number
          icon: string
          id: string
          last_four: string
          min_payment: number
          name: string
          nip_code: string | null
          no_interest_payment: number
          payment_day: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank?: string
          color?: string
          created_at?: string
          credit_limit?: number
          current_balance?: number
          cut_day?: number
          icon?: string
          id?: string
          last_four?: string
          min_payment?: number
          name: string
          nip_code?: string | null
          no_interest_payment?: number
          payment_day?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank?: string
          color?: string
          created_at?: string
          credit_limit?: number
          current_balance?: number
          cut_day?: number
          icon?: string
          id?: string
          last_four?: string
          min_payment?: number
          name?: string
          nip_code?: string | null
          no_interest_payment?: number
          payment_day?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_achievements: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          emoji: string
          id: string
          metric: string | null
          name: string
          rarity: string
          target: number | null
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          metric?: string | null
          name: string
          rarity?: string
          target?: number | null
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          metric?: string | null
          name?: string
          rarity?: string
          target?: number | null
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      custom_quests: {
        Row: {
          active: boolean
          completed_at: string | null
          created_at: string
          description: string
          due_date: string | null
          emoji: string
          estimated_minutes: number | null
          id: string
          linked_goal_id: string | null
          metric: string | null
          module_key: string | null
          priority: string
          scope: string
          status: string
          target: number
          title: string
          tracking: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          active?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          emoji?: string
          estimated_minutes?: number | null
          id?: string
          linked_goal_id?: string | null
          metric?: string | null
          module_key?: string | null
          priority?: string
          scope?: string
          status?: string
          target?: number
          title: string
          tracking?: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          active?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          emoji?: string
          estimated_minutes?: number | null
          id?: string
          linked_goal_id?: string | null
          metric?: string | null
          module_key?: string | null
          priority?: string
          scope?: string
          status?: string
          target?: number
          title?: string
          tracking?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      custom_rewards_shop: {
        Row: {
          coin_cost: number
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          is_redeemed: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coin_cost?: number
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_redeemed?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coin_cost?: number
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_redeemed?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_wins: {
        Row: {
          content: string
          created_at: string
          date: string
          feeling: string | null
          id: string
          user_id: string
          xp_rewarded: boolean | null
        }
        Insert: {
          content: string
          created_at?: string
          date?: string
          feeling?: string | null
          id?: string
          user_id: string
          xp_rewarded?: boolean | null
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          feeling?: string | null
          id?: string
          user_id?: string
          xp_rewarded?: boolean | null
        }
        Relationships: []
      }
      decision_options: {
        Row: {
          ai_analysis: string | null
          cons: string[] | null
          content: string
          created_at: string
          decision_id: string
          id: string
          pros: string[] | null
        }
        Insert: {
          ai_analysis?: string | null
          cons?: string[] | null
          content: string
          created_at?: string
          decision_id: string
          id?: string
          pros?: string[] | null
        }
        Update: {
          ai_analysis?: string | null
          cons?: string[] | null
          content?: string
          created_at?: string
          decision_id?: string
          id?: string
          pros?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_options_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          created_at: string
          id: string
          method: string
          question: string
          result: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          method: string
          question: string
          result?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          method?: string
          question?: string
          result?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dreams: {
        Row: {
          category: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          image_url: string | null
          motivation: string | null
          status: string | null
          timeframe: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          motivation?: string | null
          status?: string | null
          timeframe?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          motivation?: string | null
          status?: string | null
          timeframe?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      energy_entries: {
        Row: {
          created_at: string
          date: string
          emotional: number
          id: string
          mental: number
          notes: string | null
          pain: number | null
          physical: number
          sleep: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          emotional: number
          id?: string
          mental: number
          notes?: string | null
          pain?: number | null
          physical: number
          sleep?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          emotional?: number
          id?: string
          mental?: number
          notes?: string | null
          pain?: number | null
          physical?: number
          sleep?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_user_prefs: {
        Row: {
          exercise_id: string
          id: string
          notes: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_user_prefs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          default_reps: string
          default_sets: number
          duration_minutes: number
          emoji: string
          equipment: string
          id: string
          image_urls: string[] | null
          instructions: string
          level: string
          muscle_group: string
          name: string
          precautions: string
          updated_at: string
          xp_reward: number
          youtube_url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          default_reps?: string
          default_sets?: number
          duration_minutes?: number
          emoji?: string
          equipment?: string
          id?: string
          image_urls?: string[] | null
          instructions?: string
          level?: string
          muscle_group?: string
          name: string
          precautions?: string
          updated_at?: string
          xp_reward?: number
          youtube_url?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          default_reps?: string
          default_sets?: number
          duration_minutes?: number
          emoji?: string
          equipment?: string
          id?: string
          image_urls?: string[] | null
          instructions?: string
          level?: string
          muscle_group?: string
          name?: string
          precautions?: string
          updated_at?: string
          xp_reward?: number
          youtube_url?: string
        }
        Relationships: []
      }
      family_pets: {
        Row: {
          birth_date: string | null
          breed: string | null
          created_at: string
          emoji: string | null
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          birth_date?: string | null
          breed?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          birth_date?: string | null
          breed?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      finance_budgets: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          id: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          id?: string
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_categories: {
        Row: {
          color: string
          created_at: string
          emoji: string
          id: string
          kind: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          kind?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          kind?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_expenses: {
        Row: {
          amount: number
          card_id: string | null
          category: string
          created_at: string
          date: string
          expense_type: string
          id: string
          kind: string
          msi_plan_id: string | null
          note: string
          payment_method: string
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          card_id?: string | null
          category?: string
          created_at?: string
          date?: string
          expense_type?: string
          id?: string
          kind?: string
          msi_plan_id?: string | null
          note?: string
          payment_method?: string
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string | null
          category?: string
          created_at?: string
          date?: string
          expense_type?: string
          id?: string
          kind?: string
          msi_plan_id?: string | null
          note?: string
          payment_method?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_expenses_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_reminders: {
        Row: {
          active: boolean
          card_id: string | null
          created_at: string
          date: string
          days_before: number
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          active?: boolean
          card_id?: string | null
          created_at?: string
          date: string
          days_before?: number
          id?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          active?: boolean
          card_id?: string | null
          created_at?: string
          date?: string
          days_before?: number
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_reminders_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      future_letters: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          title: string
          unlock_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          title: string
          unlock_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          title?: string
          unlock_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      future_simulations: {
        Row: {
          ai_insight: string | null
          created_at: string
          id: string
          simulation_data: Json
          timeframe: string
          type: string
          user_id: string
        }
        Insert: {
          ai_insight?: string | null
          created_at?: string
          id?: string
          simulation_data: Json
          timeframe: string
          type: string
          user_id: string
        }
        Update: {
          ai_insight?: string | null
          created_at?: string
          id?: string
          simulation_data?: Json
          timeframe?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_actions: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "goal_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_projects: {
        Row: {
          created_at: string
          description: string | null
          goal_id: string
          id: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          goal_id: string
          id?: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          goal_id?: string
          id?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          dream_id: string | null
          id: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dream_id?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dream_id?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_dream_id_fkey"
            columns: ["dream_id"]
            isOneToOne: false
            referencedRelation: "dreams"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string
          emoji: string
          frequency: string
          history: string[]
          id: string
          last_completed: string | null
          name: string
          points: number
          streak: number
          target_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          frequency?: string
          history?: string[]
          id?: string
          last_completed?: string | null
          name: string
          points?: number
          streak?: number
          target_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          frequency?: string
          history?: string[]
          id?: string
          last_completed?: string | null
          name?: string
          points?: number
          streak?: number
          target_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_body_entries: {
        Row: {
          age: number | null
          antebrazo_der: number | null
          antebrazo_izq: number | null
          bmi: number | null
          bmr: number | null
          body_fat: number | null
          body_type: string | null
          bone_mass: number | null
          brazo_der: number | null
          brazo_izq: number | null
          cadera: number | null
          cintura: number | null
          created_at: string
          cuello: number | null
          date: string
          device_source: string | null
          fat_control: number | null
          fat_free_mass: number | null
          fat_mass: number | null
          height: number | null
          id: string
          imp_100khz_arm_left: number | null
          imp_100khz_arm_right: number | null
          imp_100khz_leg_left: number | null
          imp_100khz_leg_right: number | null
          imp_100khz_trunk: number | null
          imp_20khz_arm_left: number | null
          imp_20khz_arm_right: number | null
          imp_20khz_leg_left: number | null
          imp_20khz_leg_right: number | null
          imp_20khz_trunk: number | null
          inbody_score: number | null
          lean_body_weight: number | null
          measured_at: string | null
          measurement_id: string | null
          metabolic_age: number | null
          mineral_mass: number | null
          muneca: number | null
          muscle_control: number | null
          muscle_mass: number | null
          muslo_der: number | null
          muslo_izq: number | null
          notes: string | null
          obesity_degree: number | null
          optimal_fat_target: number | null
          optimal_muscle_target: number | null
          pantorrilla_der: number | null
          pantorrilla_izq: number | null
          pecho: number | null
          protein_mass: number | null
          seg_fat_arm_left: number | null
          seg_fat_arm_right: number | null
          seg_fat_leg_left: number | null
          seg_fat_leg_right: number | null
          seg_fat_trunk: number | null
          seg_muscle_arm_left: number | null
          seg_muscle_arm_right: number | null
          seg_muscle_leg_left: number | null
          seg_muscle_leg_right: number | null
          seg_muscle_pct_arm_left: number | null
          seg_muscle_pct_arm_right: number | null
          seg_muscle_pct_leg_left: number | null
          seg_muscle_pct_leg_right: number | null
          seg_muscle_pct_trunk: number | null
          seg_muscle_trunk: number | null
          sex: string | null
          skeletal_muscle_mass: number | null
          smi: number | null
          subcutaneous_fat: number | null
          target_weight: number | null
          total_body_water: number | null
          total_muscle_mass: number | null
          updated_at: string
          user_id: string
          visceral_fat: number | null
          visceral_fat_level: number | null
          weight: number | null
          weight_control: number | null
          whr: number | null
        }
        Insert: {
          age?: number | null
          antebrazo_der?: number | null
          antebrazo_izq?: number | null
          bmi?: number | null
          bmr?: number | null
          body_fat?: number | null
          body_type?: string | null
          bone_mass?: number | null
          brazo_der?: number | null
          brazo_izq?: number | null
          cadera?: number | null
          cintura?: number | null
          created_at?: string
          cuello?: number | null
          date?: string
          device_source?: string | null
          fat_control?: number | null
          fat_free_mass?: number | null
          fat_mass?: number | null
          height?: number | null
          id?: string
          imp_100khz_arm_left?: number | null
          imp_100khz_arm_right?: number | null
          imp_100khz_leg_left?: number | null
          imp_100khz_leg_right?: number | null
          imp_100khz_trunk?: number | null
          imp_20khz_arm_left?: number | null
          imp_20khz_arm_right?: number | null
          imp_20khz_leg_left?: number | null
          imp_20khz_leg_right?: number | null
          imp_20khz_trunk?: number | null
          inbody_score?: number | null
          lean_body_weight?: number | null
          measured_at?: string | null
          measurement_id?: string | null
          metabolic_age?: number | null
          mineral_mass?: number | null
          muneca?: number | null
          muscle_control?: number | null
          muscle_mass?: number | null
          muslo_der?: number | null
          muslo_izq?: number | null
          notes?: string | null
          obesity_degree?: number | null
          optimal_fat_target?: number | null
          optimal_muscle_target?: number | null
          pantorrilla_der?: number | null
          pantorrilla_izq?: number | null
          pecho?: number | null
          protein_mass?: number | null
          seg_fat_arm_left?: number | null
          seg_fat_arm_right?: number | null
          seg_fat_leg_left?: number | null
          seg_fat_leg_right?: number | null
          seg_fat_trunk?: number | null
          seg_muscle_arm_left?: number | null
          seg_muscle_arm_right?: number | null
          seg_muscle_leg_left?: number | null
          seg_muscle_leg_right?: number | null
          seg_muscle_pct_arm_left?: number | null
          seg_muscle_pct_arm_right?: number | null
          seg_muscle_pct_leg_left?: number | null
          seg_muscle_pct_leg_right?: number | null
          seg_muscle_pct_trunk?: number | null
          seg_muscle_trunk?: number | null
          sex?: string | null
          skeletal_muscle_mass?: number | null
          smi?: number | null
          subcutaneous_fat?: number | null
          target_weight?: number | null
          total_body_water?: number | null
          total_muscle_mass?: number | null
          updated_at?: string
          user_id: string
          visceral_fat?: number | null
          visceral_fat_level?: number | null
          weight?: number | null
          weight_control?: number | null
          whr?: number | null
        }
        Update: {
          age?: number | null
          antebrazo_der?: number | null
          antebrazo_izq?: number | null
          bmi?: number | null
          bmr?: number | null
          body_fat?: number | null
          body_type?: string | null
          bone_mass?: number | null
          brazo_der?: number | null
          brazo_izq?: number | null
          cadera?: number | null
          cintura?: number | null
          created_at?: string
          cuello?: number | null
          date?: string
          device_source?: string | null
          fat_control?: number | null
          fat_free_mass?: number | null
          fat_mass?: number | null
          height?: number | null
          id?: string
          imp_100khz_arm_left?: number | null
          imp_100khz_arm_right?: number | null
          imp_100khz_leg_left?: number | null
          imp_100khz_leg_right?: number | null
          imp_100khz_trunk?: number | null
          imp_20khz_arm_left?: number | null
          imp_20khz_arm_right?: number | null
          imp_20khz_leg_left?: number | null
          imp_20khz_leg_right?: number | null
          imp_20khz_trunk?: number | null
          inbody_score?: number | null
          lean_body_weight?: number | null
          measured_at?: string | null
          measurement_id?: string | null
          metabolic_age?: number | null
          mineral_mass?: number | null
          muneca?: number | null
          muscle_control?: number | null
          muscle_mass?: number | null
          muslo_der?: number | null
          muslo_izq?: number | null
          notes?: string | null
          obesity_degree?: number | null
          optimal_fat_target?: number | null
          optimal_muscle_target?: number | null
          pantorrilla_der?: number | null
          pantorrilla_izq?: number | null
          pecho?: number | null
          protein_mass?: number | null
          seg_fat_arm_left?: number | null
          seg_fat_arm_right?: number | null
          seg_fat_leg_left?: number | null
          seg_fat_leg_right?: number | null
          seg_fat_trunk?: number | null
          seg_muscle_arm_left?: number | null
          seg_muscle_arm_right?: number | null
          seg_muscle_leg_left?: number | null
          seg_muscle_leg_right?: number | null
          seg_muscle_pct_arm_left?: number | null
          seg_muscle_pct_arm_right?: number | null
          seg_muscle_pct_leg_left?: number | null
          seg_muscle_pct_leg_right?: number | null
          seg_muscle_pct_trunk?: number | null
          seg_muscle_trunk?: number | null
          sex?: string | null
          skeletal_muscle_mass?: number | null
          smi?: number | null
          subcutaneous_fat?: number | null
          target_weight?: number | null
          total_body_water?: number | null
          total_muscle_mass?: number | null
          updated_at?: string
          user_id?: string
          visceral_fat?: number | null
          visceral_fat_level?: number | null
          weight?: number | null
          weight_control?: number | null
          whr?: number | null
        }
        Relationships: []
      }
      health_goals: {
        Row: {
          created_at: string
          current_value: number | null
          id: string
          indicator_name: string
          start_value: number | null
          status: string
          target_type: string
          target_value: number
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          id?: string
          indicator_name: string
          start_value?: number | null
          status?: string
          target_type: string
          target_value: number
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          id?: string
          indicator_name?: string
          start_value?: number | null
          status?: string
          target_type?: string
          target_value?: number
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_meals: {
        Row: {
          classification: string
          created_at: string
          date: string
          description: string | null
          id: string
          meal_type: string
          protein_grams: number | null
          time: string | null
          user_id: string
        }
        Insert: {
          classification?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          meal_type?: string
          protein_grams?: number | null
          time?: string | null
          user_id: string
        }
        Update: {
          classification?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          meal_type?: string
          protein_grams?: number | null
          time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_medication_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          medication_id: string
          notes: string | null
          scheduled_time: string | null
          taken: boolean
          taken_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          medication_id: string
          notes?: string | null
          scheduled_time?: string | null
          taken?: boolean
          taken_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          medication_id?: string
          notes?: string | null
          scheduled_time?: string | null
          taken?: boolean
          taken_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_medications: {
        Row: {
          active: boolean
          color: string
          created_at: string
          diagnosis_id: string | null
          doctor_id: string | null
          dose: string | null
          emoji: string
          end_date: string | null
          frequency: string
          id: string
          last_completed_date: string | null
          name: string
          notes: string | null
          quantity: number | null
          schedule_times: string[]
          side_effects: string | null
          start_date: string | null
          status: string
          streak: number
          times_per_day: number
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          diagnosis_id?: string | null
          doctor_id?: string | null
          dose?: string | null
          emoji?: string
          end_date?: string | null
          frequency?: string
          id?: string
          last_completed_date?: string | null
          name: string
          notes?: string | null
          quantity?: number | null
          schedule_times?: string[]
          side_effects?: string | null
          start_date?: string | null
          status?: string
          streak?: number
          times_per_day?: number
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          diagnosis_id?: string | null
          doctor_id?: string | null
          dose?: string | null
          emoji?: string
          end_date?: string | null
          frequency?: string
          id?: string
          last_completed_date?: string | null
          name?: string
          notes?: string | null
          quantity?: number | null
          schedule_times?: string[]
          side_effects?: string | null
          start_date?: string | null
          status?: string
          streak?: number
          times_per_day?: number
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_symptoms: {
        Row: {
          created_at: string
          date: string
          description: string
          duration: string
          id: string
          intensity: number
          notes: string
          tags: string[]
          time_of_day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string
          duration?: string
          id?: string
          intensity?: number
          notes?: string
          tags?: string[]
          time_of_day?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          duration?: string
          id?: string
          intensity?: number
          notes?: string
          tags?: string[]
          time_of_day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ml?: number
          created_at?: string
          date: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hidden_defaults: {
        Row: {
          created_at: string
          default_id: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_id: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_id?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      home_areas: {
        Row: {
          color: string
          created_at: string
          emoji: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      home_completions: {
        Row: {
          completed_date: string
          created_at: string
          id: string
          notes: string
          task_id: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          completed_date?: string
          created_at?: string
          id?: string
          notes?: string
          task_id: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          completed_date?: string
          created_at?: string
          id?: string
          notes?: string
          task_id?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "home_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "home_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      home_inventory: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string
          id: string
          model_number: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_place: string | null
          serial_number: string | null
          technical_details: Json | null
          updated_at: string
          user_id: string
          warranty_expiry: string | null
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          model_number?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_place?: string | null
          serial_number?: string | null
          technical_details?: Json | null
          updated_at?: string
          user_id: string
          warranty_expiry?: string | null
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          model_number?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_place?: string | null
          serial_number?: string | null
          technical_details?: Json | null
          updated_at?: string
          user_id?: string
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      home_services: {
        Row: {
          category: string | null
          created_at: string
          due_day: number | null
          emoji: string | null
          id: string
          monthly_cost: number | null
          name: string
          provider: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          due_day?: number | null
          emoji?: string | null
          id?: string
          monthly_cost?: number | null
          name: string
          provider?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          due_day?: number | null
          emoji?: string | null
          id?: string
          monthly_cost?: number | null
          name?: string
          provider?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      home_tasks: {
        Row: {
          active: boolean
          area_id: string | null
          created_at: string
          day_of_week: number | null
          description: string
          emoji: string
          frequency: string
          id: string
          is_key: boolean
          scheduled_date: string | null
          sort_order: number
          task_type: string
          title: string
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          area_id?: string | null
          created_at?: string
          day_of_week?: number | null
          description?: string
          emoji?: string
          frequency?: string
          id?: string
          is_key?: boolean
          scheduled_date?: string | null
          sort_order?: number
          task_type?: string
          title: string
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          area_id?: string | null
          created_at?: string
          day_of_week?: number | null
          description?: string
          emoji?: string
          frequency?: string
          id?: string
          is_key?: boolean
          scheduled_date?: string | null
          sort_order?: number
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "home_tasks_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "home_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      horizons: {
        Row: {
          completed_at: string | null
          content: string | null
          created_at: string
          horizon_type: string
          id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content?: string | null
          created_at?: string
          horizon_type: string
          id?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content?: string | null
          created_at?: string
          horizon_type?: string
          id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      house_maintenance: {
        Row: {
          cost: number | null
          created_at: string
          date: string
          description: string | null
          id: string
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          status: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      identity_areas: {
        Row: {
          area: string
          created_at: string
          id: string
          month: string
          notes: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          month: string
          notes?: string
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          month?: string
          notes?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      identity_journal: {
        Row: {
          alignment: number
          created_at: string
          date: string
          did_not_well: string
          did_well: string
          emotion: string
          energy: number | null
          id: string
          insight: string
          learned: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alignment?: number
          created_at?: string
          date?: string
          did_not_well?: string
          did_well?: string
          emotion?: string
          energy?: number | null
          id?: string
          insight?: string
          learned?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alignment?: number
          created_at?: string
          date?: string
          did_not_well?: string
          did_well?: string
          emotion?: string
          energy?: number | null
          id?: string
          insight?: string
          learned?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      identity_profile: {
        Row: {
          active_areas: string[]
          core_values: string[]
          created_at: string
          desired_identity: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_areas?: string[]
          core_values?: string[]
          created_at?: string
          desired_identity?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_areas?: string[]
          core_values?: string[]
          created_at?: string
          desired_identity?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      identity_score_snapshots: {
        Row: {
          breakdown: Json
          created_at: string
          date: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          breakdown?: Json
          created_at?: string
          date?: string
          id?: string
          score: number
          user_id: string
        }
        Update: {
          breakdown?: Json
          created_at?: string
          date?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      identity_weekly_reflection: {
        Row: {
          ai_generated: boolean
          analysis: string
          created_at: string
          id: string
          patterns: string
          recommendations: string
          updated_at: string
          user_id: string
          week_key: string
        }
        Insert: {
          ai_generated?: boolean
          analysis?: string
          created_at?: string
          id?: string
          patterns?: string
          recommendations?: string
          updated_at?: string
          user_id: string
          week_key: string
        }
        Update: {
          ai_generated?: boolean
          analysis?: string
          created_at?: string
          id?: string
          patterns?: string
          recommendations?: string
          updated_at?: string
          user_id?: string
          week_key?: string
        }
        Relationships: []
      }
      introspection_answers: {
        Row: {
          created_at: string
          id: string
          question_id: string
          session_id: string
          updated_at: string
          user_id: string
          value_json: Json | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          session_id: string
          updated_at?: string
          user_id: string
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          session_id?: string
          updated_at?: string
          user_id?: string
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "introspection_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "introspection_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "introspection_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "introspection_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      introspection_exercises: {
        Row: {
          active: boolean
          category: string
          color_from: string | null
          color_to: string | null
          created_at: string
          description: string | null
          duration_max: number | null
          duration_min: number | null
          emoji: string | null
          id: string
          intro_text: string | null
          level: string | null
          name: string
          premium: boolean
          sort_order: number
          subtitle: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          color_from?: string | null
          color_to?: string | null
          created_at?: string
          description?: string | null
          duration_max?: number | null
          duration_min?: number | null
          emoji?: string | null
          id: string
          intro_text?: string | null
          level?: string | null
          name: string
          premium?: boolean
          sort_order?: number
          subtitle?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          color_from?: string | null
          color_to?: string | null
          created_at?: string
          description?: string | null
          duration_max?: number | null
          duration_min?: number | null
          emoji?: string | null
          id?: string
          intro_text?: string | null
          level?: string | null
          name?: string
          premium?: boolean
          sort_order?: number
          subtitle?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      introspection_questions: {
        Row: {
          block_key: string
          block_label: string
          created_at: string
          exercise_id: string
          id: string
          meta: Json | null
          options: Json | null
          sort_order: number
          text: string
          type: string
        }
        Insert: {
          block_key: string
          block_label: string
          created_at?: string
          exercise_id: string
          id: string
          meta?: Json | null
          options?: Json | null
          sort_order: number
          text: string
          type: string
        }
        Update: {
          block_key?: string
          block_label?: string
          created_at?: string
          exercise_id?: string
          id?: string
          meta?: Json | null
          options?: Json | null
          sort_order?: number
          text?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "introspection_questions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "introspection_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      introspection_sessions: {
        Row: {
          ai_result: Json | null
          completed_at: string | null
          created_at: string
          exercise_id: string
          id: string
          level_label: string | null
          level_secondary_label: string | null
          notes: string | null
          score: number | null
          score_max: number | null
          score_secondary: number | null
          score_secondary_max: number | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_result?: Json | null
          completed_at?: string | null
          created_at?: string
          exercise_id: string
          id?: string
          level_label?: string | null
          level_secondary_label?: string | null
          notes?: string | null
          score?: number | null
          score_max?: number | null
          score_secondary?: number | null
          score_secondary_max?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_result?: Json | null
          completed_at?: string | null
          created_at?: string
          exercise_id?: string
          id?: string
          level_label?: string | null
          level_secondary_label?: string | null
          notes?: string | null
          score?: number | null
          score_max?: number | null
          score_secondary?: number | null
          score_secondary_max?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "introspection_sessions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "introspection_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_indicators: {
        Row: {
          category: string
          control_tips: string | null
          created_at: string
          description: string | null
          doctor_advice: string | null
          high_causes: string | null
          id: string
          is_active: boolean | null
          low_causes: string | null
          name: string
          ref_display: string | null
          ref_max: number | null
          ref_min: number | null
          ref_type: string
          sort_order: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category: string
          control_tips?: string | null
          created_at?: string
          description?: string | null
          doctor_advice?: string | null
          high_causes?: string | null
          id?: string
          is_active?: boolean | null
          low_causes?: string | null
          name: string
          ref_display?: string | null
          ref_max?: number | null
          ref_min?: number | null
          ref_type: string
          sort_order?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          control_tips?: string | null
          created_at?: string
          description?: string | null
          doctor_advice?: string | null
          high_causes?: string | null
          id?: string
          is_active?: boolean | null
          low_causes?: string | null
          name?: string
          ref_display?: string | null
          ref_max?: number | null
          ref_min?: number | null
          ref_type?: string
          sort_order?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          category: string | null
          created_at: string
          id: string
          indicator_id: string | null
          indicator_key: string
          indicator_name: string
          notes: string | null
          ref_max: number | null
          ref_min: number | null
          result_date: string | null
          status: string | null
          study_id: string | null
          unit: string | null
          updated_at: string
          user_id: string
          value: number | null
          value_text: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          indicator_id?: string | null
          indicator_key: string
          indicator_name: string
          notes?: string | null
          ref_max?: number | null
          ref_min?: number | null
          result_date?: string | null
          status?: string | null
          study_id?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
          value?: number | null
          value_text?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          indicator_id?: string | null
          indicator_key?: string
          indicator_name?: string
          notes?: string | null
          ref_max?: number | null
          ref_min?: number | null
          result_date?: string | null
          status?: string | null
          study_id?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
          value?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "lab_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "lab_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_studies: {
        Row: {
          created_at: string
          date: string
          file_url: string | null
          id: string
          lab_name: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          file_url?: string | null
          id?: string
          lab_name?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          file_url?: string | null
          id?: string
          lab_name?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_logs: {
        Row: {
          ai_summary: string | null
          category: string | null
          content: string
          created_at: string
          id: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          category?: string | null
          content: string
          created_at?: string
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learnings: {
        Row: {
          category: string
          created_at: string
          date: string
          id: string
          notes: string
          skill_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string
          skill_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string
          skill_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      life_metrics: {
        Row: {
          business: number | null
          created_at: string
          finances: number | null
          health: number | null
          id: string
          relationships: number | null
          stress: number | null
          user_id: string
        }
        Insert: {
          business?: number | null
          created_at?: string
          finances?: number | null
          health?: number | null
          id?: string
          relationships?: number | null
          stress?: number | null
          user_id: string
        }
        Update: {
          business?: number | null
          created_at?: string
          finances?: number | null
          health?: number | null
          id?: string
          relationships?: number | null
          stress?: number | null
          user_id?: string
        }
        Relationships: []
      }
      life_randomizer_history: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          custom_title: string | null
          id: string
          mission_id: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          custom_title?: string | null
          id?: string
          mission_id?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          custom_title?: string | null
          id?: string
          mission_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_randomizer_history_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "life_randomizer_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      life_randomizer_missions: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          title: string
          user_id: string | null
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          title: string
          user_id?: string | null
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          title?: string
          user_id?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      magic_items: {
        Row: {
          active: boolean | null
          cost_xp: number
          created_at: string
          description: string | null
          effect_type: string
          effect_value: Json | null
          emoji: string | null
          id: string
          name: string
          rarity: string | null
        }
        Insert: {
          active?: boolean | null
          cost_xp?: number
          created_at?: string
          description?: string | null
          effect_type: string
          effect_value?: Json | null
          emoji?: string | null
          id?: string
          name: string
          rarity?: string | null
        }
        Update: {
          active?: boolean | null
          cost_xp?: number
          created_at?: string
          description?: string | null
          effect_type?: string
          effect_value?: Json | null
          emoji?: string | null
          id?: string
          name?: string
          rarity?: string | null
        }
        Relationships: []
      }
      meal_dishes: {
        Row: {
          active: boolean
          allowed_meal_types: string[] | null
          classification: string
          created_at: string
          dish_type: string
          emoji: string
          id: string
          ingredients: Json
          name: string
          notes: string
          prep_minutes: number
          preparation: string
          servings: number
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          allowed_meal_types?: string[] | null
          classification?: string
          created_at?: string
          dish_type?: string
          emoji?: string
          id?: string
          ingredients?: Json
          name: string
          notes?: string
          prep_minutes?: number
          preparation?: string
          servings?: number
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          allowed_meal_types?: string[] | null
          classification?: string
          created_at?: string
          dish_type?: string
          emoji?: string
          id?: string
          ingredients?: Json
          name?: string
          notes?: string
          prep_minutes?: number
          preparation?: string
          servings?: number
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      meal_ingredients: {
        Row: {
          active: boolean
          category: string
          created_at: string
          default_qty: string
          default_unit: string
          emoji: string
          id: string
          name: string
          notes: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          default_qty?: string
          default_unit?: string
          emoji?: string
          id?: string
          name: string
          notes?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          default_qty?: string
          default_unit?: string
          emoji?: string
          id?: string
          name?: string
          notes?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_plan: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          custom_name: string
          date: string
          dish_id: string | null
          id: string
          meal_type: string
          notes: string
          updated_at: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          custom_name?: string
          date: string
          dish_id?: string | null
          id?: string
          meal_type: string
          notes?: string
          updated_at?: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          custom_name?: string
          date?: string
          dish_id?: string | null
          id?: string
          meal_type?: string
          notes?: string
          updated_at?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "meal_dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_prep_batches: {
        Row: {
          created_at: string
          days_lasting: number
          dish_id: string | null
          id: string
          ingredient_id: string | null
          name: string
          notes: string
          prep_date: string
          servings_remaining: number
          servings_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_lasting?: number
          dish_id?: string | null
          id?: string
          ingredient_id?: string | null
          name?: string
          notes?: string
          prep_date?: string
          servings_remaining?: number
          servings_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_lasting?: number
          dish_id?: string | null
          id?: string
          ingredient_id?: string | null
          name?: string
          notes?: string
          prep_date?: string
          servings_remaining?: number
          servings_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_prep_batches_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "meal_dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_prep_batches_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "meal_ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_appointments: {
        Row: {
          created_at: string
          date: string
          doctor_id: string | null
          id: string
          location: string
          notes: string
          reason: string
          reminder_days_before: number
          reminder_enabled: boolean
          status: string
          time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          doctor_id?: string | null
          id?: string
          location?: string
          notes?: string
          reason?: string
          reminder_days_before?: number
          reminder_enabled?: boolean
          status?: string
          time?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          doctor_id?: string | null
          id?: string
          location?: string
          notes?: string
          reason?: string
          reminder_days_before?: number
          reminder_enabled?: boolean
          status?: string
          time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_consultations: {
        Row: {
          created_at: string
          date: string
          diagnosis: string
          doctor_id: string | null
          id: string
          indications: string
          next_appointment: string | null
          notes: string
          prescribed_meds: string
          reason: string
          requested_studies: string
          symptoms: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          diagnosis?: string
          doctor_id?: string | null
          id?: string
          indications?: string
          next_appointment?: string | null
          notes?: string
          prescribed_meds?: string
          reason?: string
          requested_studies?: string
          symptoms?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          diagnosis?: string
          doctor_id?: string | null
          id?: string
          indications?: string
          next_appointment?: string | null
          notes?: string
          prescribed_meds?: string
          reason?: string
          requested_studies?: string
          symptoms?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_diagnoses: {
        Row: {
          created_at: string
          date: string
          doctor_id: string | null
          id: string
          name: string
          notes: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          doctor_id?: string | null
          id?: string
          name: string
          notes?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          doctor_id?: string | null
          id?: string
          name?: string
          notes?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_doctors: {
        Row: {
          clinic: string
          created_at: string
          email: string
          emoji: string
          id: string
          name: string
          notes: string
          phone: string
          specialty: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic?: string
          created_at?: string
          email?: string
          emoji?: string
          id?: string
          name: string
          notes?: string
          phone?: string
          specialty?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic?: string
          created_at?: string
          email?: string
          emoji?: string
          id?: string
          name?: string
          notes?: string
          phone?: string
          specialty?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_studies: {
        Row: {
          created_at: string
          date: string
          doctor_id: string | null
          file_url: string
          id: string
          name: string
          notes: string
          result: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          doctor_id?: string | null
          file_url?: string
          id?: string
          name: string
          notes?: string
          result?: string
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          doctor_id?: string | null
          file_url?: string
          id?: string
          name?: string
          notes?: string
          result?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_treatments: {
        Row: {
          created_at: string
          diagnosis_id: string | null
          doctor_id: string | null
          duration: string
          end_date: string | null
          frequency: string
          id: string
          indications: string
          name: string
          notes: string
          result: string
          start_date: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnosis_id?: string | null
          doctor_id?: string | null
          duration?: string
          end_date?: string | null
          frequency?: string
          id?: string
          indications?: string
          name: string
          notes?: string
          result?: string
          start_date?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagnosis_id?: string | null
          doctor_id?: string | null
          duration?: string
          end_date?: string | null
          frequency?: string
          id?: string
          indications?: string
          name?: string
          notes?: string
          result?: string
          start_date?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      msi_plans: {
        Row: {
          card_id: string | null
          category: string
          created_at: string
          description: string
          id: string
          monthly_amount: number
          months: number
          note: string
          paid_months: number
          start_date: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          monthly_amount: number
          months: number
          note?: string
          paid_months?: number
          start_date?: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          monthly_amount?: number
          months?: number
          note?: string
          paid_months?: number
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "msi_plans_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          category: string
          checklist: Json
          content: string
          created_at: string
          id: string
          importance: string
          linked_note_ids: string[]
          tags: string[]
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          checklist?: Json
          content?: string
          created_at?: string
          id?: string
          importance?: string
          linked_note_ids?: string[]
          tags?: string[]
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          checklist?: Json
          content?: string
          created_at?: string
          id?: string
          importance?: string
          linked_note_ids?: string[]
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          notification_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          notification_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          notification_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notification_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          allow_health_notifications: boolean
          allow_home_notifications: boolean
          allow_learning_notifications: boolean
          allow_money_notifications: boolean
          allow_motivational_notifications: boolean
          allow_quest_notifications: boolean
          allow_streak_notifications: boolean
          created_at: string
          daily_summary_enabled: boolean
          daily_summary_hour: number
          exercise_reminders_enabled: boolean
          focus_identity_key: string | null
          global_notifications_enabled: boolean
          habit_reminders_enabled: boolean
          identity_reminders_enabled: boolean
          max_daily_notifications: number
          meal_reminders_enabled: boolean
          medical_reminders_enabled: boolean
          onesignal_player_id: string | null
          onesignal_push_token: string | null
          preferred_evening_time: string
          preferred_morning_time: string
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          task_reminders_enabled: boolean
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_health_notifications?: boolean
          allow_home_notifications?: boolean
          allow_learning_notifications?: boolean
          allow_money_notifications?: boolean
          allow_motivational_notifications?: boolean
          allow_quest_notifications?: boolean
          allow_streak_notifications?: boolean
          created_at?: string
          daily_summary_enabled?: boolean
          daily_summary_hour?: number
          exercise_reminders_enabled?: boolean
          focus_identity_key?: string | null
          global_notifications_enabled?: boolean
          habit_reminders_enabled?: boolean
          identity_reminders_enabled?: boolean
          max_daily_notifications?: number
          meal_reminders_enabled?: boolean
          medical_reminders_enabled?: boolean
          onesignal_player_id?: string | null
          onesignal_push_token?: string | null
          preferred_evening_time?: string
          preferred_morning_time?: string
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          task_reminders_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_health_notifications?: boolean
          allow_home_notifications?: boolean
          allow_learning_notifications?: boolean
          allow_money_notifications?: boolean
          allow_motivational_notifications?: boolean
          allow_quest_notifications?: boolean
          allow_streak_notifications?: boolean
          created_at?: string
          daily_summary_enabled?: boolean
          daily_summary_hour?: number
          exercise_reminders_enabled?: boolean
          focus_identity_key?: string | null
          global_notifications_enabled?: boolean
          habit_reminders_enabled?: boolean
          identity_reminders_enabled?: boolean
          max_daily_notifications?: number
          meal_reminders_enabled?: boolean
          medical_reminders_enabled?: boolean
          onesignal_player_id?: string | null
          onesignal_push_token?: string | null
          preferred_evening_time?: string
          preferred_morning_time?: string
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          task_reminders_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          body: string
          created_at: string
          dedupe_key: string | null
          deep_link: string | null
          error_message: string | null
          id: string
          identity_key: string | null
          module_key: string
          notification_type: string
          onesignal_response: Json | null
          priority: number
          scheduled_for: string
          sent_at: string | null
          status: string
          title: string
          tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dedupe_key?: string | null
          deep_link?: string | null
          error_message?: string | null
          id?: string
          identity_key?: string | null
          module_key: string
          notification_type: string
          onesignal_response?: Json | null
          priority?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          title: string
          tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dedupe_key?: string | null
          deep_link?: string | null
          error_message?: string | null
          id?: string
          identity_key?: string | null
          module_key?: string
          notification_type?: string
          onesignal_response?: Json | null
          priority?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          title?: string
          tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          created_at: string
          deep_link: string | null
          id: string
          identity_key: string | null
          is_active: boolean
          module_key: string
          notification_type: string
          priority: number
          title: string
          tone: string
          trigger_condition: string | null
        }
        Insert: {
          body: string
          created_at?: string
          deep_link?: string | null
          id?: string
          identity_key?: string | null
          is_active?: boolean
          module_key: string
          notification_type: string
          priority?: number
          title: string
          tone?: string
          trigger_condition?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          deep_link?: string | null
          id?: string
          identity_key?: string | null
          is_active?: boolean
          module_key?: string
          notification_type?: string
          priority?: number
          title?: string
          tone?: string
          trigger_condition?: string | null
        }
        Relationships: []
      }
      pet_logs: {
        Row: {
          cost: number | null
          created_at: string
          date: string
          id: string
          note: string | null
          pet_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          pet_id: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          pet_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_logs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "family_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cleaning_streak: number
          created_at: string
          custom_skill_categories: Json
          display_name: string | null
          energy_streak: number
          enki_mode_enabled: boolean | null
          health_streak: number
          id: string
          imported_template_ids: string[] | null
          last_cleaning_date: string | null
          last_energy_date: string | null
          last_health_date: string | null
          last_task_date: string | null
          panda_coins: number | null
          task_streak: number
          unlocked_skills: string[] | null
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          cleaning_streak?: number
          created_at?: string
          custom_skill_categories?: Json
          display_name?: string | null
          energy_streak?: number
          enki_mode_enabled?: boolean | null
          health_streak?: number
          id?: string
          imported_template_ids?: string[] | null
          last_cleaning_date?: string | null
          last_energy_date?: string | null
          last_health_date?: string | null
          last_task_date?: string | null
          panda_coins?: number | null
          task_streak?: number
          unlocked_skills?: string[] | null
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          cleaning_streak?: number
          created_at?: string
          custom_skill_categories?: Json
          display_name?: string | null
          energy_streak?: number
          enki_mode_enabled?: boolean | null
          health_streak?: number
          id?: string
          imported_template_ids?: string[] | null
          last_cleaning_date?: string | null
          last_energy_date?: string | null
          last_health_date?: string | null
          last_task_date?: string | null
          panda_coins?: number | null
          task_streak?: number
          unlocked_skills?: string[] | null
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          position: number
          project_id: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          project_id: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          project_id?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_resources: {
        Row: {
          created_at: string
          id: string
          kind: string
          notes: string | null
          project_id: string
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          notes?: string | null
          project_id: string
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          notes?: string | null
          project_id?: string
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string
          color: string | null
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          priority: string
          progress: number
          started_at: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          category?: string
          color?: string | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          progress?: number
          started_at?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          category?: string
          color?: string | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          progress?: number
          started_at?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      psych_checkins: {
        Row: {
          anxiety: number
          created_at: string
          date: string
          dominant_emotion: string
          dominant_thought: string
          id: string
          is_private: boolean
          stress: number
          trigger: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anxiety?: number
          created_at?: string
          date?: string
          dominant_emotion?: string
          dominant_thought?: string
          id?: string
          is_private?: boolean
          stress?: number
          trigger?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anxiety?: number
          created_at?: string
          date?: string
          dominant_emotion?: string
          dominant_thought?: string
          id?: string
          is_private?: boolean
          stress?: number
          trigger?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      psych_sessions: {
        Row: {
          agreements: string
          created_at: string
          date: string
          id: string
          impact: number
          insight: string
          is_private: boolean
          main_topic: string
          next_session: string | null
          notes: string
          psychologist: string
          subtopics: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          agreements?: string
          created_at?: string
          date?: string
          id?: string
          impact?: number
          insight?: string
          is_private?: boolean
          main_topic?: string
          next_session?: string | null
          notes?: string
          psychologist?: string
          subtopics?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          agreements?: string
          created_at?: string
          date?: string
          id?: string
          impact?: number
          insight?: string
          is_private?: boolean
          main_topic?: string
          next_session?: string | null
          notes?: string
          psychologist?: string
          subtopics?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      psych_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          is_private: boolean
          session_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          is_private?: boolean
          session_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          is_private?: boolean
          session_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_notification_prefs_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "notification_preferences"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quest_progress: {
        Row: {
          claimed: boolean
          id: string
          progress: number
          quest_id: string
          updated_at: string
          user_id: string
          week_key: string
        }
        Insert: {
          claimed?: boolean
          id?: string
          progress?: number
          quest_id: string
          updated_at?: string
          user_id: string
          week_key: string
        }
        Update: {
          claimed?: boolean
          id?: string
          progress?: number
          quest_id?: string
          updated_at?: string
          user_id?: string
          week_key?: string
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          cost: number
          created_at: string
          fulfilled: boolean
          fulfilled_at: string | null
          id: string
          notes: string | null
          reward_emoji: string
          reward_id: string
          reward_name: string
          user_id: string
          xp_at_unlock: number
        }
        Insert: {
          cost: number
          created_at?: string
          fulfilled?: boolean
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          reward_emoji?: string
          reward_id: string
          reward_name: string
          user_id: string
          xp_at_unlock: number
        }
        Update: {
          cost?: number
          created_at?: string
          fulfilled?: boolean
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          reward_emoji?: string
          reward_id?: string
          reward_name?: string
          user_id?: string
          xp_at_unlock?: number
        }
        Relationships: []
      }
      rewards_shop: {
        Row: {
          active: boolean
          category: string
          cost: number
          created_at: string
          description: string
          emoji: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category?: string
          cost?: number
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          category?: string
          cost?: number
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string
          reps: string
          rest_seconds: number
          routine_id: string
          sets: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string
          reps?: string
          rest_seconds?: number
          routine_id: string
          sets?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string
          reps?: string
          rest_seconds?: number
          routine_id?: string
          sets?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          active: boolean
          color: string
          created_at: string
          created_by: string | null
          duration_minutes: number
          emoji: string
          id: string
          level: string
          name: string
          objective: string
          suggested_days_per_week: number
          updated_at: string
          xp_bonus: number
          xp_total: number
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          emoji?: string
          id?: string
          level?: string
          name: string
          objective?: string
          suggested_days_per_week?: number
          updated_at?: string
          xp_bonus?: number
          xp_total?: number
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          emoji?: string
          id?: string
          level?: string
          name?: string
          objective?: string
          suggested_days_per_week?: number
          updated_at?: string
          xp_bonus?: number
          xp_total?: number
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          bought: boolean
          category: string
          created_at: string
          id: string
          name: string
          notes: string
          qty: string
          source: string
          unit: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          bought?: boolean
          category?: string
          created_at?: string
          id?: string
          name: string
          notes?: string
          qty?: string
          source?: string
          unit?: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          bought?: boolean
          category?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string
          qty?: string
          source?: string
          unit?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      streak_freezes: {
        Row: {
          acquired_at: string
          cost_xp: number
          id: string
          used_at: string | null
          used_for_date: string | null
          user_id: string
        }
        Insert: {
          acquired_at?: string
          cost_xp?: number
          id?: string
          used_at?: string | null
          used_for_date?: string | null
          user_id: string
        }
        Update: {
          acquired_at?: string
          cost_xp?: number
          id?: string
          used_at?: string | null
          used_for_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          created_at: string
          current_streak: number
          freeze_days_available: number
          id: string
          last_completed_at: string | null
          longest_streak: number
          module_key: string
          streak_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          freeze_days_available?: number
          id?: string
          last_completed_at?: string | null
          longest_streak?: number
          module_key: string
          streak_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          freeze_days_available?: number
          id?: string
          last_completed_at?: string | null
          longest_streak?: number
          module_key?: string
          streak_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_lists: {
        Row: {
          color: string
          created_at: string
          emoji: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due: string | null
          id: string
          list_id: string | null
          priority: string
          recurrence: Json | null
          reminder: number | null
          status: string
          subtasks: Json
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          xp_reward: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due?: string | null
          id?: string
          list_id?: string | null
          priority?: string
          recurrence?: Json | null
          reminder?: number | null
          status?: string
          subtasks?: Json
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          xp_reward?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due?: string | null
          id?: string
          list_id?: string | null
          priority?: string
          recurrence?: Json | null
          reminder?: number | null
          status?: string
          subtasks?: Json
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "task_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_config: {
        Row: {
          chat_id: number | null
          created_at: string
          enabled: boolean
          exercise_time: string
          last_reminder_keys: string[]
          meal_breakfast_time: string
          meal_dinner_time: string
          meal_lunch_time: string
          notify_exercise: boolean
          notify_habits: boolean
          notify_identity: boolean
          notify_meals: boolean
          notify_medications: boolean
          notify_overdue_tasks: boolean
          notify_time: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id?: number | null
          created_at?: string
          enabled?: boolean
          exercise_time?: string
          last_reminder_keys?: string[]
          meal_breakfast_time?: string
          meal_dinner_time?: string
          meal_lunch_time?: string
          notify_exercise?: boolean
          notify_habits?: boolean
          notify_identity?: boolean
          notify_meals?: boolean
          notify_medications?: boolean
          notify_overdue_tasks?: boolean
          notify_time?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: number | null
          created_at?: string
          enabled?: boolean
          exercise_time?: string
          last_reminder_keys?: string[]
          meal_breakfast_time?: string
          meal_dinner_time?: string
          meal_lunch_time?: string
          notify_exercise?: boolean
          notify_habits?: boolean
          notify_identity?: boolean
          notify_meals?: boolean
          notify_medications?: boolean
          notify_overdue_tasks?: boolean
          notify_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          created_at: string
          processed: boolean
          raw_update: Json
          response: string | null
          text: string | null
          update_id: number
          user_id: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string
          processed?: boolean
          raw_update: Json
          response?: string | null
          text?: string | null
          update_id: number
          user_id?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string
          processed?: boolean
          raw_update?: Json
          response?: string | null
          text?: string | null
          update_id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_identities: {
        Row: {
          active: boolean
          created_at: string
          description: string
          emoji: string
          id: string
          identity_key: string
          name: string
          priority: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          identity_key: string
          name: string
          priority?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          identity_key?: string
          name?: string
          priority?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          activated_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          item_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          item_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          item_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "magic_items"
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
      wishlist: {
        Row: {
          created_at: string
          id: string
          item_type: string
          notes: string | null
          priority: string
          purchased: boolean
          reason: string
          remind_at: string | null
          source: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_type?: string
          notes?: string | null
          priority?: string
          purchased?: boolean
          reason?: string
          remind_at?: string | null
          source?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_type?: string
          notes?: string | null
          priority?: string
          purchased?: boolean
          reason?: string
          remind_at?: string | null
          source?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_exercise_logs: {
        Row: {
          completed: boolean
          created_at: string
          exercise_id: string | null
          id: string
          notes: string
          reps_done: string
          sets_done: number
          user_id: string
          workout_log_id: string
          xp_awarded: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          exercise_id?: string | null
          id?: string
          notes?: string
          reps_done?: string
          sets_done?: number
          user_id: string
          workout_log_id: string
          xp_awarded?: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          exercise_id?: string | null
          id?: string
          notes?: string
          reps_done?: string
          sets_done?: number
          user_id?: string
          workout_log_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          difficulty: number | null
          energy_after: number | null
          energy_before: number | null
          id: string
          notes: string
          routine_id: string | null
          updated_at: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date?: string
          difficulty?: number | null
          energy_after?: number | null
          energy_before?: number | null
          id?: string
          notes?: string
          routine_id?: string | null
          updated_at?: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          difficulty?: number | null
          energy_after?: number | null
          energy_before?: number | null
          id?: string
          notes?: string
          routine_id?: string | null
          updated_at?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_schedule: {
        Row: {
          created_at: string
          day_of_week: number | null
          id: string
          is_rest: boolean
          notes: string
          routine_id: string | null
          scheduled_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          is_rest?: boolean
          notes?: string
          routine_id?: string | null
          scheduled_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          is_rest?: boolean
          notes?: string
          routine_id?: string | null
          scheduled_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_schedule_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _telegram_cron_call: {
        Args: { body?: Json; endpoint: string }
        Returns: number
      }
      _telegram_send_overdue_tasks: { Args: never; Returns: number }
      bump_streak: {
        Args: { _module_key: string; _user_id: string }
        Returns: {
          current_streak: number
          just_continued: boolean
          longest_streak: number
          streak_status: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_email_allowed: { Args: { _email: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      vault_insert_cron_secret: {
        Args: { new_value: string }
        Returns: undefined
      }
      vault_update_cron_secret: {
        Args: { new_value: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "owner" | "invited"
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
      app_role: ["owner", "invited"],
    },
  },
} as const
