import { useState, type FormEvent } from 'react';
import { localAnswer, planFacts } from '../engine';
import type { ChatTurn, Plan } from '../schemas';
import { askPlanner, type RequestOptions } from '../lib/api';
import { useAiCall } from '../lib/useAiCall';
import { Icon } from './Icon';
import { AnswerMeta } from './ThinkingTrace';
import { AiLoading } from './ui';

interface Turn extends ChatTurn {
  source?: 'ai' | 'local';
}

const SUGGESTIONS = [
  'What should I do next?',
  'Are we over budget?',
  'Which vendors are still pending?',
  'How do I politely negotiate with the caterer?',
];

/** Lets the family ask anything about their plan. Every answer is grounded in the plan's facts. */
export function AskPlanner({ plan, today }: { plan: Plan; today: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const ai = useAiCall((options: RequestOptions, request: Parameters<typeof askPlanner>[0]) =>
    askPlanner(request, options),
  );
  const busy = ai.state.status === 'loading';

  async function ask(question: string) {
    const text = question.trim().slice(0, 500);
    if (!text || busy) return;
    const history = turns.slice(-8).map(({ role, text: t }) => ({ role, text: t.slice(0, 1200) }));
    setTurns((current) => [...current, { role: 'user', text }]);
    setDraft('');
    const result = await ai.run({ question: text, history, facts: planFacts(plan, today) });
    const reply: Turn = result
      ? { role: 'assistant', text: result.answer, source: 'ai' }
      : { role: 'assistant', text: localAnswer(text, plan, today), source: 'local' };
    setTurns((current) => [...current, reply]);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <section className="mt-6 border-t border-line/80 pt-5" aria-labelledby="ask-h">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id="ask-h"
          className="flex items-center gap-2 font-display text-base font-bold text-ink"
        >
          <Icon name="mail" className="h-4 w-4 text-accent" />
          Ask the planner
        </h3>
        {turns.length > 0 && (
          <button
            type="button"
            className="btn-quiet !min-h-8 text-xs font-semibold"
            onClick={() => setTurns([])}
          >
            New conversation
          </button>
        )}
      </div>
      <p className="hint">
        Ask in English or Hinglish. Answers use your plan&apos;s real numbers, never invented ones.
      </p>

      <div role="log" aria-live="polite" aria-label="Conversation" className="mt-3.5 space-y-3">
        {turns.map((turn, index) => {
          const isUser = turn.role === 'user';
          return (
            <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'rounded-tr-xs bg-accent text-on-accent'
                    : 'rounded-tl-xs border border-line bg-paper text-ink'
                }`}
              >
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-85">
                  {turn.role === 'user'
                    ? 'You'
                    : turn.source === 'ai'
                      ? 'Assistant (Gemini)'
                      : 'Assistant (built-in planner, AI unavailable)'}
                </div>
                <p className="whitespace-pre-line">{turn.text}</p>
                {turn.source === 'ai' && index === turns.length - 1 && !busy && (
                  <div className="mt-2 border-t border-line/40 pt-1.5">
                    <AnswerMeta progress={ai.progress} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {busy && (
        <div className="mt-3">
          <AiLoading label="Gemini is thinking about your plan…" progress={ai.progress} />
        </div>
      )}

      {turns.length === 0 && (
        <div role="group" className="mt-3 flex flex-wrap gap-2" aria-label="Suggested questions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="btn-secondary !min-h-9 rounded-full !px-3 !py-1 text-xs font-semibold hover:border-accent hover:text-accent"
              disabled={busy}
              onClick={() => void ask(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form className="mt-4 flex gap-2" onSubmit={submit}>
        <label htmlFor="ask-input" className="sr-only">
          Your question
        </label>
        <input
          id="ask-input"
          className="input text-sm"
          maxLength={500}
          autoComplete="off"
          placeholder="Kitna kharcha bacha hai? What should we book first?"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary shrink-0 !min-h-11 shadow-sm"
          disabled={busy || !draft.trim()}
        >
          Ask
        </button>
      </form>
    </section>
  );
}
