// Placeholder — regenerate with: supabase gen types typescript --local > lib/types/database.ts
// This provides the minimal shape needed for the Supabase client generic parameter.

export interface Database {
  public: {
    Tables: {
      states: {
        Row: {
          id: string;
          name: string;
          slug: string;
          abbreviation: string;
          latitude: number;
          longitude: number;
          description: string | null;
          meta_title: string | null;
          meta_description: string | null;
          facility_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["states"]["Row"], "id" | "created_at" | "updated_at" | "facility_count">;
        Update: Partial<Database["public"]["Tables"]["states"]["Insert"]>;
        Relationships: [];
      };
      cities: {
        Row: {
          id: string;
          state_id: string;
          name: string;
          slug: string;
          state_slug: string;
          state_name: string;
          state_abbr: string;
          latitude: number;
          longitude: number;
          population: number | null;
          description: string | null;
          meta_title: string | null;
          meta_description: string | null;
          facility_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["cities"]["Row"], "id" | "created_at" | "updated_at" | "facility_count">;
        Update: Partial<Database["public"]["Tables"]["cities"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey";
            columns: ["state_id"];
            isOneToOne: false;
            referencedRelation: "states";
            referencedColumns: ["id"];
          },
        ];
      };
      facilities: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          address: string;
          city: string;
          city_slug: string;
          state: string;
          state_slug: string;
          state_abbr: string;
          zip_code: string;
          latitude: number;
          longitude: number;
          location: unknown;
          phone: string | null;
          email: string | null;
          website: string | null;
          total_courts: number;
          indoor_court_count: number;
          outdoor_court_count: number;
          surface_type: string | null;
          indoor_courts: boolean;
          outdoor_courts: boolean;
          panoramic_glass: boolean;
          led_lighting: boolean;
          pro_shop: boolean;
          equipment_rental: boolean;
          coaching: boolean;
          tournaments: boolean;
          leagues: boolean;
          open_play: boolean;
          locker_rooms: boolean;
          parking: boolean;
          food_beverage: boolean;
          wheelchair_accessible: boolean;
          kids_programs: boolean;
          price_per_hour_cents: number | null;
          price_peak_cents: number | null;
          membership_available: boolean;
          hours: Record<string, unknown> | null;
          images: string[];
          avg_rating: number;
          review_count: number;
          google_place_id: string | null;
          google_rating: number | null;
          google_review_count: number;
          verified_at: string | null;
          verification_status: string;
          website_live: boolean | null;
          data_source: string;
          google_cid: string | null;
          rating_distribution: Record<string, number> | null;
          review_summary: string | null;
          review_pros: string[] | null;
          review_cons: string[] | null;
          best_for_tags: string[] | null;
          standout_quote: string | null;
          owner_response_rate: number | null;
          meta_title: string | null;
          meta_description: string | null;
          status: string;
          is_featured: boolean;
          search_vector: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["facilities"]["Row"], "id" | "created_at" | "updated_at" | "avg_rating" | "review_count" | "google_review_count" | "location" | "search_vector" | "verification_status" | "data_source">;
        Update: Partial<Database["public"]["Tables"]["facilities"]["Insert"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          facility_id: string;
          rating: number;
          author_name: string;
          comment: string | null;
          skill_level: string | null;
          status: string;
          source: string;
          source_review_id: string | null;
          text: string | null;
          published_at: string | null;
          owner_response: string | null;
          owner_response_date: string | null;
          language: string;
          helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at" | "updated_at" | "status" | "source" | "language" | "helpful_count">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reviews_facility_id_fkey";
            columns: ["facility_id"];
            isOneToOne: false;
            referencedRelation: "facilities";
            referencedColumns: ["id"];
          },
        ];
      };
      submissions: {
        Row: {
          id: string;
          facility_name: string;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          phone: string | null;
          email: string | null;
          website: string | null;
          total_courts: number | null;
          description: string | null;
          submitter_name: string;
          submitter_email: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["submissions"]["Row"], "id" | "created_at" | "updated_at" | "status">;
        Update: Partial<Database["public"]["Tables"]["submissions"]["Insert"]>;
        Relationships: [];
      };
      subscribers: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscribers"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["subscribers"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      nearby_facilities: {
        Args: { lat: number; lng: number; radius_miles: number };
        Returns: Database["public"]["Tables"]["facilities"]["Row"][];
      };
      search_facilities: {
        Args: { search_query: string };
        Returns: Database["public"]["Tables"]["facilities"]["Row"][];
      };
      recalculate_facility_counts: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}
