import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, PlusCircle, ClipboardList, Shield,
  LogOut, Menu, ChevronRight, Bell, Settings
} from 'lucide-react';
import { Role } from '../types';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       path: '/dashboard',        icon: <LayoutDashboard className="w-5 h-5" />, roles: ['student', 'hall_admin', 'dean', 'security'] },
  { label: 'New Request',     path: '/requests/new',     icon: <PlusCircle className="w-5 h-5" />,     roles: ['student'] },
  { label: 'My Requests',     path: '/requests',         icon: <FileText className="w-5 h-5" />,       roles: ['student'] },
  { label: 'Review Requests', path: '/admin/requests',   icon: <ClipboardList className="w-5 h-5" />, roles: ['hall_admin', 'dean'] },
  { label: 'Security Desk',   path: '/security/requests',icon: <Shield className="w-5 h-5" />,        roles: ['security'] },
  // ✅ Audit Logs removed
  { label: 'Account Settings',path: '/account/settings', icon: <Settings className="w-5 h-5" />,    roles: ['student', 'hall_admin', 'dean', 'security'] },
];

const ROLE_LABELS: Record<Role, string> = {
  student:    'Student',
  hall_admin: 'Hall Admin',
  dean:       'Dean',
  security:   'Security',
};

const ROLE_COLORS: Record<Role, string> = {
  student:    'bg-blue-100 text-blue-700',
  hall_admin: 'bg-amber-100 text-amber-700',
  dean:       'bg-emerald-100 text-emerald-700',
  security:   'bg-red-100 text-red-700',
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellCount, setBellCount] = useState(0);
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  const role = user?.profile.role as Role;
  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(role));

  // ✅ Fetch pending count for bell (hall_admin = pendingHallAdmin, dean = pendingDean)
  useEffect(() => {
    if (role !== 'hall_admin' && role !== 'dean') return;

   const fetchBellCount = async () => {
  try {
    const token = localStorage.getItem('exeat_token');  
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/requests/admin/stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (role === 'hall_admin') setBellCount(data.pendingHallAdmin ?? 0);
        if (role === 'dean')       setBellCount(data.pendingDean ?? 0);
      } catch {
        // silently fail
      }
    };

    fetchBellCount();
    const interval = setInterval(fetchBellCount, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, [role]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">Exeat</p>
            <p className="text-xs text-slate-500 leading-tight">Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map(item => {
          const active =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 pt-3 border-t border-slate-100">
        <div className="px-3 py-3 mb-2 bg-slate-50 rounded-xl">
          <p className="text-sm font-semibold text-slate-800 truncate">{user?.profile.full_name}</p>
          <p className="text-xs text-slate-500 truncate mt-0.5">{user?.profile.crawford_number}</p>
          <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>
            {ROLE_LABELS[role]}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 h-full bg-white shadow-xl">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-4 lg:px-6 h-16 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-sm font-medium text-slate-500">
              {visibleNav.find(
                n => location.pathname === n.path || location.pathname.startsWith(n.path + '/')
              )?.label ?? 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3 ml-auto relative">

            {/* ✅ Notification Bell — only for hall_admin and dean */}
            {(role === 'hall_admin' || role === 'dean') && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBellDropdown(prev => !prev);
                    navigate('/admin/requests');
                  }}
                  className="relative p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                  title="Pending requests"
                >
                  <Bell className="w-5 h-5" />
                  {bellCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {bellCount > 99 ? '99+' : bellCount}
                    </span>
                  )}
                </button>

                {/* ✅ Dropdown tooltip */}
                {showBellDropdown && (
                  <div
                    className="absolute right-0 top-11 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4"
                    onMouseLeave={() => setShowBellDropdown(false)}
                  >
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Pending Review
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">
                        {role === 'hall_admin' ? 'Awaiting your approval' : 'Awaiting dean approval'}
                      </span>
                      <span className="text-lg font-bold text-amber-600">{bellCount}</span>
                    </div>
                    <Link
                      to="/admin/requests"
                      onClick={() => setShowBellDropdown(false)}
                      className="mt-3 block text-center text-xs text-blue-600 hover:underline font-medium"
                    >
                      View all →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              {user?.profile.full_name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}