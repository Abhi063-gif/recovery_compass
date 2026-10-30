import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Bell,
  Sparkles,
  ChevronDown,
  Layers,
  Settings,
  LogOut,
  LogIn,
  CheckCircle2,
  Pill,
  Activity,
  AlertTriangle,
  Calendar,
  Users,
  Shield,
  Globe,
  Download,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePlanStore } from '@/stores/usePlanStore';
import { useAppPreferencesStore } from '@/stores/useAppPreferencesStore';
import { downloadRecoveryCalendar } from '@/services/calendarExport';
import { offlineStorage } from '@/services/offlineSync';
import { useTranslation } from '@/services/i18n';
import { AuthModal } from './AuthModal';

export const TopBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { plan, loadDemoPatient } = usePlanStore();
  const { notifications, markNotificationRead, clearAllNotifications, language, setLanguage, isOffline } = useAppPreferencesStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

    const [outboxCount, setOutboxCount] = useState<number>(0);
  const [isSyncingOutbox, setIsSyncingOutbox] = useState<boolean>(false);

  React.useEffect(() => {
    const checkOutbox = async () => {
      try {
        const items = await offlineStorage.getOutbox();
        setOutboxCount(items.length);
      } catch {
        setOutboxCount(0);
      }
    };

    checkOutbox();
    const interval = setInterval(checkOutbox, 3000);

    const handleOnline = () => {
      offlineStorage.syncOutbox().then(() => checkOutbox()).catch(() => {});
    };

    window.addEventListener('online', handleOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncingOutbox(true);
    try {
      await offlineStorage.syncOutbox();
      const items = await offlineStorage.getOutbox();
      setOutboxCount(items.length);
    } catch (err) {
      console.warn('Manual sync failed:', err);
    } finally {
      setIsSyncingOutbox(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const closeAllMenus = () => {
    setShowNotifications(false);
    setShowUserMenu(false);
  };

  const handleStartDemo = () => {
    loadDemoPatient();
    closeAllMenus();
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', label: t('today') },
    { to: '/timeline', label: t('timeline') },
    { to: '/medications', label: t('medications') },
    { to: '/symptoms/log', label: t('symptoms') },
    { to: '/schemes', label: t('schemes') },
    { to: '/facilities', label: t('facilities') },
    { to: '/asha', label: t('ashaCaseload') },
    { to: '/anm', label: t('anmReview') },
    ...(plan.id ? [{ to: `/verification/${plan.id}`, label: t('verification') }] : []),
    { to: '/family', label: t('family') },
  ];

  const currentInitials = user?.firstName
    ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-4 h-4 text-sky-600" />;
      case 'task':
        return <Activity className="w-4 h-4 text-rose-600" />;
      case 'safety':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'followup':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'family':
        return <Users className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <>
      {/* Click-away backdrop overlay */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-30 bg-transparent"
          onClick={closeAllMenus}
        />
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <Link to="/" onClick={closeAllMenus} className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-800 to-rose-600 flex items-center justify-center text-white shadow-sm shadow-rose-200 group-hover:scale-105 transition">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              Recovery<span className="text-rose-700">Compass</span>
            </span>
          </Link>

          {/* Center Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 border border-slate-200/80 p-1 rounded-xl overflow-x-auto">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.to ||
                (link.to !== '/' && location.pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeAllMenus}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-white text-rose-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Offline / Outbox Sync Status Indicator */}
            {isOffline || outboxCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Saved on phone (Offline){outboxCount > 0 ? ` (${outboxCount})` : ''}</span>
                </span>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncingOutbox}
                  className="flex items-center gap-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded-xl shadow-sm transition disabled:opacity-50"
                  title="Sync pending changes with server"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOutbox ? 'animate-spin' : ''}`} />
                  <span>{isSyncingOutbox ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Synced ✓</span>
              </div>
            )}

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                title="Select language (English / हिन्दी / मराठी)"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
              </select>
            </div>

            {/* Offline .ICS Phone Calendar Alarms Export (PRD Section 7.3) */}
            {plan.id && (
              <button
                onClick={() => downloadRecoveryCalendar(plan)}
                className="hidden sm:flex items-center gap-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl transition"
                title="Export offline .ics calendar alarms to phone calendar"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>.ICS Alarms</span>
              </button>
            )}

            {/* Try Demo Button */}
            <button
              onClick={handleStartDemo}
              className="flex items-center gap-1.5 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white px-3 py-1.5 rounded-xl shadow-sm transition"
              title="Load Synthetic Patient Recovery Plan"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try Demo</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-slate-200 p-4 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Notifications & Reminders
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[11px] text-rose-700 hover:underline font-semibold"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-slate-500">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                      <p className="text-xs font-bold text-slate-800">You're all caught up!</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        No pending medication alerts or schedule reminders.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`py-2.5 px-2 flex items-start gap-2.5 cursor-pointer rounded-xl hover:bg-slate-50 transition ${
                            !n.isRead ? 'bg-rose-50/50' : ''
                          }`}
                        >
                          <div className="p-1.5 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                            {getNotificationIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900">{n.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-slate-400 block mt-1">Today</span>
                          </div>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 mt-2 border-t border-slate-100 text-center">
                    <Link
                      to="/notifications"
                      onClick={closeAllMenus}
                      className="text-xs font-bold text-rose-700 hover:underline"
                    >
                      View All Notifications & History →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar with dropdown or Sign In button */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition"
                  aria-label="User profile and menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-700 text-white font-bold text-xs flex items-center justify-center">
                    {currentInitials}
                  </div>
                  <span className="text-xs font-bold text-slate-800 hidden lg:inline max-w-[100px] truncate">
                    {user?.firstName || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-elevated border border-slate-200 p-2 z-50 animate-in fade-in text-xs space-y-1">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <span className="font-bold text-slate-900 block truncate">
                        {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] : 'User'}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">{user?.email || ''}</span>
                    </div>

                    <Link
                      to="/settings"
                      onClick={closeAllMenus}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Settings & Privacy</span>
                    </Link>

                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={closeAllMenus}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        <span>Admin Panel</span>
                      </Link>
                    )}

                    <Link
                      to="/offline"
                      onClick={closeAllMenus}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Offline Plan Mode</span>
                    </Link>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-700 hover:bg-red-50 font-medium text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs transition"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};
