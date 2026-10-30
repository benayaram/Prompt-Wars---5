import { useCallback, useMemo, useRef } from 'react';
import { useSyncedText } from '../lib/useSyncedText';
import {
  budgetStatus,
  categoryNeeds,
  formatINR,
  generateOverBudgetOptions,
  OCCASION_LABELS,
  parseGuests,
  parseINR,
  scaleGuests,
  toLakh,
} from '../engine';
import { MAX_GUESTS, type Category, type Plan } from '../schemas';
import type { Action } from '../state/planStore';
import { AllocationBar, SWATCH_CLASS } from './AllocationBar';
import { CategoryRow } from './CategoryRow';
import { Icon } from './Icon';
import { TradeoffPanel } from './TradeoffPanel';
import { Field } from './ui';

export function BudgetTab({ plan, dispatch }: { plan: Plan; dispatch: (action: Action) => void }) {
  const status = useMemo(() => budgetStatus(plan), [plan]);
  const needs = useMemo(() => categoryNeeds(plan), [plan]);
  const options = useMemo(() => generateOverBudgetOptions(plan), [plan]);
  const impact = useMemo(() => scaleGuests(plan, plan.guests), [plan]);

  const [guestsText, setGuestsText] = useSyncedText(String(plan.guests));
  const [budgetText, setBudgetText] = useSyncedText(String(plan.totalBudget));
  const [perPlateText, setPerPlateText] = useSyncedText(String(Math.round(plan.perPlate)));

  const onChange = useCallback(
    (category: Category, amount: number) => dispatch({ type: 'setAmount', category, amount }),
    [dispatch],
  );
  const onToggleLock = useCallback(
    (category: Category) => dispatch({ type: 'toggleLock', category }),
    [dispatch],
  );

  function commitGuests(value: string) {
    const guests = parseGuests(value);
    if (guests === null) setGuestsText(String(plan.guests));
    else dispatch({ type: 'setGuests', guests });
  }
  function commitBudget() {
    const parsed = parseINR(budgetText);
    if (parsed === null) setBudgetText(String(plan.totalBudget));
    else dispatch({ type: 'setTotal', total: parsed });
  }
  function commitPerPlate() {
    const parsed = perPlateText.trim() === '0' ? 0 : parseINR(perPlateText);
    if (parsed === null) setPerPlateText(String(Math.round(plan.perPlate)));
    else dispatch({ type: 'setPerPlate', perPlate: parsed });
  }

  const over = status.overBy > 0;
  const optionsRef = useRef<HTMLDivElement>(null);
  const showOptions = () => {
    optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    optionsRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="space-y-6">
      <section className="card shadow-card" aria-labelledby="summary-h">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 id="summary-h" className="font-display text-xl font-bold text-ink">Budget at a glance</h2>
            <p className="hint">Real-time allocation across 7 core event categories</p>
          </div>
          <span className="badge-estimate">Live Engine Math</span>
        </div>
        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-paper/60 p-4 shadow-sm">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <Icon name="wallet" className="h-3.5 w-3.5 text-accent" /> Total budget
            </dt>
            <dd className="tabular mt-1.5 font-display text-2xl font-bold text-ink sm:text-3xl">{formatINR(status.total)}</dd>
            <dd className="mt-0.5 text-xs font-semibold text-accent">{toLakh(status.total)}</dd>
          </div>
          <div className="rounded-xl border border-line bg-paper/60 p-4 shadow-sm">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <Icon name="check" className="h-3.5 w-3.5 text-ok" /> Committed (verified quotations)
            </dt>
            <dd className="tabular mt-1.5 font-display text-2xl font-bold text-ok sm:text-3xl">{formatINR(status.committed)}</dd>
            <dd className="mt-0.5 text-xs font-medium text-ink-soft">Locked in vendor contracts</dd>
          </div>
          <div className="rounded-xl border border-line bg-paper/60 p-4 shadow-sm">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <Icon name="sparkle" className="h-3.5 w-3.5 text-accent" /> Estimated (not yet quoted)
            </dt>
            <dd className="tabular mt-1.5 font-display text-2xl font-bold text-ink sm:text-3xl">{formatINR(status.estimated)}</dd>
            <dd className="mt-0.5 text-xs font-medium text-ink-soft">Pending final vendor quotes</dd>
          </div>
        </dl>
        <div className="mt-6 border-t border-line/80 pt-5">
          <AllocationBar plan={plan} />
        </div>
      </section>

      <div role="status" aria-live="polite" data-testid="over-budget-region" className="sticky top-16 z-20">
        {over ? (
          <div className="flex h-[4.5rem] items-center gap-3 rounded-2xl border border-warn/40 bg-warn-soft px-4 text-warn shadow-md backdrop-blur-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warn/15 text-warn">
              <Icon name="alert" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold sm:text-base">Over budget by {formatINR(status.overBy)}</p>
              <p className="truncate text-xs text-warn/90 sm:text-sm">{status.overByPct}% of your total. Nothing was changed automatically.</p>
            </div>
            <button type="button" className="btn-primary shrink-0 !bg-warn !text-white hover:!bg-warn/90" onClick={showOptions}>
              Options
            </button>
          </div>
        ) : (
          <div className="flex h-[4.5rem] items-center gap-3 rounded-2xl border border-ok/30 bg-card px-4 text-ink-soft shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ok-soft text-ok">
              <Icon name="check" className="h-5 w-5" />
            </div>
            <p className="truncate text-sm font-semibold text-ink">Within budget. Everything adds up to {formatINR(status.total)}.</p>
          </div>
        )}
      </div>

      <section className="card shadow-card" aria-labelledby="controls-h">
        <h2 id="controls-h" className="font-display text-lg font-bold text-ink">Guests and totals</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          <Field label="Number of guests">
            {(p) => (
              <input
                {...p}
                className="input font-semibold"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_GUESTS}
                value={guestsText}
                onChange={(e) => {
                  setGuestsText(e.target.value);
                  const guests = parseGuests(e.target.value);
                  if (guests !== null) dispatch({ type: 'setGuests', guests });
                }}
                onBlur={(e) => commitGuests(e.target.value)}
              />
            )}
          </Field>
          <Field label="Total budget (₹)" hint="Try 8 lakh or 8,00,000">
            {(p) => (
              <input
                {...p}
                className="input font-semibold"
                value={budgetText}
                onChange={(e) => setBudgetText(e.target.value)}
                onBlur={commitBudget}
                onKeyDown={(e) => e.key === 'Enter' && commitBudget()}
              />
            )}
          </Field>
          <Field label="Catering cost per plate (₹)" hint="Starts from your catering share. Edit if you know better.">
            {(p) => (
              <input
                {...p}
                className="input font-semibold"
                value={perPlateText}
                onChange={(e) => setPerPlateText(e.target.value)}
                onBlur={commitPerPlate}
                onKeyDown={(e) => e.key === 'Enter' && commitPerPlate()}
              />
            )}
          </Field>
        </div>
        <div className="mt-4 rounded-xl border border-line bg-paper/60 p-3.5">
          <p className="tabular text-sm text-ink" data-testid="guest-impact">
            {plan.guests} guests × {formatINR(Math.round(impact.perPlate))} per plate needs{' '}
            <strong className="text-accent">{formatINR(impact.requiredCatering)}</strong> for catering. You have budgeted{' '}
            <strong>{formatINR(impact.currentCatering)}</strong>
            {impact.overBy > 0 ? (
              <>
                :{' '}
                <span className="inline-flex items-center gap-1 font-semibold text-warn">
                  <Icon name="alert" className="h-3.5 w-3.5" />
                  {formatINR(impact.overBy)} short.
                </span>
              </>
            ) : (
              '. That covers it.'
            )}
          </p>
        </div>
      </section>

      <section aria-labelledby="cats-h">
        <div className="mb-3">
          <h2 id="cats-h" className="font-display text-xl font-bold text-ink">Where the money goes</h2>
          <p className="text-sm text-ink-soft">Move one slider and the others adjust to keep the total the same. Lock a category to protect it.</p>
        </div>
        <div className="card divide-y divide-line !p-0 shadow-card">
          {needs.map((need) => (
            <CategoryRow
              key={need.category}
              occasion={plan.occasion}
              category={need.category}
              amount={plan.allocation[need.category]}
              total={plan.totalBudget}
              locked={plan.locked.includes(need.category)}
              need={need}
              swatchClass={SWATCH_CLASS[need.category]}
              onChange={onChange}
              onToggleLock={onToggleLock}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Splits start from typical presets for a {OCCASION_LABELS[plan.occasion].toLowerCase()} and stay estimates until you accept a vendor quotation.
        </p>
      </section>

      {over && (
        <div id="tradeoffs" ref={optionsRef} tabIndex={-1} className="outline-none">
          <TradeoffPanel
            plan={plan}
            options={options}
            overBy={status.overBy}
            onApply={(option) => dispatch({ type: 'applyOption', option })}
          />
        </div>
      )}
    </div>
  );
}
