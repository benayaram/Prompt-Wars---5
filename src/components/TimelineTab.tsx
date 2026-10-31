import { useMemo } from 'react';
import {
  affectedByDelays,
  buildSchedule,
  compressTasks,
  scheduleCompression,
  diffDays,
  phaseFor,
  timelineToIcs,
  ScheduleError,
  type ScheduledTask,
} from '../engine';
import type { Plan } from '../schemas';
import { downloadText } from '../lib/download';
import { formatDate } from '../lib/format';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { RunSheet } from './RunSheet';
import { TaskRow } from './TaskRow';

const EMPTY: ScheduledTask[] = [];

export function TimelineTab({
  plan,
  today,
  dispatch,
}: {
  plan: Plan;
  today: string;
  dispatch: (action: Action) => void;
}) {
  const result = useMemo(() => {
    try {
      return { schedule: buildSchedule(plan.tasks, plan.eventDate, today), error: null };
    } catch (error) {
      return {
        schedule: EMPTY,
        error: (error as ScheduleError).message,
      };
    }
  }, [plan.tasks, plan.eventDate, today]);
  const affected = useMemo(() => {
    try {
      return affectedByDelays(compressTasks(plan.tasks, plan.eventDate, today));
    } catch {
      return {};
    }
  }, [plan.tasks, plan.eventDate, today]);
  const compression = useMemo(
    () => scheduleCompression(plan.tasks, plan.eventDate, today),
    [plan.tasks, plan.eventDate, today],
  );
  const titles = useMemo(
    () => Object.fromEntries(plan.tasks.map((t) => [t.id, t.title])),
    [plan.tasks],
  );

  const groups = useMemo(() => {
    const map = new Map<number, { label: string; tasks: ScheduledTask[] }>();
    for (const task of result.schedule) {
      const phase = phaseFor(task.leadDays);
      const group = map.get(phase.order) ?? { label: phase.label, tasks: [] };
      group.tasks.push(task);
      map.set(phase.order, group);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([order, g]) => ({ order, ...g }));
  }, [result.schedule]);

  const daysToEvent = diffDays(today, plan.eventDate);
  const problems = result.schedule.filter(
    (t) => t.status !== 'done' && (t.flags.atRisk || t.flags.overdue || t.flags.impossible),
  ).length;

  if (result.error) {
    return (
      <div role="alert" className="card border-warn/40 bg-warn-soft p-5 text-warn shadow-sm">
        <p className="flex items-center gap-2 font-bold">
          <Icon name="alert" className="h-5 w-5" />
          {result.error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card shadow-card" aria-labelledby="tl-h">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 id="tl-h" className="font-display text-xl font-bold text-ink">
              Your Connected Timeline
            </h2>
            <p className="mt-1 text-sm font-medium text-ink">
              Event on <strong>{formatDate(plan.eventDate)}</strong>
              {daysToEvent > 0
                ? ` · ${daysToEvent} days to go`
                : daysToEvent === 0
                  ? ' · today'
                  : ' · this date has passed'}
            </p>
            <p className="hint">
              Delay a task and all downstream dependencies shift automatically.
            </p>
          </div>
          <div
            role="status"
            aria-live="polite"
            className="text-sm font-semibold [&>span]:flex [&>span]:items-center [&>span]:gap-1.5"
          >
            {problems > 0 ? (
              <span className="rounded-full border border-warn/30 bg-warn-soft px-3 py-1 text-warn shadow-xs">
                <Icon name="alert" className="h-4 w-4" />
                {problems} {problems === 1 ? 'task needs' : 'tasks need'} attention
              </span>
            ) : (
              <span className="rounded-full border border-ok/30 bg-ok-soft px-3 py-1 text-ok shadow-xs">
                <Icon name="check" className="h-4 w-4" />
                On track
              </span>
            )}
          </div>
        </div>

        {compression.compressed && (
          <div
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-accent/25 bg-accent-soft p-3.5 text-sm text-ink"
            data-testid="compressed-note"
          >
            <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>
              Your event is {compression.availableDays} days away, sooner than the usual{' '}
              {compression.spanDays}-day plan, so every task has been pulled closer in the same
              order. Dates are tighter than usual.
            </span>
          </div>
        )}

        <div className="mt-4">
          <button
            type="button"
            className="btn-secondary !min-h-10 text-xs font-semibold sm:text-sm"
            onClick={() =>
              downloadText(
                `utsaviq-${plan.occasion}-${plan.eventDate}.ics`,
                timelineToIcs(plan, result.schedule, today),
                'text/calendar;charset=utf-8',
              )
            }
          >
            <Icon name="calendar" className="h-4 w-4 text-accent" />
            Add timeline to calendar (.ics)
          </button>
        </div>
      </section>

      {groups.map((g) => (
        <section key={g.order} aria-labelledby={`phase-${g.order}`} className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <h3
              id={`phase-${g.order}`}
              className="font-display text-lg font-bold tracking-tight text-ink"
            >
              {g.label}
            </h3>
          </div>
          <ul className="relative space-y-4 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-0.5 before:bg-line/80 before:content-['']">
            {g.tasks.map((task) => {
              const cause = affected[task.id];
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  occasion={plan.occasion}
                  titles={titles}
                  pushedBy={cause ? titles[cause] : null}
                  onStatus={(id, status) => dispatch({ type: 'setTaskStatus', id, status })}
                  onDelay={(id, days) => dispatch({ type: 'setDelay', id, days })}
                  onAssignee={(id, assignee) => dispatch({ type: 'setAssignee', id, assignee })}
                />
              );
            })}
          </ul>
        </section>
      ))}

      <RunSheet occasion={plan.occasion} />
    </div>
  );
}
