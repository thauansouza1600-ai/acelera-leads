export interface InstagramProfile {
  name: string;
  username: string;
  bio: string;
  followers?: string | null;
  profile_pic: string | null;
  instagram_url: string;
  whatsapp: string | null;
}

export interface SearchState {
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
}

export interface SearchFilters {
  minFollowers: string;
  maxFollowers: string;
  bioKeyword?: string;
}