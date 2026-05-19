import { RequestStatus } from '../types';

const STATUS_CONFIG: Record<RequestStatus, { label: string; className: string }> = {
  PENDING_HALL_ADMIN: { label: 'Pending Hall Admin', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  APPROVED_BY_HALL_ADMIN: { label: 'Pending Dean', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  REJECTED_BY_HALL_ADMIN: { label: 'Rejected by Hall Admin', className: 'bg-red-100 text-red-700 border border-red-200' },
  APPROVED_FINAL: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  REJECTED_BY_DEAN: { label: 'Rejected by Dean', className: 'bg-red-100 text-red-700 border border-red-200' },
  CHECKED_OUT: { label: 'Checked Out', className: 'bg-violet-100 text-violet-700 border border-violet-200' },
  CHECKED_IN: { label: 'Checked In', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
