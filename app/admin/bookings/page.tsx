'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AdminNavbar } from '@/components/AdminNavbar';

interface Booking {
  id: string;
  user_id: string;
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
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function BookingsManagementPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'booked' | 'checked-in' | 'checked-out'>('all');
  const [search, setSearch] = useState('');
  const [session, setSession] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>();

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Check session and admin role
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        router.push('/auth/login');
        return;
      }

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

      // Load bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          equipment_id,
          booking_date,
          status,
          checked_in_at,
          checked_out_at,
          slot_id,
          equipment:equipment_id(name, location),
          slot:slot_id(start_time, end_time),
          user:user_id(first_name, last_name, email)
        `)
        .order('booking_date', { ascending: false });

      if (bookingsData) {
        setBookings(bookingsData as any);
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  const filteredBookings = bookings.filter(booking => {
    // Filter by status
    const statusMatch = filter === 'all' || booking.status === filter;
    
    // Filter by search
    if (search.trim() === '') {
      return statusMatch;
    }

    const searchLower = search.toLowerCase();
    const userName = `${booking.user?.first_name || ''} ${booking.user?.last_name || ''}`.toLowerCase();
    const bookingId = booking.id.toLowerCase();
    const equipmentName = booking.equipment?.name.toLowerCase() || '';
    const slotTime = `${booking.slot?.start_time || ''} ${booking.slot?.end_time || ''}`.toLowerCase();

    const matchesSearch = 
      userName.includes(searchLower) ||
      bookingId.includes(searchLower) ||
      equipmentName.includes(searchLower) ||
      slotTime.includes(searchLower);

    return statusMatch && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-yellow-900 text-yellow-200';
      case 'checked-in':
        return 'bg-blue-900 text-blue-200';
      case 'checked-out':
        return 'bg-green-900 text-green-200';
      case 'cancelled':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-gray-700 text-gray-300';
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

  const handleCheckIn = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'checked-in',
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(bookings.map(b => 
        b.id === bookingId 
          ? { ...b, status: 'checked-in', checked_in_at: new Date().toISOString() }
          : b
      ));
      setMessage('Booking checked in successfully!');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to check in booking');
      setMessageType('error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'checked-out',
          checked_out_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(bookings.map(b => 
        b.id === bookingId 
          ? { ...b, status: 'checked-out', checked_out_at: new Date().toISOString() }
          : b
      ));
      setMessage('Booking checked out successfully!');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to check out booking');
      setMessageType('error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;

    setActionLoading(bookingId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(bookings.filter(b => b.id !== bookingId));
      setMessage('Booking deleted successfully!');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to delete booking');
      setMessageType('error');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div>
        <AdminNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Booking Management</h1>
          <p className="text-gray-400 mt-2">View and manage all equipment bookings</p>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success'
              ? 'bg-green-900 text-green-200 border border-green-700'
              : 'bg-red-900 text-red-200 border border-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, booking ID, equipment, or time slot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {(['all', 'booked', 'checked-in', 'checked-out'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                filter === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab === 'checked-in' ? 'Checked In' : tab === 'checked-out' ? 'Checked Out' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No bookings found for this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Equipment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Date & Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Check In/Out</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredBookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-white">
                            {booking.user?.first_name} {booking.user?.last_name}
                          </p>
                          <p className="text-sm text-gray-400">{booking.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-white">{booking.equipment?.name}</p>
                          <p className="text-sm text-gray-400">{booking.equipment?.location}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <p>{new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <p className="text-sm">{booking.slot?.start_time.slice(0, 5)} - {booking.slot?.end_time.slice(0, 5)}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {booking.checked_in_at && (
                          <div>
                            <p className="text-sm">In: {new Date(booking.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        )}
                        {booking.checked_out_at && (
                          <p className="text-sm">Out: {new Date(booking.checked_out_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                        {!booking.checked_in_at && booking.status !== 'cancelled' && (
                          <p className="text-sm text-yellow-400">Not checked in</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {booking.status === 'booked' && !booking.checked_in_at && (
                            <button
                              onClick={() => handleCheckIn(booking.id)}
                              disabled={actionLoading === booking.id}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs font-semibold px-3 py-1 rounded transition-colors"
                            >
                              {actionLoading === booking.id ? '...' : 'Check In'}
                            </button>
                          )}
                          {booking.status === 'checked-in' && (
                            <button
                              onClick={() => handleCheckOut(booking.id)}
                              disabled={actionLoading === booking.id}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs font-semibold px-3 py-1 rounded transition-colors"
                            >
                              {actionLoading === booking.id ? '...' : 'Check Out'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs font-semibold px-3 py-1 rounded transition-colors"
                          >
                            {actionLoading === booking.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
