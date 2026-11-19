import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  Bot,
  CalendarCheck,
  CalendarPlus,
  ClipboardList,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Stethoscope,
  User,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/apiClient';

interface NavEntry {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: ('ADMIN' | 'DOCTOR' | 'PATIENT')[];
}

const NAV_ENTRIES: NavEntry[] = [
  { to: '/admin', label: 'Admin Overview', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['ADMIN'] },
  { to: '/doctor', label: 'Clinician Console', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['DOCTOR'] },
  { to: '/patient', label: 'Patient Home', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['PATIENT'] },
  { to: '/appointments', label: 'Appointments', icon: <CalendarCheck className="w-4 h-4" />, roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
  { to: '/book-appointment', label: 'Book Visit', icon: <CalendarPlus className="w-4 h-4" />, roles: ['ADMIN', 'PATIENT'] },
  { to: '/doctors', label: 'Doctor Directory', icon: <Stethoscope className="w-4 h-4" />, roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
  { to: '/patients', label: 'Patients', icon: <Users className="w-4 h-4" />, roles: ['ADMIN', 'DOCTOR'] },
  { to: '/patient-profile', label: 'Medical Profile', icon: <User className="w-4 h-4" />, roles: ['PATIENT'] },
  { to: '/service-requests', label: 'Service Requests', icon: <ClipboardList className="w-4 h-4" />, roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
  { to: '/ai-assistant', label: 'AI Assistant', icon: <Bot className="w-4 h-4" />, roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
  { to: '/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
  { to: '/profile', label: 'Account Settings', icon: <UserCog className="w-4 h-4" />, roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
  { to: '/blueprint', label: 'System Blueprint', icon: <Layers className="w-4 h-4" />, roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
];

export function AppShell({
  breadcrumb,
  primaryAction,
  children,
}: {
  breadcrumb: string;
  primaryAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, primaryRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    notificationApi
      .listMy()
      .then((res) => {
        if (active) setUnreadCount(res.content.filter((n) => !n.read).length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const visibleNav = NAV_ENTRIES.filter((item) =>
    primaryRole ? item.roles.includes(primaryRole) : false
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleDisplay =
    primaryRole === 'ADMIN' ? 'Administrator' : primaryRole === 'DOCTOR' ? 'Physician' : 'Patient';

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-slate-200 flex-col justify-between">
        <div>
          <div className="h-14 px-5 border-b border-slate-200 flex items-center">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-sky-600 text-white flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-slate-900 whitespace-nowrap">
                CareFlow Health
              </span>
            </Link>
          </div>

          <nav className="p-3 space-y-0.5" aria-label="Workspace navigation">
            {visibleNav.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.to === '/notifications' && unreadCount > 0 && (
                    <span className="text-xs font-mono font-semibold text-sky-700 tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">{user?.fullName}</div>
            <div className="text-xs text-slate-500 truncate">
              {roleDisplay} · {user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/30" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-white h-full border-r border-slate-200 flex flex-col justify-between p-4 z-10 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="font-semibold text-sm text-slate-900">CareFlow Health</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1 text-slate-500 hover:text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="mt-3 space-y-1">
                {visibleNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                      location.pathname === item.to
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    {item.to === '/notifications' && unreadCount > 0 && (
                      <span className="text-xs font-mono text-sky-700">{unreadCount}</span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="mt-6 flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-md"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-600 truncate">{breadcrumb}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {primaryAction}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
