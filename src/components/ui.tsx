import { useId, type ReactNode } from 'react';
import type { AiProgress } from '../lib/useAiCall';
import { Icon } from './Icon';
import { LiveThinking } from './ThinkingTrace';

export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export function Field({
  id: fixedId,
  label,
  hint,
  error,
  children,
}: {
  /** Stable id, needed when something else links to this field (an error summary). */
  id?: string;
  label: string;
  hint?: string;
  error?: string | null;
  children: (props: FieldControlProps) => ReactNode;
}) {
  const generated = useId();
  const id = fixedId ?? generated;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && (
        <p id={hintId} className="hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-warn">
          <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function EstimateBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="badge-verified">
      <Icon name="check" className="h-3 w-3" /> Verified quotation
    </span>
  ) : (
    <span className="badge-estimate">Estimate</span>
  );
}

/** Live "Gemini is thinking" panel: a running timer plus the model's own thoughts as they stream in. */
export function AiLoading({ label, progress }: { label: string; progress: AiProgress }) {
  return <LiveThinking label={label} progress={progress} />;
}

export function AiError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm text-warn shadow-sm"
    >
      <div className="flex items-start gap-2.5 font-semibold">
        <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
        <span>{message}</span>
      </div>
      <button
        type="button"
        className="btn-secondary mt-3 border-warn/30 text-warn hover:bg-warn-soft hover:border-warn"
        onClick={onRetry}
      >
        Try again
      </button>
    </div>
  );
}

export function EmptyState({
  title,
  action,
  onAction,
}: {
  title: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center shadow-card sm:py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-sm">
        <Icon name="sparkle" className="h-7 w-7" />
      </div>
      <p className="max-w-md font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
        {title}
      </p>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        Configure your event essentials to unlock dynamic budgeting, intelligent timelines, and vendor comparisons.
      </p>
      <button type="button" className="btn-primary mt-6" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}

/** Inline two-step confirmation (no modal needed, works with keyboards and screen readers). */
export function Confirm({
  prompt,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  prompt: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="group"
      aria-label="Confirm action"
      className="mt-3 rounded-xl border border-line bg-paper/80 p-4 shadow-sm"
    >
      <p className="text-sm font-semibold text-ink">{prompt}</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <button
          type="button"
          className="btn-primary bg-warn text-white hover:bg-warn/90"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
