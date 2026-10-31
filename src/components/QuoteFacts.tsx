import { effectiveCost, formatINR } from '../engine';
import type { Quote } from '../schemas';

const NOT_STATED = 'Not stated';
const rupees = (v: number | null) => (v === null ? NOT_STATED : formatINR(v));

/** The fields extracted from a quote, with "Not stated" wherever the vendor said nothing. */
export function QuoteFacts({ quote, guests }: { quote: Quote; guests: number }) {
  const rows: [string, string][] = [
    ['Vendor', quote.vendorName ?? NOT_STATED],
    ['Total price', rupees(quote.totalPrice)],
    ['Price per plate', rupees(quote.pricePerPlate)],
    ['Guest minimum', quote.guestMinimum === null ? NOT_STATED : String(quote.guestMinimum)],
    ['Overtime fee per hour', rupees(quote.overtimeFeePerHour)],
    [
      'Tax included',
      quote.taxIncluded === null ? NOT_STATED : quote.taxIncluded ? 'Yes' : 'No, extra',
    ],
    ['Advance', quote.advancePercent === null ? NOT_STATED : `${quote.advancePercent}%`],
    ['Inclusions', quote.inclusions.length ? quote.inclusions.join(', ') : NOT_STATED],
    ['Exclusions', quote.exclusions.length ? quote.exclusions.join(', ') : NOT_STATED],
    ['Cancellation', quote.cancellationPolicy ?? NOT_STATED],
  ];
  const cost = effectiveCost(quote, guests);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper/50">
      <table className="w-full">
        <caption className="sr-only">Details found in the quotation</caption>
        <tbody className="divide-y divide-line/70">
          {rows.map(([k, v]) => (
            <tr key={k} className="transition-colors hover:bg-card/60">
              <th
                scope="row"
                className="w-2/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-soft"
              >
                {k}
              </th>
              <td className="px-4 py-2 text-sm font-medium text-ink">{v}</td>
            </tr>
          ))}
          <tr className="bg-accent-soft/40">
            <th
              scope="row"
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent"
            >
              Effective cost for {guests} guests
            </th>
            <td className="px-4 py-2.5 font-display text-base font-bold text-accent">
              {cost === null ? 'Cannot be worked out yet' : formatINR(cost)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
