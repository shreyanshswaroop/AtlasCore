import type {
  CompanyNewsResponse,
  CompanyLeaderboardResponse,
} from "@/types/company";
import type {
  NewsCountsResponse,
  NewsDetailResponse,
  NewsResponse,
  NewsSyncStatus,
  TrendingTopicsResponse,
} from "@/types/news";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function getNews(
  query?: string,
  limit = 12,
  offset = 0,
  topic?: string,
  sort: "latest" | "upvotes" = "latest"
): Promise<NewsResponse> {
  const url = new URL("/api/news", API_BASE_URL);

  const cleanedQuery = query?.trim();

  if (topic) {
    url.searchParams.set("topic", topic);
  } else if (cleanedQuery) {
    url.searchParams.set("query", cleanedQuery);
  }

  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sort", sort);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorMessage = await response.text();

    throw new Error(
      errorMessage || `Failed to fetch news: ${response.status}`
    );
  }

  return response.json() as Promise<NewsResponse>;
}

export async function getNewsCounts(
  topics: string[],
  sort: "latest" | "upvotes" = "latest"
): Promise<NewsCountsResponse> {
  const url = new URL("/api/news/counts", API_BASE_URL);

  url.searchParams.set("sort", sort);

  topics.forEach((topic) => {
    const cleanedTopic = topic.trim();

    if (cleanedTopic) {
      url.searchParams.append("topics", cleanedTopic);
    }
  });

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorMessage = await response.text();

    throw new Error(
      errorMessage || `Failed to fetch news counts: ${response.status}`
    );
  }

  return response.json() as Promise<NewsCountsResponse>;
}

export async function getTrendingTopics(
  limit = 8
): Promise<TrendingTopicsResponse> {
  const url = new URL("/api/news/trending-topics", API_BASE_URL);

  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorMessage = await response.text();

    throw new Error(
      errorMessage || `Failed to fetch trending topics: ${response.status}`
    );
  }

  return response.json() as Promise<TrendingTopicsResponse>;
}

export async function getNewsById(
  newsId: string
): Promise<NewsDetailResponse> {
  const encodedNewsId = encodeURIComponent(newsId);

  const response = await fetch(
    `${API_BASE_URL}/api/news/${encodedNewsId}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch news item: ${response.status}`
    );
  }

  return response.json() as Promise<NewsDetailResponse>;
}

export async function getSyncStatus(): Promise<NewsSyncStatus> {
  const response = await fetch(`${API_BASE_URL}/api/sync`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sync status: ${response.status}`
    );
  }

  return response.json() as Promise<NewsSyncStatus>;
}

export async function getCompanyLeaderboard(
  limit = 150,
  globalRank = true
): Promise<CompanyLeaderboardResponse> {
  const url = new URL("/api/companies/leaderboard", API_BASE_URL);

  url.searchParams.set("limit", String(limit));
  url.searchParams.set("global_rank", String(globalRank));

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorMessage = await response.text();

    throw new Error(
      errorMessage || `Failed to fetch company leaderboard: ${response.status}`
    );
  }

  return response.json() as Promise<CompanyLeaderboardResponse>;
}

export async function getCompanyNews(
  companySlug: string,
  limit = 24,
  offset = 0
): Promise<CompanyNewsResponse> {
  const encodedCompanySlug = encodeURIComponent(companySlug);
  const url = new URL(
    `/api/companies/${encodedCompanySlug}/news`,
    API_BASE_URL
  );

  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch company news: ${response.status}`
    );
  }

  return response.json() as Promise<CompanyNewsResponse>;
}
