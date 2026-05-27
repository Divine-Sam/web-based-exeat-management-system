import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { getStudentStats, getAdminStats } from '../services/requestService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  FileText, Clock, CheckCircle, XCircle, ArrowRight,
  Users, Shield, AlertCircle
} from 'lucide-react';

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  to?: string;
  sub?: string;
}

function StatCardItem({ card }: { card: StatCard }) {
  const content = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{card.label}</p>
        <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
        {card.sub && <p className="text-xs text-slate-400 mt-1">{card.sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center`}>
        {card.icon}
      </div>
    </div>
  );

  if (card.to) {
    return (
      <Link
        to={card.to}
        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:scale-[1.02] transition-all cursor-pointer block"
      >
        {content}
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          View requests <ArrowRight className="w-3 h-3" />
        </p>
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      {content}
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

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const n = (key: string): number => (stats[key] as number) ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-100">
          <h2 className="text-xl font-bold">
            Welcome back, {user?.profile.full_name.split(' ')[0]}
          </h2>
          <p className="text-blue-200 text-sm mt-1">
            {role === 'student'    && `Crawford No: ${user?.profile.crawford_number} — Session: ${stats.session}`}
            {role === 'hall_admin' && today}
            {role === 'dean'       && today}
            {role === 'security'   && 'Manage student check-in and check-out'}
          </p>
        </div>

        {/* Student */}
        {role === 'student' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCardItem card={{ label: 'Total This Session', value: n('total'), icon: <FileText className="w-5 h-5 text-blue-600" />, color: 'text-blue-600', bg: 'bg-blue-50', to: '/requests' }} />
              <StatCardItem card={{ label: 'Pending Review', value: n('pending'), icon: <Clock className="w-5 h-5 text-amber-600" />, color: 'text-amber-600', bg: 'bg-amber-50', to: '/requests?status=pending' }} />
              <StatCardItem card={{ label: 'Approved', value: n('approved'), icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, color: 'text-emerald-600', bg: 'bg-emerald-50', to: '/requests?status=approved' }} />
              <StatCardItem card={{ label: 'Rejected', value: n('rejected'), icon: <XCircle className="w-5 h-5 text-red-500" />, color: 'text-red-500', bg: 'bg-red-50', to: '/requests?status=rejected' }} />
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Session Limit</h3>
                <span className="text-sm text-slate-500">{n('total')} / 5 used</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all ${n('total') >= 5 ? 'bg-red-500' : n('total') >= 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (n('total') / 5) * 100)}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {n('remaining') > 0 ? `${n('remaining')} request(s) remaining this session` : 'Session limit reached — no more requests can be submitted'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/requests/new" className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 transition-colors shadow-sm shadow-blue-200 group">
                <div><p className="font-semibold">New Exeat Request</p><p className="text-blue-200 text-sm mt-0.5">Submit a new leave request</p></div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/requests" className="flex items-center justify-between bg-white hover:bg-slate-50 text-slate-700 rounded-2xl p-5 border border-slate-200 transition-colors group">
                <div><p className="font-semibold">View My Requests</p><p className="text-slate-400 text-sm mt-0.5">Track all your submissions</p></div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-400" />
              </Link>
            </div>
          </>
        )}

        {/* Hall Admin */}
        {role === 'hall_admin' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCardItem card={{ label: 'Requests Today', value: n('todayTotal'), icon: <FileText className="w-5 h-5 text-blue-600" />, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'New pending requests today', to: '/admin/requests?status=PENDING_HALL_ADMIN' }} />
              <StatCardItem card={{ label: 'Awaiting Dean Approval', value: n('pendingDean'), icon: <Users className="w-5 h-5 text-blue-500" />, color: 'text-blue-500', bg: 'bg-blue-50', sub: 'Approved by you — pending dean', to: '/admin/requests?status=APPROVED_BY_HALL_ADMIN' }} />
              <StatCardItem card={{ label: 'Pending Your Review', value: n('pendingHallAdmin'), icon: <Clock className="w-5 h-5 text-amber-600" />, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Requests awaiting your action', to: '/admin/requests?status=PENDING_HALL_ADMIN' }} />
            </div>
            <Link to="/admin/requests?status=PENDING_HALL_ADMIN" className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 transition-colors shadow-sm shadow-blue-200 group">
              <div><p className="font-semibold">Review Pending Requests</p><p className="text-blue-200 text-sm mt-0.5">{n('pendingHallAdmin')} request(s) pending your review</p></div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </>
        )}

        {/* Dean */}
        {role === 'dean' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCardItem card={{ label: 'Requests Today', value: n('todayTotal'), icon: <FileText className="w-5 h-5 text-blue-600" />, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Requests awaiting your approval', to: '/admin/requests?status=APPROVED_BY_HALL_ADMIN' }} />
              <StatCardItem card={{ label: 'Pending Your Approval', value: n('pendingDean'), icon: <Clock className="w-5 h-5 text-amber-600" />, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Awaiting your final decision', to: '/admin/requests?status=APPROVED_BY_HALL_ADMIN' }} />
              <StatCardItem card={{ label: 'Total Approved', value: n('totalApproved'), icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'All fully approved requests', to: '/admin/requests?status=APPROVED_FINAL' }} />
            </div>
            <Link to="/admin/requests?status=APPROVED_BY_HALL_ADMIN" className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 transition-colors shadow-sm shadow-blue-200 group">
              <div><p className="font-semibold">Review Pending Requests</p><p className="text-blue-200 text-sm mt-0.5">{n('pendingDean')} request(s) awaiting your final approval</p></div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </>
        )}

        {/* Security */}
        {role === 'security' && (
          <>
            {/* ✅ 4 columns — added Checked In card */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCardItem card={{ label: 'Total Requests', value: n('total'), icon: <FileText className="w-5 h-5 text-blue-600" />, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'All requests in the system' }} />
              <StatCardItem card={{ label: 'Ready for Check-Out', value: n('approvedFinal'), icon: <AlertCircle className="w-5 h-5 text-amber-600" />, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Approved, awaiting exit', to: '/security/requests?status=APPROVED_FINAL' }} />
              <StatCardItem card={{ label: 'Currently Out', value: n('checkedOut'), icon: <Shield className="w-5 h-5 text-red-500" />, color: 'text-red-500', bg: 'bg-red-50', sub: 'Students outside campus', to: '/security/requests?status=CHECKED_OUT' }} />
              {/* ✅ New */}
              <StatCardItem card={{ label: 'Checked In', value: n('checkedIn'), icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Students returned', to: '/security/requests?status=CHECKED_IN' }} />
            </div>
            <Link to="/security/requests" className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 transition-colors shadow-sm shadow-blue-200 group">
              <div><p className="font-semibold">Security Desk</p><p className="text-blue-200 text-sm mt-0.5">Process check-ins and check-outs</p></div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}