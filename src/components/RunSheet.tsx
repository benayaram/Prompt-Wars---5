import { RUN_SHEETS } from '../engine';
import type { Occasion } from '../schemas';
import { Icon } from './Icon';

/** The day itself, in order. Suggested times only; families adjust them to their muhurat. */
export function RunSheet({ occasion }: { occasion: Occasion }) {
  return (
    <section className="card shadow-card" aria-labelledby="runsheet-h">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <Icon name="clock" className="h-5 w-5 text-accent" />
        <div>
          <h3 id="runsheet-h" className="font-display text-lg font-bold text-ink">
            On the day: suggested run sheet
          </h3>
          <p className="hint">
            Typical event flow for family & vendors. Calibrated to your chosen occasion.
          </p>
        </div>
      </div>
      <ol className="mt-4 divide-y divide-line/70">
        {RUN_SHEETS[occasion].map((item) => (
          <li key={item.time} className="flex items-center gap-4 py-3 text-sm">
            <time className="tabular flex h-8 w-16 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent-soft font-mono font-bold text-accent shadow-2xs">
              {item.time}
            </time>
            <span className="font-medium text-ink">{item.title}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
