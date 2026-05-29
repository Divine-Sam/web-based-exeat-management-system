import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Search } from 'lucide-react';

interface AuditEntry {
  _id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
  user_id: { full_name: string; crawford_number: string; role: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
  REQUEST_CREATED:      'bg-blue-100 text-blue-700',
  HALL_ADMIN_APPROVED:  'bg-emerald-100 text-emerald-700',
  HALL_ADMIN_REJECTED:  'bg-red-100 text-red-700',
  DEAN_APPROVED:        'bg-emerald-100 text-emerald-700',
  DEAN_REJECTED:        'bg-red-100 text-red-700',
  CHECKED_OUT:          'bg-amber-100 text-amber-700',
  CHECKED_IN:           'bg-teal-100 text-teal-700',
  REQUEST_CANCELLED:    'bg-slate-100 text-slate-600',
  REQUEST_EDITED:       'bg-purple-100 text-purple-700',
};

export function SuperAdminAuditPage() {
  const { showToast } = useToast();
  const [logs, setLogs]     = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<AuditEntry[]>('/superadmin/audit')
      .then(setLogs)
      .catch(() => showToast('Failed to load audit logs.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    l.user_id?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_id?.crawford_number?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Audit Logs</h2>
          <p className="text-sm text-slate-500">Full system activity trail — last 200 entries</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, Crawford number or action..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <p className="text-slate-500">No audit logs found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Status Change</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(log => (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-800">{log.user_id?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{log.user_id?.crawford_number ?? '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        {log.notes && <p className="text-xs text-slate-400 mt-1">{log.notes}</p>}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        {log.old_status || log.new_status ? (
                          <p className="text-xs text-slate-500">
                            {log.old_status ?? '—'} → {log.new_status ?? '—'}
                          </p>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}