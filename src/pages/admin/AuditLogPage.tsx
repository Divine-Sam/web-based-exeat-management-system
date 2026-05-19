import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { getAuditLogs } from '../../services/requestService';
import { AuditLog } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Search, Activity } from 'lucide-react';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  REQUEST_CREATED: { label: 'Request Created', color: 'bg-blue-100 text-blue-700' },
  REQUEST_EDITED: { label: 'Request Edited', color: 'bg-slate-100 text-slate-700' },
  REQUEST_CANCELLED: { label: 'Request Cancelled', color: 'bg-slate-100 text-slate-500' },
  HALL_ADMIN_APPROVED: { label: 'Hall Admin Approved', color: 'bg-amber-100 text-amber-700' },
  HALL_ADMIN_REJECTED: { label: 'Hall Admin Rejected', color: 'bg-red-100 text-red-600' },
  DEAN_APPROVED: { label: 'Dean Approved', color: 'bg-emerald-100 text-emerald-700' },
  DEAN_REJECTED: { label: 'Dean Rejected', color: 'bg-red-100 text-red-600' },
  CHECKED_OUT: { label: 'Checked Out', color: 'bg-violet-100 text-violet-700' },
  CHECKED_IN: { label: 'Checked In', color: 'bg-slate-100 text-slate-700' },
};

export function AuditLogPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getAuditLogs();
        setLogs(data as AuditLog[]);
      } catch {
        showToast('Failed to load audit logs.', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = logs.filter(log => {
    const s = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      log.profiles?.full_name?.toLowerCase().includes(s) ||
      log.profiles?.crawford_number?.toLowerCase().includes(s)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Audit Logs</h2>
          <p className="text-sm text-slate-500">Complete history of all system actions</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, action..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">No audit logs found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Timestamp</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Status Change</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(log => {
                    const config = ACTION_LABELS[log.action] ?? { label: log.action, color: 'bg-slate-100 text-slate-600' };
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-xs text-slate-600">{new Date(log.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-slate-800">{log.profiles?.full_name ?? '—'}</p>
                          <p className="text-xs text-slate-400">{log.profiles?.crawford_number ?? '—'}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                            {config.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          {log.old_status || log.new_status ? (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              {log.old_status && <span className="px-1.5 py-0.5 bg-slate-100 rounded">{log.old_status.replace(/_/g, ' ')}</span>}
                              {log.old_status && log.new_status && <span>→</span>}
                              {log.new_status && <span className="px-1.5 py-0.5 bg-slate-100 rounded">{log.new_status.replace(/_/g, ' ')}</span>}
                            </div>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <p className="text-xs text-slate-500 max-w-xs truncate">{log.notes ?? '—'}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
