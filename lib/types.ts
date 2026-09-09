export type Work = {
  frbr_uri: string;
  title: string;
  type?: string;
  number?: string;
  year?: number;
  status?: string;
  status_uncertain?: boolean;
};
export type SearchResult = {
  work_id: number;
  work: Work;
  snippet?: string;
  matching_pasals?: string[];
  best_passage?: { href?: string; work_href?: string } | null;
};
export type SearchData = {
  query: string;
  total: number;
  results: SearchResult[];
  did_you_mean?: { work: Work; work_id: number }[];
};
export type Article = {
  id: number;
  type: string;
  number?: string | null;
  heading?: string | null;
  content?: string | null;
  parent_id?: number | null;
  sort_order?: number;
};
export type DetailData = {
  work: Work;
  articles: Article[];
  relationships?: { type: string; related_work: Work }[];
};
export type Envelope<T> = {
  data: T;
  provenance: {
    source: "live" | "cache" | "backup";
    fetchedAt: string;
    warning?: string;
  };
};
