'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AnalyticsSummary } from '@/components/AnalyticsSummary';
import { FilterPanel } from '@/components/FilterPanel';
import { InsightsPanel } from '@/components/InsightsPanel';
import { MapView } from '@/components/MapView';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { YieldMetricsCard } from '@/components/YieldMetricsCard';
import type { PriceAnalysisFilters, PriceAnalysisResponse } from '@/lib/api';
import { fetchPriceAnalysis } from '@/lib/api';

const initialFilters: PriceAnalysisFilters = {
  city: 'Istanbul',
  district: undefined,
  neighbourhood: undefined,
  property_type: undefined,
  listing_type: undefined,
  min_size: undefined,
  max_size: undefined,
  min_rooms: undefined,
  max_rooms: undefined,
  min_age: undefined,
  max_age: undefined,
};

export default function Home() {
  const [filters, setFilters] = useState<PriceAnalysisFilters>(initialFilters);
  const [analysis, setAnalysis] = useState<PriceAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveFilters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
      ) as PriceAnalysisFilters,
    [filters],
  );

  const handleFetch = useCallback(
    async (override: Partial<PriceAnalysisFilters> = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchPriceAnalysis({ ...effectiveFilters, ...override });
        setAnalysis(response);
        if (Object.keys(override).length > 0) {
          setFilters((previous) => ({ ...previous, ...override }));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    },
    [effectiveFilters],
  );

  useEffect(() => {
    handleFetch();
  }, [handleFetch]);

  const handleFilterChange = (key: keyof PriceAnalysisFilters, value: string | number | undefined) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = (mode: 'sale' | 'rent' | 'investment') => {
    if (mode === 'investment') {
      void handleFetch({ listing_type: undefined });
    } else {
      void handleFetch({ listing_type: mode });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Real Estate Analytics</h1>
            <p className="text-sm text-slate-500">Track prices, rental yields, and investment potential across Turkey.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Backend: FastAPI</span>
            <span>Frontend: Next.js 14</span>
            <span>DB: PostgreSQL + PostGIS</span>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-6 px-6">
        <FilterPanel filters={filters} onChange={handleFilterChange} onSubmit={handleSubmit} isLoading={isLoading} />

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            <h2 className="text-base font-semibold">We couldn&apos;t load analysis</h2>
            <p className="mt-2">{error}</p>
            <button
              type="button"
              className="mt-4 inline-flex items-center rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-rose-700"
              onClick={() => handleFetch()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {analysis ? (
          <>
            <AnalyticsSummary summary={analysis.summary} />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <YieldMetricsCard metrics={analysis.yield_metrics} />
                <TimeSeriesChart data={analysis.time_series} />
                <InsightsPanel insights={analysis.insights} />
              </div>
              <div className="lg:col-span-1 space-y-6">
                <MapView city={filters.city} neighbourhood={filters.neighbourhood} />
              </div>
            </div>
          </>
        ) : !error && !isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            Apply filters and choose an analysis to see results.
          </div>
        ) : null}
      </div>
    </main>
  );
}

