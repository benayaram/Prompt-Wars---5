import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

export interface FieldError {
  /** Id of the input the message belongs to. */
  fieldId: string;
  message: string;
}

/**
 * GOV.UK-style error summary: after a failed submit it takes focus, says how many things need
 * fixing, and links straight to each field. `attempt` changes on every failed submit.
 */
export function ErrorSummary({ errors, attempt }: { errors: FieldError[]; attempt: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (attempt > 0) ref.current?.focus();
  }, [attempt]);

  if (attempt === 0 || errors.length === 0) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="error-summary-h"
      className="rounded-2xl border border-warn/40 bg-warn-soft p-4 text-warn shadow-sm outline-none"
    >
      <h3 id="error-summary-h" className="flex items-center gap-2 font-bold text-warn">
        <Icon name="alert" className="h-5 w-5 shrink-0" />
        Please fix {errors.length} {errors.length === 1 ? 'thing' : 'things'} to create your plan
      </h3>
      <ul className="mt-2.5 list-disc space-y-1.5 pl-6 text-sm font-medium">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              className="underline underline-offset-4 hover:opacity-80"
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(error.fieldId)?.focus();
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
