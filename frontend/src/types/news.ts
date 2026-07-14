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
