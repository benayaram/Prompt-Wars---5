import type { Plan } from '../schemas';
import type { Action } from '../state/planStore';
import { QuoteAnalyzer } from './QuoteAnalyzer';
import { QuoteComparison } from './QuoteComparison';
import { VendorChecklist } from './VendorChecklist';

export default function VendorsTab({
  plan,
  dispatch,
}: {
  plan: Plan;
  dispatch: (action: Action) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Vendor Procurement & Contract Intelligence
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Track outreach status, extract fine print from quotes with GenAI, and compare bids
          side-by-side.
        </p>
      </div>
      <VendorChecklist plan={plan} dispatch={dispatch} />
      <QuoteAnalyzer plan={plan} dispatch={dispatch} />
      <QuoteComparison plan={plan} dispatch={dispatch} />
    </div>
  );
}
