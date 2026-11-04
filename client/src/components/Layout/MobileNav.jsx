import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineSwitchHorizontal,
  HiOutlineScale,
  HiOutlineDocumentReport,
} from 'react-icons/hi';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: HiOutlineViewGrid },
  { name: 'Transactions', path: '/transactions', icon: HiOutlineSwitchHorizontal },
  { name: 'Budget', path: '/budget', icon: HiOutlineScale },
  { name: 'Reports', path: '/reports', icon: HiOutlineDocumentReport },
];

const MobileNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[11px] truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
