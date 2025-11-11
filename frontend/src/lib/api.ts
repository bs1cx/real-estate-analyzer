export type PriceAnalysisFilters = {
  city?: string;
  district?: string;
  neighbourhood?: string;
  property_type?: string;
  listing_type?: 'sale' | 'rent';
  min_size?: number;
  max_size?: number;
  min_rooms?: number;
  max_rooms?: number;
  min_age?: number;
  max_age?: number;
};

export type PricePoint = {
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

export type PriceSummary = {
  listings_count: number;
  average_price_per_sqm?: number;
  average_rent_per_sqm?: number;
};

export type Insight = {
  title: string;
  detail: string;
  recommendation?: string | null;
};

export type PriceAnalysisResponse = {
  filters: Record<string, string | number | null>;
  summary: PriceSummary;
  time_series: PricePoint[];
  yield_metrics: YieldMetrics;
  insights: Insight[];
};

export async function fetchPriceAnalysis(filters: PriceAnalysisFilters): Promise<PriceAnalysisResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:8000";

  const searchParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const url = `${baseUrl}/api/price-analysis?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch price analysis: ${response.status} ${errorText}`);
  }

  return response.json();
}

