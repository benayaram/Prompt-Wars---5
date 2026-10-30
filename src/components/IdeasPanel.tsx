import { useState } from 'react';
import { budgetTier } from '../engine';
import type { Plan } from '../schemas';
import { suggestIdeas, type RequestOptions } from '../lib/api';
import { useAiCall } from '../lib/useAiCall';
import { Icon } from './Icon';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading } from './ui';

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-paper/50 p-4 shadow-2xs">
      <h4 className="font-bold text-ink">{title}</h4>
      <ul className="mt-2 space-y-1.5 text-xs text-ink-soft sm:text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function IdeasPanel({ plan }: { plan: Plan }) {
  const [round, setRound] = useState(0);
  const ai = useAiCall((options: RequestOptions, request: Parameters<typeof suggestIdeas>[0]) =>
    suggestIdeas(request, options),
  );

  const generate = () => {
    setRound((r) => r + 1);
    return ai.run({
      occasion: plan.occasion,
      vibe: plan.vibe,
      guests: plan.guests,
      budgetTier: budgetTier(plan),
      nonNegotiables: plan.priorities,
      variation: round,
    });
  };

  const data = ai.state.status === 'done' ? ai.state.data : null;

  return (
    <section className="card shadow-card" aria-labelledby="ideas-h">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3.5">
        <div>
          <h2 id="ideas-h" className="font-display text-lg font-bold text-ink">
            Ideas for your celebration
          </h2>
          <p className="hint">
            AI suggestions · no prices. Tuned to your occasion, style and guest count.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary !min-h-10 text-xs font-semibold sm:text-sm"
          onClick={() => void generate()}
          disabled={ai.state.status === 'loading'}
        >
          <Icon name="sparkle" className="h-4 w-4 text-accent" />
          {data ? 'Regenerate ideas' : 'Get ideas'}
        </button>
      </div>

      <div aria-live="polite" className="mt-4">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is thinking up ideas…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void generate()} />
        )}
        {data && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Celebration Themes</h3>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {data.themes.map((t) => (
                  <li key={t.title} className="rounded-2xl border border-line bg-card p-4 shadow-xs">
                    <p className="font-bold text-ink">{t.title}</p>
                    <p className="mt-1 text-xs text-ink-soft sm:text-sm">{t.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <List title="Activities" items={data.activities} />
              <List title="Food style" items={data.foodStyle} />
              <List title="Personal touches" items={data.personalTouches} />
            </div>

            <figure className="rounded-2xl border border-accent/25 bg-accent-soft p-5 shadow-xs">
              <figcaption className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                <Icon name="mail" className="h-4 w-4" />
                Invitation Line
              </figcaption>
              <blockquote className="mt-2 font-display text-base font-semibold italic text-ink sm:text-lg">
                {data.invitationLine}
              </blockquote>
            </figure>

            <AnswerMeta progress={ai.progress} />
          </div>
        )}
      </div>
    </section>
  );
}
