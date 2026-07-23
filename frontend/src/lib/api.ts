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

const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const SERVER_API_BASE_URL =
  process.env.API_INTERNAL_BASE_URL ?? PUBLIC_API_BASE_URL;

function getApiBaseUrl() {
  return typeof window === "undefined"
    ? SERVER_API_BASE_URL
    : PUBLIC_API_BASE_URL;
}

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  onboarding_completed: boolean;
  job_title: string | null;
  preferred_topics: string[];
  preferred_content_types: string[];
};

export type AuthResponse = {
  user: AuthUser;
  access_token?: string | null;
};

export type BookmarkList = {
  id: number;
  name: string;
  item_count: number | null;
  created_at: string;
  updated_at: string;
};

export type BookmarkListsResponse = {
  count: number;
  items: BookmarkList[];
};

export type BookmarkListResponse = {
  item: BookmarkList;
};

const authTokenStorageKey = "atlascore_auth_token";
const serverNewsRevalidateSeconds = 60;

type NextFetchOptions = RequestInit & {
  next?: {
    revalidate: number;
  };
};

function getNewsFetchOptions(): NextFetchOptions {
  if (typeof window === "undefined") {
    return {
      next: {
        revalidate: serverNewsRevalidateSeconds,
      },
    };
  }

  return {
    cache: "no-store",
  };
}

function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(authTokenStorageKey);
}

function storeAuthToken(token?: string | null) {
  if (typeof window === "undefined" || !token) {
    return;
  }

  window.localStorage.setItem(authTokenStorageKey, token);
}

function clearStoredAuthToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(authTokenStorageKey);
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredAuthToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function getErrorMessage(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const payload = await response.json().catch(() => null);

    if (
      payload &&
      typeof payload === "object" &&
      "detail" in payload &&
      typeof payload.detail === "string"
    ) {
      return payload.detail;
    }
  }

  return (await response.text()) || fallback;
}

export async function signup(
  fullName: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to create account: ${response.status}`)
    );
  }

  const payload = (await response.json()) as AuthResponse;
  storeAuthToken(payload.access_token);

  return payload;
}

export async function signin(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to sign in: ${response.status}`)
    );
  }

  const payload = (await response.json()) as AuthResponse;
  storeAuthToken(payload.access_token);

  return payload;
}

export async function logout(): Promise<void> {
  clearStoredAuthToken();

  const response = await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to sign out: ${response.status}`)
    );
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to fetch account: ${response.status}`)
    );
  }

  const payload = (await response.json()) as AuthResponse;

  return payload.user;
}

export async function completeOnboarding(
  jobTitle: string,
  preferredTopics: string[],
  preferredContentTypes: string[]
): Promise<AuthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({
      job_title: jobTitle,
      preferred_topics: preferredTopics,
      preferred_content_types: preferredContentTypes,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to save preferences: ${response.status}`)
    );
  }

  return response.json() as Promise<AuthResponse>;
}

export async function updateProfile(
  fullName: string,
  jobTitle: string,
  preferredTopics: string[],
  preferredContentTypes: string[]
): Promise<AuthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({
      full_name: fullName,
      job_title: jobTitle,
      preferred_topics: preferredTopics,
      preferred_content_types: preferredContentTypes,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to save profile: ${response.status}`)
    );
  }

  return response.json() as Promise<AuthResponse>;
}

export async function getNews(
  query?: string,
  limit = 12,
  offset = 0,
  topic?: string,
  sort: "latest" | "upvotes" = "latest"
): Promise<NewsResponse> {
  const url = new URL("/api/news", getApiBaseUrl());

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
    ...getNewsFetchOptions(),
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorMessage = await response.text();

    throw new Error(
      errorMessage || `Failed to fetch news: ${response.status}`
    );
  }

  return response.json() as Promise<NewsResponse>;
}

export async function getBookmarkedNews(
  limit = 24,
  offset = 0,
  listId?: number
): Promise<NewsResponse> {
  const url = new URL("/api/news/bookmarks", getApiBaseUrl());

  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  if (listId) {
    url.searchParams.set("list_id", String(listId));
  }

  const response = await fetch(url.toString(), {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return {
      query: "bookmarks",
      count: 0,
      items: [],
    };
  }

  if (!response.ok) {
    const errorMessage = await response.text();

    throw new Error(
      errorMessage || `Failed to fetch bookmarks: ${response.status}`
    );
  }

  return response.json() as Promise<NewsResponse>;
}

export async function getBookmarkLists(): Promise<BookmarkListsResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/news/bookmark-lists`, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return {
      count: 0,
      items: [],
    };
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to fetch bookmark lists: ${response.status}`)
    );
  }

  return response.json() as Promise<BookmarkListsResponse>;
}

export async function createBookmarkList(
  name: string
): Promise<BookmarkListResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/news/bookmark-lists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({
      name,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to create bookmark list: ${response.status}`)
    );
  }

  return response.json() as Promise<BookmarkListResponse>;
}

export async function saveNewsBookmark(
  newsId: string,
  options?: {
    listId?: number;
    listName?: string;
  }
): Promise<void> {
  const body =
    options?.listId || options?.listName
      ? JSON.stringify({
          list_id: options.listId,
          list_name: options.listName,
        })
      : undefined;
  const response = await fetch(
    `${getApiBaseUrl()}/api/news/bookmarks/${encodeURIComponent(newsId)}`,
    {
      method: "POST",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...getAuthHeaders(),
      },
      credentials: "include",
      body,
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to save bookmark: ${response.status}`)
    );
  }
}

export async function removeNewsBookmark(newsId: string): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/news/bookmarks/${encodeURIComponent(newsId)}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to remove bookmark: ${response.status}`)
    );
  }
}

export async function getNewsCounts(
  topics: string[],
  sort: "latest" | "upvotes" = "latest"
): Promise<NewsCountsResponse> {
  const url = new URL("/api/news/counts", getApiBaseUrl());

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
  const url = new URL("/api/news/trending-topics", getApiBaseUrl());

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
    `${getApiBaseUrl()}/api/news/${encodedNewsId}`,
    {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: "include",
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
  const response = await fetch(`${getApiBaseUrl()}/api/sync`, {
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
  globalRank = true,
  topics: string[] = []
): Promise<CompanyLeaderboardResponse> {
  const url = new URL("/api/companies/leaderboard", getApiBaseUrl());

  url.searchParams.set("limit", String(limit));
  url.searchParams.set("global_rank", String(globalRank));
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
    getApiBaseUrl()
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
