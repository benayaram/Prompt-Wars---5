import { formatINR, toLakh } from '../engine';
import { Icon } from './Icon';

export interface BudgetSummaryCardsProps {
  status: { total: number; committed: number; estimated: number };
}

/** Three summary metrics: Total Budget, Committed Vendor Quotes, and Estimated Spending. */
export function BudgetSummaryCards({ status }: BudgetSummaryCardsProps) {
  return (
    <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-line bg-paper/60 p-4 shadow-sm">
        <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
          <Icon name="wallet" className="h-3.5 w-3.5 text-accent" /> Total budget
        </dt>
        <dd className="tabular mt-1.5 font-display text-2xl font-bold text-ink sm:text-3xl">
          {formatINR(status.total)}
        </dd>
        <dd className="mt-0.5 text-xs font-semibold text-accent">{toLakh(status.total)}</dd>
      </div>
      <div className="rounded-xl border border-line bg-paper/60 p-4 shadow-sm">
        <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
          <Icon name="check" className="h-3.5 w-3.5 text-ok" /> Committed (verified quotations)
        </dt>
        <dd className="tabular mt-1.5 font-display text-2xl font-bold text-ok sm:text-3xl">
          {formatINR(status.committed)}
        </dd>
        <dd className="mt-0.5 text-xs font-medium text-ink-soft">Locked in vendor contracts</dd>
      </div>
      <div className="rounded-xl border border-line bg-paper/60 p-4 shadow-sm">
        <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
          <Icon name="sparkle" className="h-3.5 w-3.5 text-accent" /> Estimated (not yet quoted)
        </dt>
        <dd className="tabular mt-1.5 font-display text-2xl font-bold text-ink sm:text-3xl">
          {formatINR(status.estimated)}
        </dd>
        <dd className="mt-0.5 text-xs font-medium text-ink-soft">Pending final vendor quotes</dd>
      </div>
    </dl>
  );
}

export interface BudgetStatusBannerProps {
  status: { overBy: number; overByPct: number; total: number };
  onShowOptions: () => void;
}

/** Sticky live banner notifying the user whether the budget is balanced or exceeded. */
export function BudgetStatusBanner({ status, onShowOptions }: BudgetStatusBannerProps) {
  const over = status.overBy > 0;
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="over-budget-region"
      className="sticky top-16 z-20"
    >
      {over ? (
        <div className="flex h-[4.5rem] items-center gap-3 rounded-2xl border border-warn/40 bg-warn-soft px-4 text-warn shadow-md backdrop-blur-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warn/15 text-warn">
            <Icon name="alert" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold sm:text-base">
              Over budget by {formatINR(status.overBy)}
            </p>
            <p className="truncate text-xs text-warn/90 sm:text-sm">
              {status.overByPct}% of your total. Nothing was changed automatically.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary shrink-0 !bg-warn !text-white hover:!bg-warn/90"
            onClick={onShowOptions}
          >
            Options
          </button>
        </div>
      ) : (
        <div className="flex h-[4.5rem] items-center gap-3 rounded-2xl border border-ok/30 bg-card px-4 text-ink-soft shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ok-soft text-ok">
            <Icon name="check" className="h-5 w-5" />
          </div>
          <p className="truncate text-sm font-semibold text-ink">
            Within budget. Everything adds up to {formatINR(status.total)}.
          </p>
        </div>
      )}
    </div>
  );
}
