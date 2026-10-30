import { useState } from 'react';
import { BRANDING } from '../config/branding';
import { planReadiness } from '../engine';
import { useTheme } from '../lib/theme';
import type { Plan } from '../schemas';
import { shareHash } from '../state/share';
import { BrandMark, Icon } from './Icon';
import { Confirm } from './ui';

export function Header({ plan, onReset }: { plan: Plan | null; onReset: () => void }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [share, setShare] = useState<{ status: 'copied' | 'manual'; url: string } | null>(null);
  const readiness = plan ? planReadiness(plan) : null;
  const { theme, toggle } = useTheme();

  async function copyLink(current: Plan) {
    const url = `${window.location.origin}${window.location.pathname}${shareHash(current)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShare({ status: 'copied', url });
    } catch {
      setShare({ status: 'manual', url });
    }
  }

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <BrandMark className="h-9 w-9 shrink-0 drop-shadow-sm transition-transform hover:scale-105" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold leading-tight tracking-tight text-ink">
                {BRANDING.PRODUCT_NAME}
              </h1>
              <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-accent uppercase">
                PRO
              </span>
            </div>
            <p className="hidden text-xs font-medium text-ink-soft sm:block">{BRANDING.TAGLINE}</p>
          </div>
        </div>

        {readiness && (
          <div className="order-last w-full sm:order-none sm:w-64" aria-label="Plan readiness">
            <div className="flex items-baseline justify-between text-xs font-semibold">
              <span className="text-ink">Plan readiness {readiness.percent}%</span>
              <span className="text-[11px] font-normal text-ink-soft">
                {readiness.tasksDone}/{readiness.tasksTotal} tasks · {readiness.quotesVerified}/
                {readiness.quotesTotal} vendors
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dark transition-all duration-300"
                style={{ width: `${readiness.percent}%` }}
              />
            </div>
            <progress
              className="sr-only"
              max={100}
              value={readiness.percent}
              aria-label="Plan readiness percent"
            />
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="btn-secondary !min-h-10 !min-w-10 !p-2"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-4 w-4" />
          </button>
          {plan && (
            <>
              <button
                type="button"
                className="btn-secondary !min-h-10 !px-3 !py-2 text-xs sm:text-sm"
                onClick={() => void copyLink(plan)}
              >
                <Icon name="link" className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Share link</span>
              </button>
              <button
                type="button"
                className="btn-secondary !min-h-10 !px-3 !py-2 text-xs sm:text-sm"
                onClick={() => window.print()}
              >
                <Icon name="printer" className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Print summary</span>
              </button>
              <button
                type="button"
                className="btn-secondary !min-h-10 !px-3 !py-2 text-xs sm:text-sm hover:border-warn/50 hover:text-warn"
                onClick={() => setConfirmReset(true)}
              >
                <Icon name="reset" className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Reset</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6" aria-live="polite">
        {share?.status === 'copied' && (
          <p className="flex items-center gap-2 pb-3 text-sm font-semibold text-ok">
            <Icon name="check" className="h-4 w-4" />
            Link copied to clipboard. Anyone with it can open this plan.
          </p>
        )}
        {share?.status === 'manual' && (
          <div className="pb-3">
            <label htmlFor="share-url" className="label">
              Copy this link
            </label>
            <input
              id="share-url"
              readOnly
              className="input text-sm"
              value={share.url}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        )}
        {confirmReset && (
          <div className="pb-3">
            <Confirm
              prompt="Reset the whole plan? Your budget, timeline and quotations will be cleared from this browser."
              confirmLabel="Yes, reset"
              onCancel={() => setConfirmReset(false)}
              onConfirm={() => {
                setConfirmReset(false);
                setShare(null);
                onReset();
              }}
            />
          </div>
        )}
      </div>
    </header>
  );
}
