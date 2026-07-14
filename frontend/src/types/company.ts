export type CompanyLeaderboardItem = {
  rank: number;
  slug: string;
  company: string;
  aliases: string[];
  domain?: string | null;
  logo_url?: string | null;
};

export type CompanyLeaderboardResponse = {
  source: "company_catalog";
  count: number;
  items: CompanyLeaderboardItem[];
};

export type CompanyNewsResponse = {
  company: Omit<CompanyLeaderboardItem, "rank">;
  query: string;
  count: number;
  items: import("@/types/news").NewsItem[];
};
