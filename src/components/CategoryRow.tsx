import { memo, useState } from 'react';
import {
  categoryLabel,
  formatINR,
  parseINR,
  percentOf,
  toLakh,
  type CategoryNeed,
} from '../engine';
import type { Category, Occasion } from '../schemas';
import { Icon } from './Icon';
import { EstimateBadge } from './ui';

interface Props {
  occasion: Occasion;
  category: Category;
  amount: number;
  total: number;
  locked: boolean;
  need: CategoryNeed;
  swatchClass: string;
  onChange: (category: Category, amount: number) => void;
  onToggleLock: (category: Category) => void;
}

function stepFor(total: number): number {
  if (total >= 100_000) return 1000;
  if (total >= 10_000) return 100;
  return 1;
}

/** One row per category: label, badge, slider, amount and lock sit together (common region). */
export const CategoryRow = memo(function CategoryRow({
  occasion,
  category,
  amount,
  total,
  locked,
  need,
  swatchClass,
  onChange,
  onToggleLock,
}: Props) {
  const label = categoryLabel(occasion, category);
  const [text, setText] = useState(String(amount));
  const [invalid, setInvalid] = useState(false);
  const [seen, setSeen] = useState(amount);
  if (seen !== amount) {
    setSeen(amount);
    setText(String(amount));
    setInvalid(false);
  }

  function commit() {
    const parsed = text.trim() === '0' ? 0 : parseINR(text);
    if (parsed === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onChange(category, parsed);
  }

  const errorId = `${category}-err`;
  return (
    <article
      aria-label={label}
      className="grid gap-x-6 gap-y-3 px-4 py-5 transition-colors hover:bg-paper/40 sm:px-6 md:grid-cols-[13rem_minmax(0,1fr)_11rem] md:items-center"
    >
      <div>
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`h-3 w-3 shrink-0 rounded-full ring-2 ring-card shadow-sm ${swatchClass}`}
          />
          <h3 className="text-base font-bold text-ink">{label}</h3>
        </div>
        <p className="tabular mt-0.5 text-xs font-semibold text-ink-soft">
          {percentOf(amount, total)}% of total · {toLakh(amount)}
        </p>
        <div className="mt-2">
          <EstimateBadge verified={need.verified} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="range"
            aria-label={`${label} amount`}
            min={0}
            max={total}
            step={stepFor(total)}
            value={amount}
            disabled={locked}
            onChange={(e) => onChange(category, Number(e.target.value))}
            className="w-full"
          />
        </div>
        <button
          type="button"
          className={`btn-secondary shrink-0 !min-h-10 !px-3 text-xs font-semibold transition-all ${
            locked
              ? '!border-accent !bg-accent-soft !text-accent shadow-sm'
              : 'hover:border-ink-soft/40'
          }`}
          aria-pressed={locked}
          aria-label={`Lock ${label} amount`}
          onClick={() => onToggleLock(category)}
        >
          <Icon name={locked ? 'lock' : 'unlock'} className="h-3.5 w-3.5" />
          <span>{locked ? 'Locked' : 'Lock'}</span>
        </button>
      </div>

      <div>
        <label htmlFor={`${category}-amt`} className="sr-only">
          {label} amount (₹)
        </label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-soft"
          >
            ₹
          </span>
          <input
            id={`${category}-amt`}
            className="input tabular pl-8 pr-3 text-right font-bold text-ink"
            inputMode="text"
            autoComplete="off"
            value={text}
            disabled={locked}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
            }}
          />
        </div>
        {invalid && (
          <p
            id={errorId}
            className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-warn"
          >
            <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
            Couldn&apos;t read that amount.
          </p>
        )}
      </div>

      {need.verified && (
        <div className="rounded-lg border border-ok/20 bg-ok-soft/60 px-3 py-1.5 text-xs font-medium text-ok md:col-span-3">
          Accepted quotation: {formatINR(need.amount)}
        </div>
      )}
      {need.shortfall > 0 && (
        <p className="flex items-start gap-1.5 text-xs font-semibold text-warn md:col-span-3">
          <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Needs {formatINR(need.amount)}, which is {formatINR(need.shortfall)} more than budgeted.
          </span>
        </p>
      )}
    </article>
  );
});
