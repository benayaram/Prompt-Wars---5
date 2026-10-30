import { useEffect, useRef } from 'react';
import { planReadiness, vendorChecklist, VENDOR_STATUS_LABELS } from '../engine';
import type { Plan } from '../schemas';
import { Icon } from './Icon';

const TASK_LABEL = { todo: 'To do', done: 'Done', delayed: 'Delayed' } as const;

function Tick({ done, warn = false }: { done: boolean; warn?: boolean }) {
  return done ? (
    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
  ) : (
    <Icon
      name={warn ? 'alert' : 'circle'}
      className={`mt-0.5 h-4 w-4 shrink-0 ${warn ? 'text-warn' : 'text-ink-soft'}`}
    />
  );
}

/**
 * Modern drawer tracking tasks and vendor confirmations in one place.
 * Accessible from any tab.
 */
export function ProgressPanel({
  plan,
  open,
  onToggle,
  onNavigate,
}: {
  plan: Plan;
  open: boolean;
  onToggle: () => void;
  onNavigate: (tab: 'timeline' | 'vendors') => void;
}) {
  const readiness = planReadiness(plan);
  const vendors = vendorChecklist(plan);
  const tasks = [...plan.tasks].sort(
    (a, b) => Number(a.status === 'done') - Number(b.status === 'done'),
  );
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggle();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onToggle]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
    else if (wasOpen.current) toggleRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className="no-print fixed bottom-5 left-5 z-40 flex min-h-11 items-center gap-2 rounded-full border border-line bg-card/95 px-4 py-2 text-sm font-bold text-ink shadow-elevated backdrop-blur-md transition-all hover:scale-105 hover:border-accent hover:text-accent"
        aria-expanded={open}
        aria-controls="progress-panel"
        onClick={onToggle}
      >
        <Icon name="route" className="h-4 w-4 text-accent" />
        Progress {readiness.percent}%
      </button>

      <aside
        id="progress-panel"
        aria-label="Plan progress"
        hidden={!open}
        className={`no-print fixed inset-y-0 left-0 z-50 ${open ? 'flex' : 'hidden'} w-[min(24rem,100vw)] flex-col border-r border-line bg-card shadow-2xl`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line bg-paper/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-ink">Plan progress</h2>
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">
              {readiness.percent}%
            </span>
          </div>
          <button ref={closeRef} type="button" className="btn-secondary !min-h-9 !px-2.5 !py-1 text-xs" onClick={onToggle}>
            <Icon name="x" className="h-4 w-4" />
            Hide
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <div className="rounded-2xl border border-line bg-paper/50 p-4">
            <p className="text-sm font-semibold text-ink">
              <strong>{readiness.percent}% ready.</strong> {readiness.tasksDone} of{' '}
              {readiness.tasksTotal} tasks done, {readiness.quotesVerified} of {readiness.quotesTotal}{' '}
              vendors confirmed.
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dark transition-all duration-300"
                style={{ width: `${readiness.percent}%` }}
              />
            </div>
          </div>

          <section aria-labelledby="progress-vendors">
            <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
              <h3 id="progress-vendors" className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                Vendors and quotations
              </h3>
              <button type="button" className="btn-quiet !min-h-7 !px-2 text-xs font-semibold" onClick={() => onNavigate('vendors')}>
                Open
              </button>
            </div>
            <ul className="mt-3 space-y-2.5">
              {vendors.map((item) => (
                <li key={item.category} className="flex items-start gap-2.5 rounded-xl border border-line/60 bg-paper/40 p-2.5 text-sm">
                  <Tick done={item.status === 'quote_accepted'} />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-ink">{item.label}</span>
                    <span className="block text-xs font-medium text-ink-soft">
                      {VENDOR_STATUS_LABELS[item.status]}
                      {item.quotes > 0 && ` · ${item.quotes} saved`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="progress-tasks">
            <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
              <h3 id="progress-tasks" className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                Timeline tasks
              </h3>
              <button type="button" className="btn-quiet !min-h-7 !px-2 text-xs font-semibold" onClick={() => onNavigate('timeline')}>
                Open
              </button>
            </div>
            <ul className="mt-3 space-y-2.5">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-start gap-2.5 rounded-xl border border-line/60 bg-paper/40 p-2.5 text-sm">
                  <Tick done={task.status === 'done'} warn={task.status === 'delayed'} />
                  <span className="min-w-0 flex-1">
                    <span className={`font-semibold ${task.status === 'done' ? 'text-ink-soft line-through' : 'text-ink'}`}>
                      {task.title}
                    </span>
                    <span className="block text-xs font-medium text-ink-soft">{TASK_LABEL[task.status]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </>
  );
}
