'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/theme-context';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
}

export function Navbar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Fetch active notifications
        const { data: notifs } = await supabase
          .from('notifications')
          .select('id, title, message, is_active')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        setNotifications(notifs || []);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <nav className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-40`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <img src="/mit-logo.png" alt="MIT-WPU LabTime" className="h-12 w-auto group-hover:opacity-80 transition-opacity" />
            </Link>
          </div>

          {/* Theme Toggle and Notifications */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors flex items-center justify-center`}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative w-8 h-8 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors flex items-center justify-center`}
              >
                🔔
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className={`absolute right-0 mt-2 w-80 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 shadow-black/50' : 'bg-white border-gray-200'} rounded-lg shadow-2xl z-50 border overflow-hidden`}>
                  <div className={`px-4 py-3 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b font-semibold`}>
                    Notifications {notifications.length > 0 && `(${notifications.length})`}
                  </div>
                  {notifications.length === 0 ? (
                    <div className={`px-4 py-6 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      No active notifications
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className={`px-4 py-3 ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'} border-b last:border-b-0`}>
                          <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{notif.title}</h4>
                          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors group`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {loading ? '?' : (userName?.[0]?.toUpperCase() || '?')}
                </div>
                <span className={`hidden sm:block text-sm font-medium ${theme === 'dark' ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'} transition-colors`}>
                  {loading ? 'Loading...' : userName}
                </span>
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
                <div className={`absolute right-0 mt-2 w-48 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 shadow-black/50' : 'bg-white border-gray-200'} rounded-lg shadow-2xl z-50 border overflow-hidden`}>
                  <Link
                    href="/dashboard/profile"
                    className={`flex items-center px-4 py-3 text-sm ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 border-gray-700' : 'text-gray-700 hover:bg-gray-100 border-gray-200'} transition-colors border-b`}
                  >
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/my-bookings"
                    className={`flex items-center px-4 py-3 text-sm ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 border-gray-700' : 'text-gray-700 hover:bg-gray-100 border-gray-200'} transition-colors border-b`}
                  >
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    My Bookings
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
      </div>
    </nav>
  );
}
