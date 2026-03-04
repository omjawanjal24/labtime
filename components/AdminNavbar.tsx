'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/theme-context';

export function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserName(`${profile.first_name} ${profile.last_name}`);
        }
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/equipment', label: 'User View', icon: '👥' },
    { href: '/admin/equipment', label: 'Manage Equipment', icon: '🖥️' },
    { href: '/admin/bookings', label: 'Bookings', icon: '📅' },
    { href: '/admin/checkin', label: 'Check In/Out', icon: '📱' },
    { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
  ];

  return (
    <nav className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-40`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/admin/dashboard" className="flex items-center group">
            <img src="/mit-logo.png" alt="MIT-WPU LabTime" className="h-12 w-auto group-hover:opacity-80 transition-opacity" />
          </Link>

          {/* Nav Items - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Theme Toggle & Profile */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors flex items-center justify-center`}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors group`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {userName?.[0]?.toUpperCase() || '?'}
                </div>
                <span className={`hidden sm:block text-sm font-medium ${theme === 'dark' ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'} transition-colors`}>{userName}</span>
                <svg
                  className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'} transition-all ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className={`absolute right-0 mt-2 w-56 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 shadow-black/50' : 'bg-white border-gray-200'} rounded-lg shadow-2xl z-50 border overflow-hidden`}>
                  <Link
                    href="/admin/profile"
                    className={`flex items-center px-4 py-3 text-sm ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 border-gray-700' : 'text-gray-700 hover:bg-gray-100 border-gray-200'} transition-colors border-b`}
                  >
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Admin Profile
                  </Link>
                  <Link
                    href="/equipment"
                    className={`flex items-center px-4 py-3 text-sm ${theme === 'dark' ? 'text-blue-400 hover:bg-blue-900/20 border-gray-700' : 'text-blue-600 hover:bg-blue-50 border-gray-200'} transition-colors border-b font-medium`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    View User Equipment
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center text-left px-4 py-3 text-sm ${theme === 'dark' ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'} transition-colors`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav Items */}
        <div className={`md:hidden pb-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="space-y-2 mt-4">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
