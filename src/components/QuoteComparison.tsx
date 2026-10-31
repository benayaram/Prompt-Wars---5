import { categoryLabel, compareQuote, effectiveCost, formatINR } from '../engine';
import { CATEGORIES, type Category, type Plan, type StoredQuote } from '../schemas';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { EstimateBadge } from './ui';

function CategoryTable({
  plan,
  category,
  quotes,
  dispatch,
}: {
  plan: Plan;
  category: Category;
  quotes: StoredQuote[];
  dispatch: (a: Action) => void;
}) {
  const label = categoryLabel(plan.occasion, category);
  const budget = plan.allocation[category];
  const cols = quotes.map((s) => {
    const cost = effectiveCost(s.quote, plan.guests);
    return { s, cost, flags: compareQuote(s.quote, plan) };
  });
  const cell = (render: (c: (typeof cols)[number]) => React.ReactNode) =>
    cols.map((c) => (
      <td key={c.s.id} className="border-b border-line px-4 py-3 align-middle text-sm text-ink">
        {render(c)}
      </td>
    ));

  return (
    <section className="card shadow-card overflow-x-auto !p-0" aria-labelledby={`cmp-${category}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
        <div>
          <h3 id={`cmp-${category}`} className="font-display text-base font-bold text-ink">
            {label}: Side-by-Side Comparison
          </h3>
          <p className="hint text-xs">Allocated Category Budget: {formatINR(budget)}</p>
        </div>
        <EstimateBadge verified={quotes.some((q) => q.accepted)} />
      </div>
      <table className="w-full min-w-[32rem]">
        <caption className="sr-only">Side-by-side quotations for {label}</caption>
        <thead>
          <tr className="bg-paper/70 text-xs uppercase tracking-wider text-ink-soft">
            <th scope="col" className="border-b border-line px-4 py-3 font-semibold text-left">
              <span className="sr-only">Metric</span>
            </th>
            {cols.map((c, i) => (
              <th
                key={c.s.id}
                scope="col"
                className="border-b border-line px-4 py-3 font-bold text-left text-ink"
              >
                <div className="flex items-center gap-2">
                  <span>{c.s.quote.vendorName ?? `Quotation ${i + 1}`}</span>
                  {c.s.accepted && (
                    <span className="badge-verified text-[11px]">
                      <Icon name="check" className="h-3 w-3" /> Accepted
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70">
          <tr className="hover:bg-paper/30">
            <th
              scope="row"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft"
            >
              Effective cost ({plan.guests} guests)
            </th>
            {cell((c) =>
              c.cost === null ? (
                'Not stated'
              ) : (
                <strong className="font-bold text-ink">{formatINR(c.cost)}</strong>
              ),
            )}
          </tr>
          <tr className="hover:bg-paper/30">
            <th
              scope="row"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft"
            >
              Against budget
            </th>
            {cell((c) =>
              c.cost === null ? (
                '-'
              ) : c.cost > budget ? (
                <span className="inline-flex items-center gap-1 font-semibold text-warn">
                  <Icon name="alert" className="h-3.5 w-3.5" />
                  {formatINR(c.cost - budget)} over
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-ok">
                  <Icon name="check" className="h-3.5 w-3.5" />
                  {formatINR(budget - c.cost)} under
                </span>
              ),
            )}
          </tr>
          <tr className="hover:bg-paper/30">
            <th
              scope="row"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft"
            >
              Per plate
            </th>
            {cell((c) =>
              c.s.quote.pricePerPlate === null ? '-' : formatINR(c.s.quote.pricePerPlate),
            )}
          </tr>
          <tr className="hover:bg-paper/30">
            <th
              scope="row"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft"
            >
              Guest minimum
            </th>
            {cell((c) => c.s.quote.guestMinimum ?? '-')}
          </tr>
          <tr className="hover:bg-paper/30">
            <th
              scope="row"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft"
            >
              Advance %
            </th>
            {cell((c) =>
              c.s.quote.advancePercent === null ? '-' : `${c.s.quote.advancePercent}%`,
            )}
          </tr>
          <tr className="hover:bg-paper/30">
            <th
              scope="row"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft"
            >
              Tax status
            </th>
            {cell((c) =>
              c.s.quote.taxIncluded === null
                ? 'Not stated'
                : c.s.quote.taxIncluded
                  ? 'Included'
                  : 'Extra',
            )}
          </tr>
          <tr className="hover:bg-paper/30">
            <th
              scope="row"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft"
            >
              Things to check
            </th>
            {cell((c) =>
              c.flags.length === 0 ? (
                <span className="inline-flex items-center gap-1 font-medium text-ok">
                  <Icon name="check" className="h-3.5 w-3.5" /> None
                </span>
              ) : (
                <ul className="space-y-1">
                  {c.flags.map((f) => (
                    <li key={f.code} className="text-xs font-semibold text-warn">
                      <Icon name="alert" className="mr-1 inline h-3.5 w-3.5" />
                      {f.message}
                    </li>
                  ))}
                </ul>
              ),
            )}
          </tr>
          <tr className="bg-paper/40">
            <th
              scope="row"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft"
            >
              Actions
            </th>
            {cell((c) => (
              <div className="flex flex-wrap gap-2">
                {!c.s.accepted && (
                  <button
                    type="button"
                    className="btn-primary !min-h-9 !px-3 text-xs font-semibold shadow-xs"
                    disabled={c.cost === null}
                    onClick={() => dispatch({ type: 'acceptQuote', id: c.s.id })}
                  >
                    Accept
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary !min-h-9 !px-3 text-xs font-semibold hover:border-warn hover:text-warn"
                  onClick={() => dispatch({ type: 'removeQuote', id: c.s.id })}
                >
                  Remove
                </button>
              </div>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function QuoteComparison({ plan, dispatch }: { plan: Plan; dispatch: (a: Action) => void }) {
  const groups = CATEGORIES.map((c) => ({
    c,
    quotes: plan.quotes.filter((q) => q.category === c),
  })).filter((g) => g.quotes.length > 0);

  if (groups.length === 0) {
    return (
      <div className="card shadow-card p-6 text-center">
        <p className="text-sm font-medium text-ink-soft">
          No quotations saved yet. Analyze a quotation above and save it to compare up to three
          vendors per category.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <CategoryTable key={g.c} plan={plan} category={g.c} quotes={g.quotes} dispatch={dispatch} />
      ))}
    </div>
  );
}
