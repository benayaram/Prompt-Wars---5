import { memo } from 'react';
import { BRANDING } from '../config/branding';
import {
  buildSchedule,
  budgetStatus,
  categoryLabel,
  categoryNeeds,
  effectiveCost,
  formatINR,
  OCCASION_LABELS,
  planReadiness,
  percentOf,
  RUN_SHEETS,
} from '../engine';
import { CATEGORIES, type Plan } from '../schemas';
import { formatDate } from '../lib/format';

/**
 * Printable executive summary. Hidden on screen, shown by print CSS.
 * Formatted cleanly with high-contrast print typography.
 */
export const PrintSummary = memo(function PrintSummary({
  plan,
  today,
}: {
  plan: Plan;
  today: string;
}) {
  const status = budgetStatus(plan);
  const needs = categoryNeeds(plan);
  const readiness = planReadiness(plan);
  let schedule: ReturnType<typeof buildSchedule> = [];
  try {
    schedule = buildSchedule(plan.tasks, plan.eventDate, today);
  } catch {
    schedule = [];
  }
  const accepted = plan.quotes.filter((q) => q.accepted);

  return (
    <article className="print-only print-sheet p-6" aria-label="Plan summary for printing">
      <div className="border-b-2 border-ink pb-3">
        <p className="text-sm font-bold uppercase tracking-widest text-accent">
          {BRANDING.PRODUCT_NAME} · Celebration plan
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">{OCCASION_LABELS[plan.occasion]}</h1>
        <p className="mt-1 text-sm">
          {formatDate(plan.eventDate)} · {plan.guests} guests · Total budget{' '}
          {formatINR(plan.totalBudget)}
          {plan.vibe ? ` · ${plan.vibe}` : ''}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          Plan readiness {readiness.percent}% · {readiness.tasksDone}/{readiness.tasksTotal} tasks
          done · {readiness.quotesVerified}/{readiness.quotesTotal} categories with verified
          quotations
        </p>
      </div>

      <h2 className="mt-5 text-lg font-bold">Budget Breakdown</h2>
      <table className="mt-2">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Amount</th>
            <th scope="col">Share</th>
            <th scope="col">Basis</th>
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((c) => (
            <tr key={c}>
              <th scope="row">{categoryLabel(plan.occasion, c)}</th>
              <td>{formatINR(plan.allocation[c])}</td>
              <td>{percentOf(plan.allocation[c], plan.totalBudget)}%</td>
              <td>
                {needs.find((n) => n.category === c)?.verified ? 'Verified quotation' : 'Estimate'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-sm">
        Committed {formatINR(status.committed)} · Estimated {formatINR(status.estimated)}
        {status.overBy > 0 ? ` · Over budget by ${formatINR(status.overBy)}` : ' · Within budget'}
      </p>

      {accepted.length > 0 && (
        <>
          <h2 className="mt-5 text-lg font-bold">Accepted vendor quotations</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {accepted.map((q) => (
              <li key={q.id}>
                {categoryLabel(plan.occasion, q.category)}: {q.quote.vendorName ?? 'Vendor'} ·{' '}
                {formatINR(effectiveCost(q.quote, plan.guests) ?? 0)}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mt-5 text-lg font-bold">Execution Timeline</h2>
      <table className="mt-2">
        <thead>
          <tr>
            <th scope="col">Task</th>
            <th scope="col">Due</th>
            <th scope="col">Owner</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((t) => (
            <tr key={t.id}>
              <th scope="row">{t.title}</th>
              <td>{formatDate(t.effectiveDate)}</td>
              <td>{t.assignee?.trim() ? t.assignee : '-'}</td>
              <td>
                {t.status === 'done'
                  ? 'Done'
                  : t.status === 'delayed'
                    ? `Delayed ${t.delayDays} days`
                    : 'To do'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-5 text-lg font-bold">On the day (suggested)</h2>
      <ul className="mt-2 list-none space-y-1 pl-0 text-sm">
        {RUN_SHEETS[plan.occasion].map((item) => (
          <li key={item.time}>
            <strong>{item.time}</strong> {item.title}
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-line pt-3 text-xs text-ink-soft">
        Amounts are estimates unless marked as a verified quotation. Planned with {BRANDING.PRODUCT_NAME}.
      </p>
    </article>
  );
});
