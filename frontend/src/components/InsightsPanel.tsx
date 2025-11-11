import type { Insight } from '@/lib/api';

type InsightsPanelProps = {
  insights: Insight[];
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (!insights.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Insights</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {insights.map((insight) => (
          <article key={insight.title} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <h3 className="text-base font-semibold text-blue-800">{insight.title}</h3>
            <p className="mt-2 text-sm text-blue-700">{insight.detail}</p>
            {insight.recommendation ? (
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-blue-500">
                Recommendation: {insight.recommendation}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

