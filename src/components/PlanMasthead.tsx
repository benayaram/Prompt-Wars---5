import { diffDays, OCCASION_LABELS, toLakh } from '../engine';
import { formatDate } from '../lib/format';
import type { Plan } from '../schemas';
import { Icon } from './Icon';

function countdown(days: number): string {
  if (days > 1) return `${days} days to go`;
  if (days === 1) return 'Tomorrow';
  if (days === 0) return 'Today';
  return 'This date has passed';
}

/** The event at a glance, presented as a sleek modern executive overview. */
export function PlanMasthead({ plan, today }: { plan: Plan; today: string }) {
  const days = diffDays(today, plan.eventDate);

  return (
    <section
      aria-label="Plan summary"
      className="card mb-6 overflow-hidden bg-gradient-to-br from-card via-card to-accent-soft/30 p-5 shadow-card sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Active Event Workspace
            </span>
          </div>

          <h2
            id="plan-title"
            tabIndex={-1}
            className="font-display text-2xl font-bold tracking-tight text-ink outline-none sm:text-3xl md:text-4xl"
          >
            {OCCASION_LABELS[plan.occasion]}
            <span className="block text-ink-soft font-normal sm:inline">
              <span className="hidden sm:inline"> · </span>
              {formatDate(plan.eventDate)}
            </span>
          </h2>

          {plan.vibe && (
            <p className="mt-1.5 text-base italic text-ink-soft sm:text-lg">
              &ldquo;{plan.vibe}&rdquo;
            </p>
          )}
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-3 border-t border-line/60 pt-4 sm:grid-cols-3 sm:gap-4 text-sm">
        <li className="flex items-center gap-3 rounded-xl border border-line/60 bg-paper/60 px-3.5 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon name="users" className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-soft">Guest Count</p>
            <p className="font-semibold text-ink">{plan.guests} guests</p>
          </div>
        </li>

        <li className="flex items-center gap-3 rounded-xl border border-line/60 bg-paper/60 px-3.5 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon name="wallet" className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-soft">Target Budget</p>
            <p className="font-semibold text-ink">{toLakh(plan.totalBudget)} budget</p>
          </div>
        </li>

        <li className="col-span-2 flex items-center gap-3 rounded-xl border border-line/60 bg-paper/60 px-3.5 py-2.5 sm:col-span-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon name="calendar" className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-soft">Countdown</p>
            <p className="font-semibold text-ink">{countdown(days)}</p>
          </div>
        </li>
      </ul>
    </section>
  );
}
