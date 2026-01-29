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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          booking_scheduled_at: string | null
          calendly_link: string | null
          created_at: string
          current_page: string | null
          id: string
          last_activity_at: string
          session_id: string
          status: string
          transferred_to_conversation_id: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          booking_scheduled_at?: string | null
          calendly_link?: string | null
          created_at?: string
          current_page?: string | null
          id?: string
          last_activity_at?: string
          session_id: string
          status?: string
          transferred_to_conversation_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          booking_scheduled_at?: string | null
          calendly_link?: string | null
          created_at?: string
          current_page?: string | null
          id?: string
          last_activity_at?: string
          session_id?: string
          status?: string
          transferred_to_conversation_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_transferred_to_conversation_id_fkey"
            columns: ["transferred_to_conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_handoff_requests: {
        Row: {
          ai_session_id: string
          conversation_id: string | null
          created_at: string
          id: string
          operator_id: string | null
          reason: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          ai_session_id: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          operator_id?: string | null
          reason?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          ai_session_id?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          operator_id?: string | null
          reason?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_handoff_requests_ai_session_id_fkey"
            columns: ["ai_session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_handoff_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          keywords: string[] | null
          priority: number
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          priority?: number
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          priority?: number
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_history: {
        Row: {
          ahrefs_rank: number | null
          audit_id: string | null
          backlinks: number | null
          domain: string
          domain_rating: number | null
          id: string
          organic_keywords: number | null
          organic_traffic: number | null
          referring_domains: number | null
          snapshot_at: string
          source: string | null
          traffic_value: number | null
        }
        Insert: {
          ahrefs_rank?: number | null
          audit_id?: string | null
          backlinks?: number | null
          domain: string
          domain_rating?: number | null
          id?: string
          organic_keywords?: number | null
          organic_traffic?: number | null
          referring_domains?: number | null
          snapshot_at?: string
          source?: string | null
          traffic_value?: number | null
        }
        Update: {
          ahrefs_rank?: number | null
          audit_id?: string | null
          backlinks?: number | null
          domain?: string
          domain_rating?: number | null
          id?: string
          organic_keywords?: number | null
          organic_traffic?: number | null
          referring_domains?: number | null
          snapshot_at?: string
          source?: string | null
          traffic_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_history_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "public_saved_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_history_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "saved_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      cade_crawl_events: {
        Row: {
          created_at: string
          current_url: string | null
          domain: string
          error_message: string | null
          id: string
          message: string | null
          pages_crawled: number | null
          progress: number | null
          raw_payload: Json | null
          request_id: string | null
          status: string
          total_pages: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_url?: string | null
          domain: string
          error_message?: string | null
          id?: string
          message?: string | null
          pages_crawled?: number | null
          progress?: number | null
          raw_payload?: Json | null
          request_id?: string | null
          status?: string
          total_pages?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_url?: string | null
          domain?: string
          error_message?: string | null
          id?: string
          message?: string | null
          pages_crawled?: number | null
          progress?: number | null
          raw_payload?: Json | null
          request_id?: string | null
          status?: string
          total_pages?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      changelog_entries: {
        Row: {
          aggregation_end: string | null
          aggregation_start: string | null
          changes: Json
          commit_hashes: Json | null
          created_at: string
          description: string
          highlight: boolean
          icon: string
          id: string
          is_published: boolean
          published_at: string | null
          title: string
          type: string
          version: string
        }
        Insert: {
          aggregation_end?: string | null
          aggregation_start?: string | null
          changes?: Json
          commit_hashes?: Json | null
          created_at?: string
          description: string
          highlight?: boolean
          icon?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          title: string
          type?: string
          version: string
        }
        Update: {
          aggregation_end?: string | null
          aggregation_start?: string | null
          changes?: Json
          commit_hashes?: Json | null
          created_at?: string
          description?: string
          highlight?: boolean
          icon?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          title?: string
          type?: string
          version?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          current_page: string | null
          id: string
          last_message_at: string
          operator_id: string | null
          session_id: string
          started_at: string
          status: string
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          created_at?: string
          current_page?: string | null
          id?: string
          last_message_at?: string
          operator_id?: string | null
          session_id: string
          started_at?: string
          status?: string
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          created_at?: string
          current_page?: string | null
          id?: string
          last_message_at?: string
          operator_id?: string | null
          session_id?: string
          started_at?: string
          status?: string
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string | null
          sender_type?: string
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
      directory_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      directory_listings: {
        Row: {
          address: string | null
          business_name: string
          category_id: string | null
          city: string | null
          contact_name: string
          created_at: string
          description: string
          display_order: number
          email: string
          google_maps_embed_url: string | null
          id: string
          is_featured: boolean
          logo_url: string | null
          phone: string | null
          slug: string
          state: string | null
          status: string
          subscription_end: string | null
          subscription_start: string | null
          updated_at: string
          website_url: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          category_id?: string | null
          city?: string | null
          contact_name: string
          created_at?: string
          description: string
          display_order?: number
          email: string
          google_maps_embed_url?: string | null
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          phone?: string | null
          slug: string
          state?: string | null
          status?: string
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string
          website_url?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          category_id?: string | null
          city?: string | null
          contact_name?: string
          created_at?: string
          description?: string
          display_order?: number
          email?: string
          google_maps_embed_url?: string | null
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          phone?: string | null
          slug?: string
          state?: string | null
          status?: string
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string
          website_url?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "directory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_contexts: {
        Row: {
          authors: string[] | null
          awards_associations: string[] | null
          brands_equipment: string[] | null
          business_address: string | null
          business_hours: string[] | null
          business_model: string | null
          business_name: string | null
          claims_to_avoid: string[] | null
          common_faqs: string[] | null
          competitors: string | null
          created_at: string
          domain: string
          email: string | null
          extraction_confidence: Json | null
          guarantees_warranties: string | null
          id: string
          key_phrases: string[] | null
          licenses_certifications: string[] | null
          local_landmarks: string[] | null
          phone_number: string | null
          phrases_to_avoid: string[] | null
          point_of_view: string | null
          pricing_approach: string | null
          primary_city: string | null
          primary_keyword: string | null
          required_disclaimers: string[] | null
          resource_sites: string[] | null
          service_areas: string[] | null
          service_radius: string | null
          services_not_offered: string[] | null
          services_offered: string[] | null
          short_description: string | null
          social_links: string[] | null
          style_references: string[] | null
          target_keywords: string[] | null
          topics_to_avoid: string[] | null
          topics_to_cover: string[] | null
          trademark_guidelines: string[] | null
          unique_selling_points: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
          writing_tone: string | null
          year_established: number | null
        }
        Insert: {
          authors?: string[] | null
          awards_associations?: string[] | null
          brands_equipment?: string[] | null
          business_address?: string | null
          business_hours?: string[] | null
          business_model?: string | null
          business_name?: string | null
          claims_to_avoid?: string[] | null
          common_faqs?: string[] | null
          competitors?: string | null
          created_at?: string
          domain: string
          email?: string | null
          extraction_confidence?: Json | null
          guarantees_warranties?: string | null
          id?: string
          key_phrases?: string[] | null
          licenses_certifications?: string[] | null
          local_landmarks?: string[] | null
          phone_number?: string | null
          phrases_to_avoid?: string[] | null
          point_of_view?: string | null
          pricing_approach?: string | null
          primary_city?: string | null
          primary_keyword?: string | null
          required_disclaimers?: string[] | null
          resource_sites?: string[] | null
          service_areas?: string[] | null
          service_radius?: string | null
          services_not_offered?: string[] | null
          services_offered?: string[] | null
          short_description?: string | null
          social_links?: string[] | null
          style_references?: string[] | null
          target_keywords?: string[] | null
          topics_to_avoid?: string[] | null
          topics_to_cover?: string[] | null
          trademark_guidelines?: string[] | null
          unique_selling_points?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          writing_tone?: string | null
          year_established?: number | null
        }
        Update: {
          authors?: string[] | null
          awards_associations?: string[] | null
          brands_equipment?: string[] | null
          business_address?: string | null
          business_hours?: string[] | null
          business_model?: string | null
          business_name?: string | null
          claims_to_avoid?: string[] | null
          common_faqs?: string[] | null
          competitors?: string | null
          created_at?: string
          domain?: string
          email?: string | null
          extraction_confidence?: Json | null
          guarantees_warranties?: string | null
          id?: string
          key_phrases?: string[] | null
          licenses_certifications?: string[] | null
          local_landmarks?: string[] | null
          phone_number?: string | null
          phrases_to_avoid?: string[] | null
          point_of_view?: string | null
          pricing_approach?: string | null
          primary_city?: string | null
          primary_keyword?: string | null
          required_disclaimers?: string[] | null
          resource_sites?: string[] | null
          service_areas?: string[] | null
          service_radius?: string | null
          services_not_offered?: string[] | null
          services_offered?: string[] | null
          short_description?: string | null
          social_links?: string[] | null
          style_references?: string[] | null
          target_keywords?: string[] | null
          topics_to_avoid?: string[] | null
          topics_to_cover?: string[] | null
          trademark_guidelines?: string[] | null
          unique_selling_points?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          writing_tone?: string | null
          year_established?: number | null
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          created_at: string
          form_data: Json | null
          form_name: string
          id: string
          page_path: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          form_data?: Json | null
          form_name: string
          id?: string
          page_path?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          form_data?: Json | null
          form_name?: string
          id?: string
          page_path?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_visitors"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "form_submissions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      form_tests: {
        Row: {
          error_message: string | null
          form_endpoint: string | null
          form_name: string
          id: string
          response_time_ms: number | null
          status: string
          test_data: Json
          tested_at: string
          tested_by: string | null
        }
        Insert: {
          error_message?: string | null
          form_endpoint?: string | null
          form_name: string
          id?: string
          response_time_ms?: number | null
          status?: string
          test_data?: Json
          tested_at?: string
          tested_by?: string | null
        }
        Update: {
          error_message?: string | null
          form_endpoint?: string | null
          form_name?: string
          id?: string
          response_time_ms?: number | null
          status?: string
          test_data?: Json
          tested_at?: string
          tested_by?: string | null
        }
        Relationships: []
      }
      indexation_reports: {
        Row: {
          blocked_count: number
          crawled_count: number
          created_at: string
          domain: string
          id: string
          indexed_count: number
          not_indexed_count: number
          report_data: Json
          source: string | null
          total_pages: number
        }
        Insert: {
          blocked_count?: number
          crawled_count?: number
          created_at?: string
          domain: string
          id?: string
          indexed_count?: number
          not_indexed_count?: number
          report_data: Json
          source?: string | null
          total_pages?: number
        }
        Update: {
          blocked_count?: number
          crawled_count?: number
          created_at?: string
          domain?: string
          id?: string
          indexed_count?: number
          not_indexed_count?: number
          report_data?: Json
          source?: string | null
          total_pages?: number
        }
        Relationships: []
      }
      keyword_ranking_history: {
        Row: {
          bing_position: number | null
          competition_level: string | null
          cpc: number | null
          domain: string
          google_position: number | null
          id: string
          keyword: string
          search_volume: number | null
          snapshot_at: string
          source: string | null
          yahoo_position: number | null
        }
        Insert: {
          bing_position?: number | null
          competition_level?: string | null
          cpc?: number | null
          domain: string
          google_position?: number | null
          id?: string
          keyword: string
          search_volume?: number | null
          snapshot_at?: string
          source?: string | null
          yahoo_position?: number | null
        }
        Update: {
          bing_position?: number | null
          competition_level?: string | null
          cpc?: number | null
          domain?: string
          google_position?: number | null
          id?: string
          keyword?: string
          search_volume?: number | null
          snapshot_at?: string
          source?: string | null
          yahoo_position?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          annual_revenue: string | null
          closed_amount: number | null
          closed_at: string | null
          company_employees: string | null
          created_at: string
          domain: string | null
          email: string
          full_name: string | null
          funnel_stage: string | null
          id: string
          metric_type: string
          phone: string | null
          qualification_step: number | null
          source_page: string | null
          status: string
        }
        Insert: {
          annual_revenue?: string | null
          closed_amount?: number | null
          closed_at?: string | null
          company_employees?: string | null
          created_at?: string
          domain?: string | null
          email: string
          full_name?: string | null
          funnel_stage?: string | null
          id?: string
          metric_type: string
          phone?: string | null
          qualification_step?: number | null
          source_page?: string | null
          status?: string
        }
        Update: {
          annual_revenue?: string | null
          closed_amount?: number | null
          closed_at?: string | null
          company_employees?: string | null
          created_at?: string
          domain?: string | null
          email?: string
          full_name?: string | null
          funnel_stage?: string | null
          id?: string
          metric_type?: string
          phone?: string | null
          qualification_step?: number | null
          source_page?: string | null
          status?: string
        }
        Relationships: []
      }
      marketplace_applications: {
        Row: {
          admin_notes: string | null
          category_id: string | null
          company_name: string
          contact_email: string
          contact_name: string
          created_at: string
          description: string
          id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["partner_status"]
          website_url: string | null
          why_join: string | null
        }
        Insert: {
          admin_notes?: string | null
          category_id?: string | null
          company_name: string
          contact_email: string
          contact_name: string
          created_at?: string
          description: string
          id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          website_url?: string | null
          why_join?: string | null
        }
        Update: {
          admin_notes?: string | null
          category_id?: string | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          created_at?: string
          description?: string
          id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          website_url?: string | null
          why_join?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_applications_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      marketplace_partners: {
        Row: {
          category_id: string | null
          company_name: string
          contact_email: string
          created_at: string
          description: string
          display_order: number
          id: string
          is_sponsored: boolean
          logo_url: string | null
          ranking_score: number
          rating: number
          review_count: number
          slug: string
          sponsored_until: string | null
          status: Database["public"]["Enums"]["partner_status"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          category_id?: string | null
          company_name: string
          contact_email: string
          created_at?: string
          description: string
          display_order?: number
          id?: string
          is_sponsored?: boolean
          logo_url?: string | null
          ranking_score?: number
          rating?: number
          review_count?: number
          slug: string
          sponsored_until?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          category_id?: string | null
          company_name?: string
          contact_email?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_sponsored?: boolean
          logo_url?: string | null
          ranking_score?: number
          rating?: number
          review_count?: number
          slug?: string
          sponsored_until?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_partners_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          provider: string
          refresh_token: string | null
          scope: string | null
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page_path: string
          page_title: string | null
          scroll_depth: number | null
          session_id: string
          time_on_page: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          page_title?: string | null
          scroll_depth?: number | null
          session_id: string
          time_on_page?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          page_title?: string | null
          scroll_depth?: number | null
          session_id?: string
          time_on_page?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_visitors"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "page_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_audits: {
        Row: {
          ahrefs_rank: number | null
          backlinks: number | null
          category: Database["public"]["Enums"]["audit_category"]
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          domain: string
          domain_rating: number | null
          favicon_url: string | null
          glossary_terms: string[] | null
          id: string
          logo_url: string | null
          organic_keywords: number | null
          organic_traffic: number | null
          referring_domains: number | null
          site_description: string | null
          site_summary: string | null
          site_title: string | null
          slug: string
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_tiktok: string | null
          social_twitter: string | null
          social_youtube: string | null
          submitter_email: string | null
          traffic_value: number | null
          updated_at: string
        }
        Insert: {
          ahrefs_rank?: number | null
          backlinks?: number | null
          category?: Database["public"]["Enums"]["audit_category"]
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          domain: string
          domain_rating?: number | null
          favicon_url?: string | null
          glossary_terms?: string[] | null
          id?: string
          logo_url?: string | null
          organic_keywords?: number | null
          organic_traffic?: number | null
          referring_domains?: number | null
          site_description?: string | null
          site_summary?: string | null
          site_title?: string | null
          slug: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          submitter_email?: string | null
          traffic_value?: number | null
          updated_at?: string
        }
        Update: {
          ahrefs_rank?: number | null
          backlinks?: number | null
          category?: Database["public"]["Enums"]["audit_category"]
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          domain?: string
          domain_rating?: number | null
          favicon_url?: string | null
          glossary_terms?: string[] | null
          id?: string
          logo_url?: string | null
          organic_keywords?: number | null
          organic_traffic?: number | null
          referring_domains?: number | null
          site_description?: string | null
          site_summary?: string | null
          site_title?: string | null
          slug?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          submitter_email?: string | null
          traffic_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tool_interactions: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          page_path: string | null
          session_id: string
          tool_name: string
          tool_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id: string
          tool_name: string
          tool_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string
          tool_name?: string
          tool_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_interactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_visitors"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "tool_interactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          api_key_encrypted: string
          created_at: string
          id: string
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string
          id?: string
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string
          id?: string
          service_name?: string
          updated_at?: string
          user_id?: string
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
      visitor_sessions: {
        Row: {
          first_page: string | null
          id: string
          ip_hash: string | null
          last_activity_at: string
          referrer: string | null
          session_id: string
          started_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          first_page?: string | null
          id?: string
          ip_hash?: string | null
          last_activity_at?: string
          referrer?: string | null
          session_id: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          first_page?: string | null
          id?: string
          ip_hash?: string | null
          last_activity_at?: string
          referrer?: string | null
          session_id?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_stats: {
        Row: {
          stat_date: string | null
          total_page_views: number | null
          unique_pages: number | null
          unique_sessions: number | null
        }
        Relationships: []
      }
      funnel_stats: {
        Row: {
          closed_leads: number | null
          engaged_visitors: number | null
          qualified_leads: number | null
          total_leads: number | null
          total_visitors: number | null
        }
        Relationships: []
      }
      live_visitors: {
        Row: {
          current_page: string | null
          first_page: string | null
          last_activity_at: string | null
          referrer: string | null
          session_id: string | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          current_page?: never
          first_page?: string | null
          last_activity_at?: string | null
          referrer?: string | null
          session_id?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          current_page?: never
          first_page?: string | null
          last_activity_at?: string | null
          referrer?: string | null
          session_id?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      public_saved_audits: {
        Row: {
          ahrefs_rank: number | null
          backlinks: number | null
          category: Database["public"]["Enums"]["audit_category"] | null
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          domain: string | null
          domain_rating: number | null
          favicon_url: string | null
          glossary_terms: string[] | null
          id: string | null
          logo_url: string | null
          organic_keywords: number | null
          organic_traffic: number | null
          referring_domains: number | null
          site_description: string | null
          site_summary: string | null
          site_title: string | null
          slug: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_tiktok: string | null
          social_twitter: string | null
          social_youtube: string | null
          submitter_email: string | null
          traffic_value: number | null
          updated_at: string | null
        }
        Insert: {
          ahrefs_rank?: number | null
          backlinks?: number | null
          category?: Database["public"]["Enums"]["audit_category"] | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          domain?: string | null
          domain_rating?: number | null
          favicon_url?: string | null
          glossary_terms?: string[] | null
          id?: string | null
          logo_url?: string | null
          organic_keywords?: number | null
          organic_traffic?: number | null
          referring_domains?: number | null
          site_description?: string | null
          site_summary?: string | null
          site_title?: string | null
          slug?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          submitter_email?: never
          traffic_value?: number | null
          updated_at?: string | null
        }
        Update: {
          ahrefs_rank?: number | null
          backlinks?: number | null
          category?: Database["public"]["Enums"]["audit_category"] | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          domain?: string | null
          domain_rating?: number | null
          favicon_url?: string | null
          glossary_terms?: string[] | null
          id?: string | null
          logo_url?: string | null
          organic_keywords?: number | null
          organic_traffic?: number | null
          referring_domains?: number | null
          site_description?: string | null
          site_summary?: string | null
          site_title?: string | null
          slug?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          submitter_email?: never
          traffic_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_analytics: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      audit_category:
        | "ecommerce"
        | "saas"
        | "local_business"
        | "blog_media"
        | "professional_services"
        | "healthcare"
        | "finance"
        | "education"
        | "real_estate"
        | "hospitality"
        | "nonprofit"
        | "technology"
        | "other"
      partner_status: "pending" | "approved" | "rejected" | "suspended"
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
      app_role: ["admin", "moderator", "user"],
      audit_category: [
        "ecommerce",
        "saas",
        "local_business",
        "blog_media",
        "professional_services",
        "healthcare",
        "finance",
        "education",
        "real_estate",
        "hospitality",
        "nonprofit",
        "technology",
        "other",
      ],
      partner_status: ["pending", "approved", "rejected", "suspended"],
    },
  },
} as const
