'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AnalyticsSummary } from '@/components/AnalyticsSummary';
import { FilterPanel } from '@/components/FilterPanel';
import { InsightsPanel } from '@/components/InsightsPanel';
import { MapView } from '@/components/MapView';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { YieldMetricsCard } from '@/components/YieldMetricsCard';
import { fetchPriceAnalysis, type PriceAnalysisFilters, type PriceAnalysisResponse } from '@/lib/api';

const initialFilters: PriceAnalysisFilters = {
  city: 'Istanbul',
  property_type: 'Apartment',
};

export default function Home() {
  const [filters, setFilters] = useState<PriceAnalysisFilters>(initialFilters);
  const [analysis, setAnalysis] = useState<PriceAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilterChange = useCallback(
    (key: keyof PriceAnalysisFilters, value: string | number | undefined) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const runAnalysis = useCallback(
    async (mode: 'sale' | 'rent' | 'investment') => {
      setIsLoading(true);
      setError(null);
      try {
        const effectiveFilters: PriceAnalysisFilters = {
          ...filters,
          listing_type: mode === 'investment' ? undefined : mode,
        };
        const response = await fetchPriceAnalysis(effectiveFilters);
        setAnalysis(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error while fetching analysis.');
      } finally {
        setIsLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    runAnalysis('investment');
  }, [runAnalysis]);

  const summary = useMemo(() => analysis?.summary, [analysis]);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 font-sans sm:px-6 lg:px-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Real Estate Analytics Dashboard</h1>
          <p className="text-sm text-slate-600">
            Explore pricing trends, rental yields, and investment potential across Turkish neighbourhoods.
          </p>
        </header>

        <FilterPanel filters={filters} onChange={handleFilterChange} onSubmit={runAnalysis} isLoading={isLoading} />

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {analysis && summary ? (
          <>
            <AnalyticsSummary summary={summary} />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TimeSeriesChart data={analysis.time_series} />
              </div>
              <YieldMetricsCard metrics={analysis.yield_metrics} />
            </div>
            <InsightsPanel insights={analysis.insights} />
            <MapView
              city={filters.city}
              district={filters.district}
              neighbourhood={filters.neighbourhood}
              listingsCount={summary.listings_count}
            />
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Provide search criteria to view analytics.
          </div>
        )}
      </main>
    </div>
  );
}
