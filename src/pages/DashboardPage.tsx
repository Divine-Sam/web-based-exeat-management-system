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

const statCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  transition: 'all 0.2s',
  cursor: 'pointer',
  textDecoration: 'none',
};

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  to?: string;
  sub?: string;
}

function StatCardItem({ card }: { card: StatCard }) {
  const content = (
    <>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {card.icon}
      </div>
      <div style={{ fontSize: '24px', fontWeight: '500', color: '#fff', marginTop: '4px' }}>{card.value}</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{card.label}</div>
      {card.sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{card.sub}</div>}
      {card.to && <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '4px' }}>View →</div>}
    </>
  );

  if (card.to) {
    return (
      <Link to={card.to} style={{ ...statCardStyle, background: card.gradient }}>
        {content}
      </Link>
    );
  }

  return (
    <div style={{ ...statCardStyle, background: card.gradient }}>
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
  const firstName = user?.profile.full_name.split(' ')[0];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">

        {/* Welcome Banner */}
        <div
          className="rounded-2xl p-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 60%, #f97316 100%)' }}
        >
          <div>
            <h2 className="text-lg font-medium text-white">{getGreeting()}, {firstName} 👋</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {role === 'student'    && `Crawford No: ${user?.profile.crawford_number} · Session: ${stats.session}`}
              {role === 'hall_admin' && today}
              {role === 'dean'       && today}
              {role === 'security'   && 'Manage student check-in and check-out'}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-base flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.4)' }}
          >
            {firstName?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* ── STUDENT ── */}
        {role === 'student' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCardItem card={{ label: 'Total This Session', value: n('total'), icon: <FileText className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)', iconBg: 'rgba(255,255,255,0.2)', to: '/requests' }} />
              <StatCardItem card={{ label: 'Pending Review', value: n('pending'), icon: <Clock className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', iconBg: 'rgba(255,255,255,0.2)', to: '/requests?status=pending' }} />
              <StatCardItem card={{ label: 'Approved', value: n('approved'), icon: <CheckCircle className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#059669,#10b981)', iconBg: 'rgba(255,255,255,0.2)', to: '/requests?status=approved' }} />
              <StatCardItem card={{ label: 'Rejected', value: n('rejected'), icon: <XCircle className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#dc2626,#f43f5e)', iconBg: 'rgba(255,255,255,0.2)', to: '/requests?status=rejected' }} />
            </div>

            {/* Session Limit */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">Session limit</span>
                <span className="text-sm font-medium" style={{ background: 'linear-gradient(90deg,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {n('total')} / 5 used
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '99px', height: '7px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: '99px',
                  width: `${Math.min(100, (n('total') / 5) * 100)}%`,
                  background: n('total') >= 5 ? 'linear-gradient(90deg,#dc2626,#f43f5e)' : n('total') >= 3 ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#7c3aed,#ec4899)',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {n('remaining') > 0 ? `${n('remaining')} request(s) remaining this session` : 'Session limit reached — no more requests can be submitted'}
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/requests/new"
                className="flex items-center justify-between rounded-2xl p-5 group"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', textDecoration: 'none' }}
              >
                <div>
                  <p className="font-medium text-white text-sm">New exeat request</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Submit a new leave request</p>
                </div>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/requests"
                className="flex items-center justify-between rounded-2xl p-5 group"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}
              >
                <div>
                  <p className="font-medium text-white text-sm">My requests</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Track all your submissions</p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" style={{ color: 'rgba(255,255,255,0.3)' }} />
              </Link>
            </div>
          </>
        )}

        {/* ── HALL ADMIN ── */}
        {role === 'hall_admin' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCardItem card={{ label: 'Requests Today', value: n('todayTotal'), icon: <FileText className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)', iconBg: 'rgba(255,255,255,0.2)', to: '/admin/requests?status=PENDING_HALL_ADMIN', sub: 'New pending requests today' }} />
              <StatCardItem card={{ label: 'Pending Your Review', value: n('pendingHallAdmin'), icon: <Clock className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', iconBg: 'rgba(255,255,255,0.2)', to: '/admin/requests?status=PENDING_HALL_ADMIN', sub: 'Awaiting your action' }} />
              <StatCardItem card={{ label: 'Awaiting Dean', value: n('pendingDean'), icon: <Users className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)', iconBg: 'rgba(255,255,255,0.2)', to: '/admin/requests?status=APPROVED_BY_HALL_ADMIN', sub: 'Approved by you · pending dean' }} />
            </div>
            <Link to="/admin/requests" className="flex items-center justify-between rounded-2xl p-5 group" style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', textDecoration: 'none' }}>
              <div>
                <p className="font-medium text-white text-sm">Review Pending Requests</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{n('pendingHallAdmin')} request(s) pending your review</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </Link>
          </>
        )}

        {/* ── DEAN ── */}
        {role === 'dean' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCardItem card={{ label: 'Requests Today', value: n('todayTotal'), icon: <FileText className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)', iconBg: 'rgba(255,255,255,0.2)', to: '/admin/requests?status=APPROVED_BY_HALL_ADMIN', sub: 'Requests awaiting your approval' }} />
              <StatCardItem card={{ label: 'Pending Your Approval', value: n('pendingDean'), icon: <Clock className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', iconBg: 'rgba(255,255,255,0.2)', to: '/admin/requests?status=APPROVED_BY_HALL_ADMIN', sub: 'Awaiting your final decision' }} />
              <StatCardItem card={{ label: 'Total Approved', value: n('totalApproved'), icon: <CheckCircle className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#059669,#10b981)', iconBg: 'rgba(255,255,255,0.2)', to: '/admin/requests?status=APPROVED_FINAL', sub: 'All fully approved requests' }} />
            </div>
            <Link to="/admin/requests" className="flex items-center justify-between rounded-2xl p-5 group" style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', textDecoration: 'none' }}>
              <div>
                <p className="font-medium text-white text-sm">Review Pending Requests</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{n('pendingDean')} request(s) awaiting your final approval</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </Link>
          </>
        )}

        {/* ── SECURITY ── */}
        {role === 'security' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCardItem card={{ label: 'Total Requests', value: n('total'), icon: <FileText className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)', iconBg: 'rgba(255,255,255,0.2)', sub: 'All requests in system' }} />
              <StatCardItem card={{ label: 'Ready for Check-Out', value: n('approvedFinal'), icon: <AlertCircle className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', iconBg: 'rgba(255,255,255,0.2)', to: '/security/requests?status=APPROVED_FINAL', sub: 'Approved, awaiting exit' }} />
              <StatCardItem card={{ label: 'Currently Out', value: n('checkedOut'), icon: <Shield className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#dc2626,#f43f5e)', iconBg: 'rgba(255,255,255,0.2)', to: '/security/requests?status=CHECKED_OUT', sub: 'Students outside campus' }} />
              <StatCardItem card={{ label: 'Checked In', value: n('checkedIn'), icon: <CheckCircle className="w-4 h-4 text-white" />, gradient: 'linear-gradient(135deg,#059669,#10b981)', iconBg: 'rgba(255,255,255,0.2)', to: '/security/requests?status=CHECKED_IN', sub: 'Students returned' }} />
            </div>
            <Link to="/security/requests" className="flex items-center justify-between rounded-2xl p-5 group" style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', textDecoration: 'none' }}>
              <div>
                <p className="font-medium text-white text-sm">Security Desk</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Process check-ins and check-outs</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </Link>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}