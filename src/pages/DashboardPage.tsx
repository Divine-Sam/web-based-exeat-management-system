import { api } from '../lib/api';
import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, PlusCircle, ClipboardList, Shield,
  LogOut, Menu, ChevronRight, Bell, Settings, X
} from 'lucide-react';
import { Role } from '../types';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',        path: '/dashboard',         icon: <LayoutDashboard className="w-4 h-4" />, roles: ['student', 'hall_admin', 'dean', 'security'] },
  { label: 'New Request',      path: '/requests/new',      icon: <PlusCircle className="w-4 h-4" />,     roles: ['student'] },
  { label: 'My Requests',      path: '/requests',          icon: <FileText className="w-4 h-4" />,       roles: ['student'] },
  { label: 'Review Requests',  path: '/admin/requests',    icon: <ClipboardList className="w-4 h-4" />, roles: ['hall_admin', 'dean'] },
  { label: 'Security Desk',    path: '/security/requests', icon: <Shield className="w-4 h-4" />,        roles: ['security'] },
  { label: 'Account Settings', path: '/account/settings',  icon: <Settings className="w-4 h-4" />,      roles: ['student', 'hall_admin', 'dean', 'security'] },
  { label: 'Super Admin',      path: '/superadmin',        icon: <Shield className="w-4 h-4" />,        roles: ['superadmin'] },
];

const ROLE_LABELS: Record<Role, string> = {
  student:    'Student',
  hall_admin: 'Hall Admin',
  dean:       'Dean',
  security:   'Security',
  superadmin: 'Super Admin',
};

const ROLE_COLORS: Record<Role, string> = {
  student:    'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  hall_admin: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  dean:       'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  security:   'bg-red-500/20 text-red-300 border border-red-500/30',
  superadmin: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
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

  useEffect(() => {
    if (role !== 'hall_admin' && role !== 'dean') return;
    const fetchBellCount = async () => {
      try {
        const data = await api.get<{ pendingHallAdmin: number; pendingDean: number }>('/requests/admin/stats');
        if (role === 'hall_admin') setBellCount(data.pendingHallAdmin ?? 0);
        if (role === 'dean')       setBellCount(data.pendingDean ?? 0);
      } catch { /* silent */ }
    };
    fetchBellCount();
    const interval = setInterval(fetchBellCount, 30_000);
    return () => clearInterval(interval);
  }, [role]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const currentLabel = visibleNav.find(
    n => location.pathname === n.path || location.pathname.startsWith(n.path + '/')
  )?.label ?? 'Dashboard';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0d0d1a]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/7 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}>
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-white leading-tight">Exeat</p>
          <p className="text-xs text-white/40 leading-tight">Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {visibleNav.map(item => {
          const active =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'text-purple-300 border border-purple-500/25'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              style={active ? { background: 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(236,72,153,0.15))' } : {}}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 pt-3 border-t border-white/7">
        <div className="bg-white/5 border border-white/8 rounded-xl p-3 mb-2">
          <p className="text-sm font-medium text-white truncate">{user?.profile.full_name}</p>
          <p className="text-xs text-white/40 truncate mt-0.5">{user?.profile.crawford_number}</p>
          <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>
            {ROLE_LABELS[role]}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0f0f1e]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-white/7">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-[#0d0d1a] border-b border-white/7 px-4 lg:px-6 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-white/40 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <p className="hidden lg:block text-sm text-white/40">{currentLabel}</p>

          <div className="flex items-center gap-3 ml-auto relative">
            {/* Bell */}
            {(role === 'hall_admin' || role === 'dean') && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBellDropdown(prev => !prev);
                    navigate('/admin/requests');
                  }}
                  className="relative w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {bellCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                      {bellCount > 99 ? '99+' : bellCount}
                    </span>
                  )}
                </button>

                {showBellDropdown && (
                  <div
                    className="absolute right-0 top-11 w-60 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50 p-4"
                    onMouseLeave={() => setShowBellDropdown(false)}
                  >
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Pending Review</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">
                        {role === 'hall_admin' ? 'Awaiting your approval' : 'Awaiting dean approval'}
                      </span>
                      <span className="text-lg font-bold text-amber-400">{bellCount}</span>
                    </div>
                    <Link
                      to="/admin/requests"
                      onClick={() => setShowBellDropdown(false)}
                      className="mt-3 block text-center text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                      View all →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}
            >
              {user?.profile.full_name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}