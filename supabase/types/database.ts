export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          locale: string;
          currency: string;
          name: string | null;
          photo_url: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
  };
};
