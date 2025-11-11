export type PriceAnalysisFilters = {
  city?: string;
  district?: string;
  neighbourhood?: string;
  property_type?: string;
  listing_type?: "sale" | "rent";
  min_size?: number;
  max_size?: number;
  min_rooms?: number;
  max_rooms?: number;
  min_age?: number;
  max_age?: number;
};

export type PriceSummary = {
  listings_count: number;
  average_price_per_sqm?: number;
  average_rent_per_sqm?: number;
};

export type TimeSeriesPoint = {
  period: string;
  average_sale_price?: number;
  average_rent_price?: number;
};

export type YieldMetrics = {
  average_sale_price?: number;
  average_rent_price?: number;
  rental_yield_percent?: number;
  five_year_cagr_percent?: number;
  investment_index?: number;
  recommendation: string;
};

export type Insight = {
  title: string;
  detail: string;
  recommendation?: string | null;
};

export type PriceAnalysisResponse = {
  filters: Record<string, string | number | null>;
  summary: PriceSummary;
  time_series: TimeSeriesPoint[];
  yield_metrics: YieldMetrics;
  insights: Insight[];
};

export async function fetchPriceAnalysis(filters: PriceAnalysisFilters): Promise<PriceAnalysisResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:8000";
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const requestUrl = `${baseUrl}/api/price-analysis?${params.toString()}`;
  const response = await fetch(requestUrl);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch price analysis: ${response.status} ${errorText}`);
  }

  return response.json();
}


