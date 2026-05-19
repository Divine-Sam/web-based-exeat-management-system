import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { getStudentStats, getAdminStats } from '../services/requestService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  FileText, Clock, CheckCircle, XCircle, ArrowRight,
  Users, Shield, TrendingUp, AlertCircle
} from 'lucide-react';

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

function StatCardItem({ card }: { card: StatCard }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{card.label}</p>
          <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center`}>
          {card.icon}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const role = user?.profile.role;
  const [stats, setStats] = useState<Record<string, number | string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (role === 'student') {
          const s = await getStudentStats(user!.id);
          setStats(s);
        } else {
          const s = await getAdminStats();
          setStats(s);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [role, user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-100">
          <h2 className="text-xl font-bold">Welcome back, {user?.profile.full_name.split(' ')[0]}</h2>
          <p className="text-blue-200 text-sm mt-1">
            {role === 'student' && `Crawford No: ${user?.profile.crawford_number} — Session: ${stats.session}`}
            {role === 'hall_admin' && 'Review and process pending exeat requests'}
            {role === 'dean' && 'Final approval of Hall Admin reviewed requests'}
            {role === 'security' && 'Manage student check-in and check-out'}
          </p>
        </div>

        {/* Student stats */}
        {role === 'student' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCardItem card={{ label: 'Total This Session', value: stats.total as number, icon: <FileText className="w-5 h-5 text-blue-600" />, color: 'text-blue-600', bg: 'bg-blue-50' }} />
              <StatCardItem card={{ label: 'Pending Review', value: stats.pending as number, icon: <Clock className="w-5 h-5 text-amber-600" />, color: 'text-amber-600', bg: 'bg-amber-50' }} />
              <StatCardItem card={{ label: 'Approved', value: stats.approved as number, icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, color: 'text-emerald-600', bg: 'bg-emerald-50' }} />
              <StatCardItem card={{ label: 'Rejected', value: stats.rejected as number, icon: <XCircle className="w-5 h-5 text-red-500" />, color: 'text-red-500', bg: 'bg-red-50' }} />
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Session Limit</h3>
                <span className="text-sm text-slate-500">{stats.total as number} / 5 used</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${(stats.total as number) >= 5 ? 'bg-red-500' : (stats.total as number) >= 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, ((stats.total as number) / 5) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {(stats.remaining as number) > 0
                  ? `${stats.remaining} request(s) remaining this session`
                  : 'Session limit reached — no more requests can be submitted'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/requests/new"
                className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 transition-colors shadow-sm shadow-blue-200 group"
              >
                <div>
                  <p className="font-semibold">New Exeat Request</p>
                  <p className="text-blue-200 text-sm mt-0.5">Submit a new leave request</p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/requests"
                className="flex items-center justify-between bg-white hover:bg-slate-50 text-slate-700 rounded-2xl p-5 border border-slate-200 transition-colors group"
              >
                <div>
                  <p className="font-semibold">View My Requests</p>
                  <p className="text-slate-400 text-sm mt-0.5">Track all your submissions</p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-400" />
              </Link>
            </div>
          </>
        )}

        {/* Hall Admin / Dean stats */}
        {(role === 'hall_admin' || role === 'dean') && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCardItem card={{ label: 'Total Requests', value: stats.total as number, icon: <FileText className="w-5 h-5 text-blue-600" />, color: 'text-blue-600', bg: 'bg-blue-50' }} />
              <StatCardItem card={{ label: 'Pending Hall Admin', value: stats.pendingHallAdmin as number, icon: <Clock className="w-5 h-5 text-amber-600" />, color: 'text-amber-600', bg: 'bg-amber-50' }} />
              <StatCardItem card={{ label: 'Pending Dean', value: stats.pendingDean as number, icon: <Users className="w-5 h-5 text-blue-500" />, color: 'text-blue-500', bg: 'bg-blue-50' }} />
              <StatCardItem card={{ label: 'Final Approved', value: stats.approvedFinal as number, icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, color: 'text-emerald-600', bg: 'bg-emerald-50' }} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCardItem card={{ label: 'Checked Out', value: stats.checkedOut as number, icon: <TrendingUp className="w-5 h-5 text-violet-500" />, color: 'text-violet-500', bg: 'bg-violet-50' }} />
              <StatCardItem card={{ label: 'Checked In', value: stats.checkedIn as number, icon: <CheckCircle className="w-5 h-5 text-slate-500" />, color: 'text-slate-500', bg: 'bg-slate-50' }} />
              <StatCardItem card={{ label: 'Total Rejected', value: stats.rejected as number, icon: <XCircle className="w-5 h-5 text-red-500" />, color: 'text-red-500', bg: 'bg-red-50' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/admin/requests"
                className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 transition-colors shadow-sm shadow-blue-200 group"
              >
                <div>
                  <p className="font-semibold">Review Requests</p>
                  <p className="text-blue-200 text-sm mt-0.5">{stats.pendingHallAdmin as number} pending your review</p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/admin/audit"
                className="flex items-center justify-between bg-white hover:bg-slate-50 text-slate-700 rounded-2xl p-5 border border-slate-200 transition-colors group"
              >
                <div>
                  <p className="font-semibold">Audit Logs</p>
                  <p className="text-slate-400 text-sm mt-0.5">Full action history</p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-400" />
              </Link>
            </div>
          </>
        )}

        {/* Security stats */}
        {role === 'security' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCardItem card={{ label: 'Total Requests', value: stats.total as number, icon: <FileText className="w-5 h-5 text-blue-600" />, color: 'text-blue-600', bg: 'bg-blue-50' }} />
              <StatCardItem card={{ label: 'Ready for Check-Out', value: stats.approvedFinal as number, icon: <AlertCircle className="w-5 h-5 text-amber-600" />, color: 'text-amber-600', bg: 'bg-amber-50' }} />
              <StatCardItem card={{ label: 'Currently Out', value: stats.checkedOut as number, icon: <Shield className="w-5 h-5 text-red-500" />, color: 'text-red-500', bg: 'bg-red-50' }} />
            </div>
            <Link
              to="/security/requests"
              className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 transition-colors shadow-sm shadow-blue-200 group"
            >
              <div>
                <p className="font-semibold">Security Desk</p>
                <p className="text-blue-200 text-sm mt-0.5">Process check-ins and check-outs</p>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
