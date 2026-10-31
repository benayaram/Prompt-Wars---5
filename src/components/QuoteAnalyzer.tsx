import { useState } from 'react';
import { categoryLabel } from '../engine';
import {
  CategorySchema,
  CATEGORIES,
  MAX_QUOTES_PER_CATEGORY,
  type Category,
  type Plan,
  type Quote,
} from '../schemas';
import { extractQuote, type RequestOptions } from '../lib/api';
import { newId } from '../lib/id';
import { useAiCall } from '../lib/useAiCall';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { QuoteResult } from './QuoteResult';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading } from './ui';

const QUOTE_CATEGORIES = CATEGORIES.filter((c) => c !== 'contingency');

export function QuoteAnalyzer({
  plan,
  dispatch,
}: {
  plan: Plan;
  dispatch: (action: Action) => void;
}) {
  const [category, setCategory] = useState<Category>('catering');
  const [pasted, setPasted] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const ai = useAiCall((options: RequestOptions, text: string, category: Category) =>
    extractQuote(text, category, options),
  );

  const result = ai.state.status === 'done' ? { ...ai.state.data, category } : null;
  const full = plan.quotes.filter((q) => q.category === category).length >= MAX_QUOTES_PER_CATEGORY;

  const analyze = () => {
    setSaved(null);
    return ai.run(pasted, category);
  };

  function save(quote: Quote, accept: boolean) {
    dispatch({ type: 'addQuote', quote, id: newId(), accept });
    setSaved(
      accept
        ? 'Quotation accepted. This category now shows a verified quotation.'
        : 'Saved for comparison.',
    );
    ai.reset();
    setPasted('');
  }

  return (
    <section className="card shadow-card" aria-labelledby="analyze-h">
      <div className="flex items-center justify-between border-b border-line pb-3.5">
        <div>
          <h2 id="analyze-h" className="font-display text-lg font-bold text-ink">
            Analyze Vendor Quotation
          </h2>
          <p className="hint">
            Paste WhatsApp messages, quotes, or PDF text. GenAI extracts pricing, inclusions, and
            fine print.
          </p>
        </div>
        <span className="badge-estimate">AI Contract Parser</span>
      </div>

      <div className="mt-4 grid gap-4">
        <div>
          <label htmlFor="quote-cat" className="label">
            What is this quotation for?
          </label>
          <select
            id="quote-cat"
            className="input font-semibold"
            value={category}
            onChange={(e) => {
              const picked = CategorySchema.safeParse(e.target.value);
              if (picked.success) setCategory(picked.data);
            }}
          >
            {QUOTE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(plan.occasion, c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="quote-text" className="label">
            Quotation text
          </label>
          <textarea
            id="quote-text"
            className="input min-h-36 text-sm leading-relaxed"
            maxLength={6000}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Paste vendor message or raw quotation text here…"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-ink-soft">
            <span>Supports Hindi, English, and Hinglish quotes</span>
            <span>{pasted.length}/6000 characters</span>
          </div>
        </div>
        <div>
          <button
            type="button"
            className="btn-primary w-full shadow-sm sm:w-auto"
            disabled={pasted.trim() === '' || ai.state.status === 'loading'}
            onClick={() => void analyze()}
          >
            <Icon name="sparkle" className="h-4 w-4" />
            Analyze quotation
          </button>
        </div>
      </div>

      <div aria-live="polite" className="mt-4">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is reading the quotation…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void analyze()} />
        )}
        {ai.state.status === 'done' && <AnswerMeta progress={ai.progress} />}
        {saved && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-ok/30 bg-ok-soft p-3 text-sm font-semibold text-ok">
            <Icon name="check" className="h-4 w-4" />
            {saved}
          </div>
        )}
      </div>

      {result && (
        <QuoteResult
          quote={result}
          plan={plan}
          full={full}
          onSave={(accept) => save(result, accept)}
        />
      )}
    </section>
  );
}
