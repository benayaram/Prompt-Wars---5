import { BRANDING } from '../config/branding';

/** Welcome banner rendered at the top of the Plan Setup view before a plan exists. */
export function PlanSetupHero() {
  return (
    <div className="lg:col-span-2">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
        <span>✨</span> Next-Gen Event Operations
      </div>
      <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Plan the celebration, not the spreadsheet.
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft sm:text-base">
        Tell us about your event. {BRANDING.PRODUCT_NAME} keeps your budget, timeline, and vendors
        in one connected engine, so a change in one place synchronizes across all dimensions
        instantly.
      </p>
    </div>
  );
}
