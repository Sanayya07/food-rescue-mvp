import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-ink-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card p-10 text-center animate-fadeIn">
      {icon && <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">{icon}</div>}
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      {description && <p className="text-sm text-ink-500 mt-1.5 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-ink-400 gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-brand-500 animate-spin" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-fadeIn">
      {message}
    </div>
  );
}
