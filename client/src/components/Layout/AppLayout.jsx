import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineLogout, HiUserCircle } from 'react-icons/hi';

const AppLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl md:hidden font-bold text-gray-900">💰 ExpenseTracker</span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : <HiUserCircle className="w-6 h-6" />}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800 leading-none">{user.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-none">{user.email}</p>
                </div>
              </div>
            )}

            <button
              onClick={logout}
              title="Logout"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
            >
              <HiOutlineLogout className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile Navigation Bar */}
        <MobileNav />
      </div>
    </div>
  );
};

export default AppLayout;
