import type {
  PaperDetailResponse,
  PapersResponse,
} from "@/types/paper";



const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function getPapers(
  query = "artificial intelligence",
  limit = 12
): Promise<PapersResponse> {
  const url = new URL("/api/papers", API_BASE_URL);

  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorMessage = await response.text();

    throw new Error(
      errorMessage || `Failed to fetch papers: ${response.status}`
    );
  }

  return response.json() as Promise<PapersResponse>;
}

export async function getPaperById(
  paperId: string
): Promise<PaperDetailResponse> {
  const encodedPaperId = encodeURIComponent(paperId);

  const response = await fetch(
    `${API_BASE_URL}/api/papers/${encodedPaperId}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch paper: ${response.status}`
    );
  }

  return response.json() as Promise<PaperDetailResponse>;
}