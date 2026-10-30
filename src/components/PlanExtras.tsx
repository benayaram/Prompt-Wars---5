import { categoryLabel } from '../engine';
import { CATEGORIES, type Category, type Occasion } from '../schemas';
import { Field } from './ui';

const PRIORITY_CATEGORIES = CATEGORIES.filter((c) => c !== 'contingency');

/** The optional part of the intake: style and the categories that matter most. */
export function PlanExtras({
  occasion,
  vibe,
  priorities,
  onVibe,
  onPriorities,
}: {
  occasion: Occasion;
  vibe: string;
  priorities: Category[];
  onVibe: (vibe: string) => void;
  onPriorities: (priorities: Category[]) => void;
}) {
  function toggle(category: Category) {
    onPriorities(
      priorities.includes(category)
        ? priorities.filter((c) => c !== category)
        : [...priorities, category],
    );
  }

  return (
    <details className="group rounded-2xl border border-line bg-paper/40 p-4 transition-all">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between font-semibold text-ink group-open:border-b group-open:border-line group-open:pb-3">
        <span>Make it yours (optional)</span>
        <span className="text-xs text-ink-soft">Custom vibe & budget weighting</span>
      </summary>
      <div className="mt-4 space-y-5">
        <Field label="Style or vibe" hint="For example: traditional, minimal, fun for kids.">
          {(p) => (
            <input
              {...p}
              className="input"
              maxLength={200}
              placeholder="e.g. Royal traditional, minimal modern, vibrant festival"
              value={vibe}
              onChange={(e) => onVibe(e.target.value)}
            />
          )}
        </Field>
        <fieldset>
          <legend className="label mb-2">
            What matters most? We give these categories more of the budget.
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRIORITY_CATEGORIES.map((c) => {
              const active = priorities.includes(c);
              return (
                <label
                  key={c}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'border-accent bg-accent-soft text-accent shadow-sm'
                      : 'border-line bg-card text-ink hover:border-ink-soft/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-accent"
                    checked={active}
                    onChange={() => toggle(c)}
                  />
                  <span>{categoryLabel(occasion, c)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </details>
  );
}
