import type { KeyboardEvent } from 'react';
import type { InitialLoad } from '../state/planStore';
import { Icon, type IconName } from './Icon';

export const TABS = [
  { id: 'setup', label: 'Plan setup', icon: 'pencil' },
  { id: 'budget', label: 'Budget', icon: 'wallet' },
  { id: 'timeline', label: 'Timeline', icon: 'route' },
  { id: 'vendors', label: 'Vendors', icon: 'store' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

export type TabId = (typeof TABS)[number]['id'];

export interface NoticeBannerProps {
  notice: NonNullable<InitialLoad['notice']>;
  onDismiss: () => void;
}

/** Status banner shown on initial load when a shared link is corrupted or updated. */
export function NoticeBanner({ notice, onDismiss }: NoticeBannerProps) {
  return (
    <div
      role="status"
      className={`mb-6 flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm shadow-sm ${
        notice.kind === 'bad_link'
          ? 'border-warn/40 bg-warn-soft text-warn'
          : 'border-line bg-accent-soft text-ink'
      }`}
    >
      <p className="flex items-center font-medium">
        {notice.kind === 'bad_link' && (
          <Icon name="alert" className="mr-2 inline h-4 w-4 shrink-0" />
        )}
        {notice.message}
      </p>
      <button
        type="button"
        className="btn-quiet shrink-0 !min-h-8 !px-2.5 !py-1 text-xs"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  );
}

export interface TabNavProps {
  tab: TabId;
  onSelect: (id: TabId) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  tabRefs: { current: Record<string, HTMLButtonElement | null> };
}

/** Accessible tablist navigation between the main application sections. */
export function TabNav({ tab, onSelect, onKeyDown, tabRefs }: TabNavProps) {
  return (
    <div
      role="tablist"
      aria-label="Plan sections"
      className="mb-6 flex rounded-2xl border border-line bg-card p-1.5 shadow-soft"
    >
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={active}
            aria-controls={`panel-${t.id}`}
            tabIndex={active ? 0 : -1}
            className={`flex min-h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold tracking-wide transition-all duration-200 sm:text-sm ${
              active
                ? 'bg-accent text-on-accent shadow-sm'
                : 'text-ink-soft hover:bg-paper hover:text-ink'
            }`}
            onClick={() => onSelect(t.id)}
            onKeyDown={onKeyDown}
          >
            <Icon
              name={t.icon}
              className={`h-4 w-4 ${active ? 'text-on-accent' : 'text-ink-soft'}`}
            />
            <span className="truncate">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
