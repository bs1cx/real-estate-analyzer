import type { PriceSummary } from '@/lib/api';

type AnalyticsSummaryProps = {
  summary: PriceSummary;
};

function formatCurrency(value?: number | null) {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

export function AnalyticsSummary({ summary }: AnalyticsSummaryProps) {
  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3">
      <SummaryCard label="Listings Analyzed" value={summary.listings_count.toString()} />
      <SummaryCard label="Average Sale Price / m²" value={formatCurrency(summary.average_price_per_sqm)} />
      <SummaryCard label="Average Rent / m²" value={formatNumber(summary.average_rent_per_sqm)} suffix=" TRY" />
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  suffix?: string;
};

function SummaryCard({ label, value, suffix }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-5 text-center">
      <p className="text-sm uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        {value}
        {suffix ?? ''}
      </p>
    </div>
  );
}

