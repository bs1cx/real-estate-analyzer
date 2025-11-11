import type { YieldMetrics } from '@/lib/api';

type YieldMetricsCardProps = {
  metrics: YieldMetrics;
};

const metricLabels: Array<{ key: keyof YieldMetrics; label: string; suffix?: string }> = [
  { key: 'average_sale_price', label: 'Average Sale Price', suffix: ' TRY' },
  { key: 'average_rent_price', label: 'Average Monthly Rent', suffix: ' TRY' },
  { key: 'rental_yield_percent', label: 'Rental Yield', suffix: '%' },
  { key: 'five_year_cagr_percent', label: '5Y CAGR', suffix: '%' },
  { key: 'investment_index', label: 'Investment Index' },
];

function formatMetric(value: number | string | undefined, suffix?: string) {
  if (value === undefined || value === null) {
    return '—';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (suffix === ' TRY') {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
  }
  return `${Number(value).toFixed(2)}${suffix ?? ''}`;
}

export function YieldMetricsCard({ metrics }: YieldMetricsCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Investment Metrics</h2>
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          Recommendation: {metrics.recommendation}
        </span>
      </div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metricLabels.map(({ key, label, suffix }) => (
          <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900">{formatMetric(metrics[key], suffix)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}


