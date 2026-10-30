import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Pill, Activity, Award, Users, MoreHorizontal } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/timeline', label: 'Timeline', icon: Calendar },
    { to: '/medications', label: 'Meds', icon: Pill },
    { to: '/schemes', label: 'Schemes', icon: Award },
    { to: '/asha', label: 'ASHA', icon: Users },
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
