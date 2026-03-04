'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AdminNavbar } from '@/components/AdminNavbar';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalEquipment: 0,
    totalBookings: 0,
    pendingBookings: 0,
    checkedInBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Check session and admin role
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        router.push('/auth/login');
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentSession.user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setSession(currentSession);

      // Load statistics
      const [
        { count: equipmentCount },
        { count: bookingsCount },
        { count: pendingCount },
        { count: checkedInCount },
      ] = await Promise.all([
        supabase
          .from('equipment')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'checked_in'),
      ]);

      setStats({
        totalEquipment: equipmentCount || 0,
        totalBookings: bookingsCount || 0,
        pendingBookings: pendingCount || 0,
        checkedInBookings: checkedInCount || 0,
      });

      setLoading(false);
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <AdminNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-3">Admin Dashboard</h1>
          <p className="text-gray-400 text-lg">Manage equipment, bookings, and system operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Equipment */}
          <Link href="/admin/equipment">
            <div className="group bg-gray-900 rounded-xl border border-gray-800 hover:border-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-600/20 p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Total Equipment</p>
                  <p className="text-4xl font-bold text-white mt-3">{stats.totalEquipment}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-3xl group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all">
                  
                </div>
              </div>
            </div>
          </Link>

          {/* Total Bookings */}
          <Link href="/admin/bookings">
            <div className="group bg-gray-900 rounded-xl border border-gray-800 hover:border-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-600/20 p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Total Bookings</p>
                  <p className="text-4xl font-bold text-white mt-3">{stats.totalBookings}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center text-3xl group-hover:shadow-lg group-hover:shadow-green-500/50 transition-all">
                  
                </div>
              </div>
            </div>
          </Link>

          {/* Pending Bookings */}
          <Link href="/admin/bookings">
            <div className="group bg-gray-900 rounded-xl border border-gray-800 hover:border-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-600/20 p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Pending Bookings</p>
                  <p className="text-4xl font-bold text-white mt-3">{stats.pendingBookings}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-600 to-amber-700 rounded-xl flex items-center justify-center text-3xl group-hover:shadow-lg group-hover:shadow-yellow-500/50 transition-all">
                  
                </div>
              </div>
            </div>
          </Link>

          {/* Checked In */}
          <Link href="/admin/bookings">
            <div className="group bg-gray-900 rounded-xl border border-gray-800 hover:border-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-600/20 p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Checked In</p>
                  <p className="text-4xl font-bold text-white mt-3">{stats.checkedInBookings}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl flex items-center justify-center text-3xl group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all">
                  
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/equipment"
              className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-lg transition-all hover:shadow-2xl hover:shadow-blue-600/50 text-center flex items-center justify-center space-x-2"
            >
              <span></span>
              <span>Manage Equipment</span>
            </Link>
            <Link
              href="/admin/bookings"
              className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-lg transition-all hover:shadow-2xl hover:shadow-green-600/50 text-center flex items-center justify-center space-x-2"
            >
              <span></span>
              <span>View Bookings</span>
            </Link>
            <Link
              href="/admin/checkin"
              className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-lg transition-all hover:shadow-2xl hover:shadow-purple-600/50 text-center flex items-center justify-center space-x-2"
            >
              <span></span>
              <span>Check In/Out</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
