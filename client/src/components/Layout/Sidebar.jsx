import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineSwitchHorizontal,
  HiOutlineScale,
  HiOutlineDocumentReport,
  HiOutlineLogout,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: HiOutlineViewGrid },
  { name: 'Transactions', path: '/transactions', icon: HiOutlineSwitchHorizontal },
  { name: 'Budget', path: '/budget', icon: HiOutlineScale },
  { name: 'Reports', path: '/reports', icon: HiOutlineDocumentReport },
];

const Sidebar = () => {
  const { logout, user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen shadow-sm fixed left-0 top-0 bottom-0 z-30">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <span className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="money-bag">
            💰
          </span>
          <span>ExpenseTracker</span>
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout Button */}
      <div className="p-4 border-t border-gray-100">
        {user && (
          <div className="px-3 py-2 mb-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium">Logged in as</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 rounded-xl hover:bg-rose-50 transition-colors duration-150 cursor-pointer"
        >
          <HiOutlineLogout className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
