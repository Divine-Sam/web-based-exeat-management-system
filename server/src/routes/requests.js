import { api } from '../lib/api';
import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  ClipboardList,
  Shield,
  LogOut,
  Menu,
  X,
  Clock,
  CheckCircle,
  ArrowRight,
  Users,
  AlertTriangle,
} from 'lucide-react';

interface StatCard {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
  bg: string;
  sub: string;
  to: string;
}

interface DashboardStats {
  todayTotal: number;
  pendingHallAdmin: number;
  pendingDean: number;
  approvedFinal: number;
  checkedOut: number;
  checkedIn: number;
}

function StatCardItem({ card }: { card: StatCard }) {
  return (
    <Link
      to={card.to}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{card.label}</span>
        <span className={`p-2 rounded-xl ${card.bg}`}>{card.icon}</span>
      </div>
      <div>
        <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
        <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role;

  const [stats, setStats] = useState<DashboardStats>({
    todayTotal: 0,
    pendingHallAdmin: 0,
    pendingDean: 0,
    approvedFinal: 0,
    checkedOut: 0,
    checkedIn: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (role === 'hall_admin' || role === 'dean' || role === 'security') {
      fetchStats();
    }
  }, [role]);

  async function fetchStats() {
    try {
      setLoadingStats(true);
      const data = await api.get('/requests/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoadingStats(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, to: '/dashboard' },
    ...(role === 'student'
      ? [
          { label: 'My Requests', icon: <FileText className="w-4 h-4" />, to: '/requests' },
          { label: 'New Request', icon: <PlusCircle className="w-4 h-4" />, to: '/requests/new' },
        ]
      : []),
    ...(role === 'hall_admin' || role === 'dean'
      ? [{ label: 'All Requests', icon: <ClipboardList className="w-4 h-4" />, to: '/admin/requests' }]
      : []),
    ...(role === 'security'
      ? [{ label: 'Security Gate', icon: <Shield className="w-4 h-4" />, to: '/security' }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-100 shadow-sm flex flex-col transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex`}
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="font-bold text-lg text-gray-800">Exeat Portal</p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{role?.replace('_', ' ')}</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${location.pathname === item.to
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center gap-4">
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">
              Welcome back, {user?.full_name?.split(' ')[0] ?? 'User'}
            </h1>
            <p className="text-xs text-gray-400">{new Date().toDateString()}</p>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-6">

          {/* ── Student view ──────────────────────────────── */}
          {role === 'student' && (
            <div className="flex flex-col gap-4">
              <p className="text-gray-600 text-sm">
                Submit and track your exeat requests below.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/requests/new"
                  className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 transition-colors shadow-sm shadow-blue-200 group"
                >
                  <div>
                    <p className="font-semibold">New Exeat Request</p>
                    <p className="text-blue-200 text-sm mt-0.5">Submit a new leave request</p>
                  </div>
                  <PlusCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </Link>

                <Link
                  to="/requests"
                  className="flex items-center justify-between bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl p-5 transition-colors shadow-sm group"
                >
                  <div>
                    <p className="font-semibold text-gray-800">My Requests</p>
                    <p className="text-gray-400 text-sm mt-0.5">Track your request history</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* ── Hall Admin stats ──────────────────────────── */}
          {role === 'hall_admin' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Requests Today */}
                <StatCardItem card={{
                  label: 'Requests Today',
                  value: stats.todayTotal ?? 0,
                  icon: <FileText className="w-5 h-5 text-blue-600" />,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                  sub: 'New requests received today',
                  to: '/admin/requests?todayOnly=true',
                }} />

                {/* Awaiting Dean */}
                <StatCardItem card={{
                  label: 'Awaiting Dean Approval',
                  value: stats.pendingDean,
                  icon: <Users className="w-5 h-5 text-blue-500" />,
                  color: 'text-blue-500',
                  bg: 'bg-blue-50',
                  sub: 'Approved by you — pending dean',
                  to: '/admin/requests?status=APPROVED_BY_HALL_ADMIN',
                }} />

                {/* Pending Your Review */}
                <StatCardItem card={{
                  label: 'Pending Your Review',
                  value: stats.pendingHallAdmin,
                  icon: <Clock className="w-5 h-5 text-amber-600" />,
                  color: 'text-amber-600',
                  bg: 'bg-amber-50',
                  sub: 'Requests awaiting your action',
                  to: '/admin/requests?status=PENDING_HALL_ADMIN',
                }} />
              </div>

              <Link
                to="/admin/requests?status=PENDING_HALL_ADMIN"
                className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 transition-colors shadow-sm shadow-blue-200 group"
              >
                <div>
                  <p className="font-semibold">Review Pending Requests</p>
                  <p className="text-blue-200 text-sm mt-0.5">
                    {stats.pendingHallAdmin} request(s) pending your review
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </>
          )}

          {/* ── Dean stats ────────────────────────────────── */}
          {role === 'dean' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Requests Today */}
                <StatCardItem card={{
                  label: 'Requests Today',
                  value: stats.todayTotal ?? 0,
                  icon: <FileText className="w-5 h-5 text-blue-600" />,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                  sub: 'New requests received today',
                  to: '/admin/requests?todayOnly=true',
                }} />

                {/* Pending Your Approval */}
                <StatCardItem card={{
                  label: 'Pending Your Approval',
                  value: stats.pendingDean,
                  icon: <Clock className="w-5 h-5 text-amber-600" />,
                  color: 'text-amber-600',
                  bg: 'bg-amber-50',
                  sub: 'Awaiting your final decision',
                  to: '/admin/requests?status=APPROVED_BY_HALL_ADMIN',
                }} />

                {/* Final Approved */}
                <StatCardItem card={{
                  label: 'Final Approved',
                  value: stats.approvedFinal,
                  icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                  sub: 'Fully approved requests',
                  to: '/admin/requests?status=APPROVED_FINAL',
                }} />
              </div>

              <Link
                to="/admin/requests?status=APPROVED_BY_HALL_ADMIN"
                className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 transition-colors shadow-sm shadow-blue-200 group"
              >
                <div>
                  <p className="font-semibold">Review Pending Requests</p>
                  <p className="text-blue-200 text-sm mt-0.5">
                    {stats.pendingDean} request(s) awaiting your final approval
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </>
          )}

          {/* ── Security stats ────────────────────────────── */}
          {role === 'security' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <StatCardItem card={{
                  label: 'Requests Today',
                  value: stats.todayTotal ?? 0,
                  icon: <FileText className="w-5 h-5 text-blue-600" />,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                  sub: 'All requests submitted today',
                  to: '/security?todayOnly=true',
                }} />

                <StatCardItem card={{
                  label: 'Checked Out',
                  value: stats.checkedOut,
                  icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
                  color: 'text-orange-500',
                  bg: 'bg-orange-50',
                  sub: 'Students currently off campus',
                  to: '/security?status=CHECKED_OUT',
                }} />

                <StatCardItem card={{
                  label: 'Fully Approved',
                  value: stats.approvedFinal,
                  icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                  sub: 'Ready for check-out',
                  to: '/security?status=APPROVED_FINAL',
                }} />
              </div>

              <Link
                to="/security"
                className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 transition-colors shadow-sm shadow-blue-200 group"
              >
                <div>
                  <p className="font-semibold">Open Security Gate</p>
                  <p className="text-blue-200 text-sm mt-0.5">
                    Scan or search students for check-in / check-out
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </>
          )}

        </main>
      </div>
    </div>
  );
}