import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Pill, Activity, Users, MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

export const MobileBottomNav: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return null;
  }

  const userRole = user.role?.toUpperCase();
  const isAshaOrAnm = userRole === 'ASHA' || userRole === 'ANM' || userRole === 'ADMIN';

  const navItems = [
    { to: '/dashboard', label: 'Today', icon: Home },
    { to: '/timeline', label: 'Plan', icon: Calendar },
    { to: '/medications', label: 'Meds', icon: Pill },
    { to: '/symptoms/log', label: 'Symptoms', icon: Activity },
    ...(isAshaOrAnm
      ? [{ to: '/asha', label: 'Caseload', icon: Users }]
      : [{ to: '/family', label: 'Family', icon: Users }]),
    { to: '/settings', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 shadow-elevated"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-14 py-1 rounded-xl text-[10px] font-semibold transition ${
                  isActive
                    ? 'text-rose-700 font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
