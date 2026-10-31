import { useMemo, useState } from 'react';
import {
  diffDays,
  planInsights,
  type Insight,
  type InsightSeverity,
  type InsightTab,
} from '../engine';
import type { Plan } from '../schemas';
import { reviewPlan, type RequestOptions } from '../lib/api';
import { useAiCall } from '../lib/useAiCall';
import { AskPlanner } from './AskPlanner';
import { Icon, type IconName } from './Icon';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading } from './ui';

const SEVERITY: Record<
  InsightSeverity,
  { label: string; icon: IconName; tone: string; bg: string }
> = {
  critical: {
    label: 'Urgent',
    icon: 'alert',
    tone: 'text-warn',
    bg: 'bg-warn-soft border-warn/30',
  },
  warning: {
    label: 'Needs attention',
    icon: 'clock',
    tone: 'text-warn',
    bg: 'bg-warn-soft/60 border-warn/25',
  },
  suggestion: {
    label: 'Suggestion',
    icon: 'sparkle',
    tone: 'text-accent',
    bg: 'bg-accent-soft border-accent/25',
  },
};

const TAB_LABEL: Record<InsightTab, string> = {
  budget: 'Budget',
  timeline: 'Timeline',
  vendors: 'Vendors',
};

const COLLAPSED = 3;

function InsightRow({
  insight,
  onNavigate,
}: {
  insight: Insight;
  onNavigate: (tab: InsightTab) => void;
}) {
  const s = SEVERITY[insight.severity];
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3.5 transition-colors hover:bg-paper/40">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${s.bg}`}
        >
          <Icon name={s.icon} className={`h-4 w-4 ${s.tone}`} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-ink">
            <span
              className={`mr-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.tone}`}
            >
              {s.label}
            </span>
            {insight.title}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">{insight.detail}</p>
        </div>
      </div>
      <button
        type="button"
        className="btn-secondary shrink-0 !min-h-9 !px-3 !py-1 text-xs font-semibold"
        onClick={() => onNavigate(insight.tab)}
      >
        Open {TAB_LABEL[insight.tab]}
      </button>
    </li>
  );
}

/**
 * The planning assistant cockpit. The engine decides what needs attention;
 * Gemini turns those facts into a prioritized plain-language review on request.
 */
export function AssistantPanel({
  plan,
  today,
  onNavigate,
}: {
  plan: Plan;
  today: string;
  onNavigate: (tab: InsightTab) => void;
}) {
  const insights = useMemo(() => planInsights(plan, today), [plan, today]);
  const [expanded, setExpanded] = useState(false);
  const ai = useAiCall((options: RequestOptions, request: Parameters<typeof reviewPlan>[0]) =>
    reviewPlan(request, options),
  );
  const shown = expanded ? insights : insights.slice(0, COLLAPSED);
  const urgent = insights.filter((i) => i.severity !== 'suggestion').length;

  const askAi = () =>
    ai.run({
      occasion: plan.occasion,
      guests: plan.guests,
      totalBudget: plan.totalBudget,
      daysToEvent: diffDays(today, plan.eventDate),
      vibe: plan.vibe,
      insights: insights
        .slice(0, 10)
        .map(({ severity, title, detail }) => ({ severity, title, detail })),
    });

  return (
    <section className="card mb-6 shadow-card" aria-labelledby="assistant-h">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <h2
            id="assistant-h"
            className="flex items-center gap-2 font-display text-lg font-bold text-ink"
          >
            <Icon name="sparkle" className="h-5 w-5 text-accent" />
            Your planning assistant
          </h2>
          <p className="hint" aria-live="polite">
            {urgent > 0
              ? `${urgent} ${urgent === 1 ? 'thing needs' : 'things need'} your attention.`
              : 'Nothing urgent. Here is what to do next.'}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary !min-h-10 text-xs shadow-sm sm:text-sm"
          onClick={() => void askAi()}
          disabled={insights.length === 0 || ai.state.status === 'loading'}
        >
          <Icon name="sparkle" className="h-4 w-4" />
          {ai.state.status === 'done' ? 'Refresh AI review' : 'Ask AI for a plan review'}
        </button>
      </div>

      {insights.length === 0 ? (
        <p className="mt-4 flex items-center gap-2.5 text-sm font-semibold text-ok">
          <Icon name="check" className="h-4 w-4" />
          Everything is on track.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-line/70" aria-label="What needs attention">
          {shown.map((insight) => (
            <InsightRow key={insight.id} insight={insight} onNavigate={onNavigate} />
          ))}
        </ul>
      )}

      {insights.length > COLLAPSED && (
        <button
          type="button"
          className="btn-quiet mt-2 !px-2 text-xs font-semibold"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : `Show all ${insights.length}`}
        </button>
      )}

      <div aria-live="polite" className="mt-4">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is reviewing your plan…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void askAi()} />
        )}
        {ai.state.status === 'done' && (
          <div
            className="rounded-2xl border border-accent/25 bg-accent-soft p-5 shadow-sm"
            data-testid="ai-review"
          >
            <p className="text-sm font-medium text-ink leading-relaxed">{ai.state.data.summary}</p>
            <ol className="mt-3.5 space-y-2 border-t border-accent/20 pt-3 text-sm text-ink">
              {ai.state.data.steps.map((step, idx) => (
                <li key={step.title} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-accent">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-ink">{step.title}.</span>{' '}
                    <span className="text-ink-soft">{step.why}</span>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-ink-soft">
              AI review of the facts above. It never adds prices, dates or vendors.
            </p>
            <AnswerMeta progress={ai.progress} />
          </div>
        )}
      </div>
      <AskPlanner plan={plan} today={today} />
    </section>
  );
}
