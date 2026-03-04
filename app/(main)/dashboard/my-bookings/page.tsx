'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';

interface Booking {
  id: string;
  equipment_id: string;
  booking_date: string;
  status: string;
  checked_in_at?: string;
  checked_out_at?: string;
  slot_id: string;
  equipment: {
    name: string;
    location: string;
  };
  slot: {
    start_time: string;
    end_time: string;
  };
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const loadBookings = async () => {
      const supabase = createClient();

      // Check session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        router.push('/auth/login');
        return;
      }
      setSession(currentSession);

      // Load user's bookings
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          id,
          equipment_id,
          booking_date,
          status,
          checked_in_at,
          checked_out_at,
          slot_id,
          equipment:equipment_id(name, location),
          slot:slot_id(start_time, end_time)
        `)
        .eq('user_id', currentSession.user.id)
        .order('booking_date', { ascending: false });

      if (!error && bookingsData) {
        setBookings(bookingsData as any);
      }

      setLoading(false);
    };

    loadBookings();
  }, [router]);

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'active') return booking.status === 'booked' || booking.status === 'checked-in';
    if (filter === 'completed') return booking.status === 'checked-out' || booking.status === 'cancelled';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-yellow-900/30 text-yellow-300 border border-yellow-700';
      case 'checked-in':
        return 'bg-blue-900/30 text-blue-300 border border-blue-700';
      case 'checked-out':
        return 'bg-green-900/30 text-green-300 border border-green-700';
      case 'cancelled':
        return 'bg-red-900/30 text-red-300 border border-red-700';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'booked':
        return 'Booked';
      case 'checked-in':
        return 'Checked In';
      case 'checked-out':
        return 'Checked Out';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-5xl font-bold mb-3">My Bookings</h1>
            <p className="text-gray-400 text-lg">Manage and track your equipment bookings</p>
          </div>
          <Link
            href="/equipment"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Book More
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {(['all', 'active', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-300 mt-2">No bookings yet</h3>
            <p className="text-gray-500 mt-1">Start booking equipment to see them here</p>
            <Link
              href="/equipment"
              className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Browse Equipment
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <Link
                key={booking.id}
                href={`/dashboard/my-bookings/${booking.id}`}
              >
                <div className="group bg-gray-900 rounded-xl border border-gray-800 hover:border-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-600/20 p-6">
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                        {booking.equipment?.name || 'Equipment'}
                      </h3>
                      <div className="mt-4 space-y-2 text-sm text-gray-400">
                        <p className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {booking.slot?.start_time.slice(0, 5)} - {booking.slot?.end_time.slice(0, 5)}
                        </p>
                        {booking.equipment?.location && (
                          <p className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {booking.equipment.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 text-right flex flex-col items-end gap-4">
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>

                      {booking.status === 'booked' && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">View QR</p>
                          <div className="w-20 h-20 bg-gray-800 rounded-lg p-1 flex items-center justify-center border border-gray-700 group-hover:border-blue-500 transition-colors">
                            <svg className="w-12 h-12 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
