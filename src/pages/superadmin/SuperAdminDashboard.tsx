import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Users, FileText, CheckCircle, Clock, Shield, XCircle, ArrowRight, UserCog } from 'lucide-react';

interface Stats {
  totalUsers: number; students: number; hallAdmins: number;
  deans: number; security: number; totalRequests: number;
  todayRequests: number; pending: number; approvedFinal: number;
  checkedOut: number; checkedIn: number; rejected: number;
}

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Stats>('/superadmin/stats')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold">Super Admin Dashboard</h2>
          <p className="text-purple-200 text-sm mt-1">Full system overview and management</p>
        </div>

        {/* User Stats */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Users</h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Users',  value: stats?.totalUsers,  color: 'text-purple-600', bg: 'bg-purple-50', icon: <Users className="w-5 h-5 text-purple-600" /> },
              { label: 'Students',     value: stats?.students,    color: 'text-blue-600',   bg: 'bg-blue-50',   icon: <Users className="w-5 h-5 text-blue-600" /> },
              { label: 'Hall Admins',  value: stats?.hallAdmins,  color: 'text-amber-600',  bg: 'bg-amber-50',  icon: <UserCog className="w-5 h-5 text-amber-600" /> },
              { label: 'Deans',        value: stats?.deans,       color: 'text-emerald-600',bg: 'bg-emerald-50',icon: <UserCog className="w-5 h-5 text-emerald-600" /> },
              { label: 'Security',     value: stats?.security,    color: 'text-red-600',    bg: 'bg-red-50',    icon: <Shield className="w-5 h-5 text-red-600" /> },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{c.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value ?? 0}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center`}>{c.icon}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Request Stats */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Requests</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total',        value: stats?.totalRequests, color: 'text-slate-700',  bg: 'bg-slate-50',   icon: <FileText className="w-5 h-5 text-slate-600" /> },
              { label: 'Today',        value: stats?.todayRequests, color: 'text-blue-600',   bg: 'bg-blue-50',    icon: <Clock className="w-5 h-5 text-blue-600" /> },
              { label: 'Pending',      value: stats?.pending,       color: 'text-amber-600',  bg: 'bg-amber-50',   icon: <Clock className="w-5 h-5 text-amber-600" /> },
              { label: 'Rejected',     value: stats?.rejected,      color: 'text-red-600',    bg: 'bg-red-50',     icon: <XCircle className="w-5 h-5 text-red-600" /> },
              { label: 'Approved',     value: stats?.approvedFinal, color: 'text-emerald-600',bg: 'bg-emerald-50', icon: <CheckCircle className="w-5 h-5 text-emerald-600" /> },
              { label: 'Checked Out',  value: stats?.checkedOut,    color: 'text-orange-600', bg: 'bg-orange-50',  icon: <Shield className="w-5 h-5 text-orange-600" /> },
              { label: 'Checked In',   value: stats?.checkedIn,     color: 'text-teal-600',   bg: 'bg-teal-50',    icon: <CheckCircle className="w-5 h-5 text-teal-600" /> },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{c.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value ?? 0}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center`}>{c.icon}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/superadmin/users" className="flex items-center justify-between bg-purple-600 hover:bg-purple-700 text-white rounded-2xl p-5 transition-colors group">
            <div><p className="font-semibold">Manage Users</p><p className="text-purple-200 text-sm mt-0.5">Create, edit, delete accounts</p></div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/superadmin/requests" className="flex items-center justify-between bg-white hover:bg-slate-50 text-slate-700 rounded-2xl p-5 border border-slate-200 transition-colors group">
            <div><p className="font-semibold">All Requests</p><p className="text-slate-400 text-sm mt-0.5">View every exeat request</p></div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-400" />
          </Link>
          <Link to="/superadmin/audit" className="flex items-center justify-between bg-white hover:bg-slate-50 text-slate-700 rounded-2xl p-5 border border-slate-200 transition-colors group">
            <div><p className="font-semibold">Audit Logs</p><p className="text-slate-400 text-sm mt-0.5">Full system activity trail</p></div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-400" />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}