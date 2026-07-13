export type Paper = {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  categories: string[];
  published_at: string;
  updated_at: string;
  arxiv_url: string;
  pdf_url: string | null;
};

export type PapersResponse = {
  query: string;
  count: number;
  papers: Paper[];
};

export interface PaperAIAnalysis {
  id: number;
  executive_summary: string;
  why_it_matters: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Research";
  reading_time_minutes: number;
  key_contributions: string[];
  limitations: string[];
  use_cases: string[];
  prerequisites: string[];
  target_roles: string[];
  model_name: string;
  created_at: string;
  updated_at: string;
}

export interface PaperDetailResponse {
  paper: Paper;
  analysis: PaperAIAnalysis | null;
}