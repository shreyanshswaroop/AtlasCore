export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  categories: string[];
  published_at: string;
  updated_at: string;
  source_name?: string;
  source_url?: string;
  image_url?: string | null;
  item_type?: "news";
  primary_topic?: string | null;
  topic_confidence?: number | null;
  topic_reason?: string | null;
  upvote_count?: number;
  is_bookmarked?: boolean;
};

export type NewsResponse = {
  query: string;
  count: number;
  items: NewsItem[];
};

export type NewsDetailResponse = {
  item: NewsItem;
};

export type NewsCountsResponse = {
  all: number;
  queries: {
    query: string;
    count: number;
  }[];
};

export type TrendingTopic = {
  topic: string;
  count: number;
  latest_published_at: string | null;
  trend_score: number;
};

export type TrendingTopicsResponse = {
  window_days: number;
  count: number;
  topics: TrendingTopic[];
};

export type NewsSyncResult = {
  started_at: string;
  finished_at: string | null;
  status: "running" | "completed" | "failed" | string;
  fetched: number;
  processed: number;
  failed: number;
  total_items: number;
  error: string | null;
};

export type NewsSyncStatus = {
  status: "idle" | "running" | "completed" | "failed" | string;
  last_sync: NewsSyncResult | null;
  is_running: boolean;
};
