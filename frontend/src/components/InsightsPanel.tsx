import type { Insight } from '@/lib/api';

type InsightsPanelProps = {
  insights: Insight[];
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Insights</h2>
      <ul className="mt-4 space-y-4">
        {insights.map((insight, index) => (
          <li key={`${insight.title}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">{insight.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{insight.detail}</p>
            {insight.recommendation ? (
              <span className="mt-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Recommendation: {insight.recommendation}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}


