import type { PriceSummary } from '@/lib/api';

type AnalyticsSummaryProps = {
  summary: PriceSummary;
};

const summaryItems: Array<{ key: keyof PriceSummary; label: string; suffix?: string }> = [
  { key: 'listings_count', label: 'Listings Analysed' },
  { key: 'average_price_per_sqm', label: 'Avg Sale Price / m²', suffix: ' TRY' },
  { key: 'average_rent_per_sqm', label: 'Avg Rent / m²', suffix: ' TRY' },
];

export function AnalyticsSummary({ summary }: AnalyticsSummaryProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Market Snapshot</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        {summaryItems.map(({ key, label, suffix }) => (
          <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900">{formatValue(summary[key], suffix)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function formatValue(value: number | undefined, suffix?: string) {
  if (value === undefined || value === null) {
    return '—';
  }
  if (suffix === ' TRY') {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
  }
  if (typeof value === 'number' && !Number.isInteger(value)) {
    return `${value.toFixed(2)}${suffix ?? ''}`;
  }
  return `${value}${suffix ?? ''}`;
}


