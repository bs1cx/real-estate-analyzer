import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

import type { PricePoint } from '@/lib/api';

type TimeSeriesChartProps = {
  data: PricePoint[];
};

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  if (!data.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No time series data available for the selected filters.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Price Evolution (5 Years)</h2>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
            <XAxis dataKey="period" stroke="#64748B" />
            <YAxis
              stroke="#64748B"
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
              }
            />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(
                  value,
                )
              }
            />
            <Legend />
            <Line type="monotone" dataKey="average_sale_price" stroke="#2563EB" strokeWidth={2} name="Sale Price" />
            <Line
              type="monotone"
              dataKey="average_rent_price"
              stroke="#0EA5E9"
              strokeWidth={2}
              name="Rent Price"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

