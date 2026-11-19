import React from 'react';

export function StatusText({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const colorClass =
    normalized === 'CONFIRMED' || normalized === 'COMPLETED' || normalized === 'RESOLVED' || normalized === 'SENT'
      ? 'text-teal-700'
      : normalized === 'CANCELLED' || normalized === 'URGENT' || normalized === 'FAILED'
      ? 'text-red-700'
      : normalized === 'IN_REVIEW' || normalized === 'RESCHEDULED' || normalized === 'HIGH'
      ? 'text-amber-700'
      : 'text-sky-700';

  const label = normalized
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return <span className={`text-xs font-medium whitespace-nowrap ${colorClass}`}>{label}</span>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
