export type CompanyLeaderboardItem = {
  rank: number;
  slug: string;
  company: string;
  aliases: string[];
  domain?: string | null;
  logo_url?: string | null;
  global_mentions?: number;
  importance_score?: number;
  rank_basis?: string;
};

export type CompanyLeaderboardResponse = {
  source: string;
  count: number;
  items: CompanyLeaderboardItem[];
};

export type CompanyNewsResponse = {
  company: Omit<CompanyLeaderboardItem, "rank">;
  query: string;
  count: number;
  items: import("@/types/news").NewsItem[];
};
