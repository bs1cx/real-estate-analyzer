import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import type { TimeSeriesPoint } from '@/lib/api';

type TimeSeriesChartProps = {
  data: TimeSeriesPoint[];
};

function formatTooltipValue(value: ValueType): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'number' ? item.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : item))
      .join(', ');
  }

  if (typeof value === 'number') {
    return value.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Price Trends (Last 5 Years)</h2>
      <div className="mt-4 h-80">
        {data.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-slate-500">Not enough data to display.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: ValueType, _name: NameType, _props) => formatTooltipValue(value)}
              />
              <Legend />
              <Line type="monotone" dataKey="average_sale_price" stroke="#2563eb" strokeWidth={2} name="Sale Price" />
              <Line type="monotone" dataKey="average_rent_price" stroke="#16a34a" strokeWidth={2} name="Rent Price" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}


