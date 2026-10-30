import { useMemo } from 'react';
import { vendorChecklist, VENDOR_STATUS_LABELS, type VendorStatus } from '../engine';
import type { Plan } from '../schemas';
import { Icon, type IconName } from './Icon';
import type { Action } from '../state/planStore';

const ICON: Record<VendorStatus, IconName> = {
  not_started: 'circle',
  contacted: 'mail',
  quote_received: 'file',
  quote_accepted: 'check',
};

export function VendorChecklist({
  plan,
  dispatch,
}: {
  plan: Plan;
  dispatch: (action: Action) => void;
}) {
  const items = useMemo(() => vendorChecklist(plan), [plan]);
  const confirmed = items.filter((i) => i.status === 'quote_accepted').length;

  return (
    <section className="card shadow-card" aria-labelledby="checklist-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3.5">
        <div>
          <h2 id="checklist-h" className="font-display text-lg font-bold text-ink">
            Vendor checklist
          </h2>
          <p className="hint">
            Tick &quot;Contacted&quot; when you reach out. Saving or accepting a quotation below updates
            the status.
          </p>
        </div>
        <p className="text-sm text-ink-soft">
          {confirmed} of {items.length} vendors confirmed
        </p>
      </div>

      <ul className="mt-2 divide-y divide-line/70">
        {items.map((item) => (
          <li
            key={item.category}
            className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:bg-paper/40"
          >
            <div className="min-w-0">
              <p className="font-bold text-ink">{item.label}</p>
              <p className="text-xs text-ink-soft sm:text-sm">{item.hint}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={item.status === 'quote_accepted' ? 'badge-verified' : 'badge-estimate'}
              >
                <Icon name={ICON[item.status]} className="h-3 w-3" />{' '}
                {VENDOR_STATUS_LABELS[item.status]}
              </span>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink-soft/40">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-accent"
                  checked={item.status !== 'not_started'}
                  disabled={item.quotes > 0}
                  onChange={() => dispatch({ type: 'toggleContacted', category: item.category })}
                  aria-label={`Contacted ${item.label} vendor`}
                />
                Contacted
              </label>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
