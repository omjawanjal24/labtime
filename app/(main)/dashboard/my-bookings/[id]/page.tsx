'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
    description: string;
  };
  slot: {
    start_time: string;
    end_time: string;
  };
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const loadBooking = async () => {
      const supabase = createClient();

      // Check session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        router.push('/auth/login');
        return;
      }
      setSession(currentSession);

      // Load booking details
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          id,
          equipment_id,
          booking_date,
          status,
          checked_in_at,
          checked_out_at,
          slot_id,
          equipment:equipment_id(name, location, description),
          slot:slot_id(start_time, end_time)
        `)
        .eq('id', bookingId)
        .eq('user_id', currentSession.user.id)
        .single();

      if (bookingData) {
        setBooking(bookingData as any);

        // Generate QR code URL that encodes the booking ID
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(bookingData.id)}`;
        setQrCodeUrl(qrUrl);
      }

      setLoading(false);
    };

    loadBooking();
  }, [bookingId, router]);

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (!error) {
        // Reload booking
        const { data: updatedBooking } = await supabase
          .from('bookings')
          .select(`
            id,
            equipment_id,
            booking_date,
            status,
            checked_in_at,
            checked_out_at,
            slot_id,
            equipment:equipment_id(name, location, description),
            slot:slot_id(start_time, end_time)
          `)
          .eq('id', bookingId)
          .single();

        if (updatedBooking) {
          setBooking(updatedBooking as any);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-${bookingId}-qr.png`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR code', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-700';
      case 'checked-in':
        return 'bg-blue-900/30 text-blue-300 border-blue-700';
      case 'checked-out':
        return 'bg-green-900/30 text-green-300 border-green-700';
      case 'cancelled':
        return 'bg-red-900/30 text-red-300 border-red-700';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
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
            <p className="mt-4 text-gray-400">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-300">Booking not found</h1>
            <button
              onClick={() => router.push('/dashboard/my-bookings')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/my-bookings')}
          className="flex items-center text-blue-400 hover:text-blue-300 font-semibold mb-8"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Bookings
        </button>

        <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 p-8 border-b border-gray-800">
            <h1 className="text-4xl font-bold text-white mb-3">{booking.equipment?.name}</h1>
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(booking.status)}`}>
              {getStatusLabel(booking.status)}
            </span>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Booking Details */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Booking Details</h2>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Equipment</p>
                    <p className="text-lg font-semibold text-white">{booking.equipment?.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Location</p>
                    <p className="text-lg font-semibold text-white flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {booking.equipment?.location}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Booking Date</p>
                    <p className="text-lg font-semibold text-white flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Time Slot</p>
                    <p className="text-lg font-semibold text-white flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {booking.slot?.start_time.slice(0, 5)} - {booking.slot?.end_time.slice(0, 5)}
                    </p>
                  </div>

                  {booking.equipment?.description && (
                    <div>
                      <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">Description</p>
                      <p className="text-gray-300 leading-relaxed">{booking.equipment?.description}</p>
                    </div>
                  )}

                  {booking.checked_in_at && (
                    <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                      <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Checked In</p>
                      <p className="text-lg font-semibold text-blue-300">
                        {new Date(booking.checked_in_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {booking.checked_out_at && (
                    <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                      <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Checked Out</p>
                      <p className="text-lg font-semibold text-green-300">
                        {new Date(booking.checked_out_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code for Check In/Out */}
              <div className="flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-white mb-6">Booking QR Code</h2>
                {qrCodeUrl && booking.status !== 'cancelled' ? (
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full flex flex-col items-center">
                    <img
                      src={qrCodeUrl}
                      alt="Booking QR Code"
                      className="w-64 h-64 border-4 border-gray-700 rounded-lg"
                    />
                    <p className="text-center text-sm text-gray-400 mt-6">
                      Show this QR code to admin for check in/out
                    </p>
                    <button
                      onClick={downloadQRCode}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download QR Code
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center w-full">
                    <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4v2m0 4v2M6.34 7.34a9 9 0 1112.32 12.32m0 0l2.83-2.83m-2.83 2.83l-2.83-2.83" />
                    </svg>
                    <p className="text-gray-400">
                      {booking.status === 'cancelled' ? 'This booking has been cancelled' : 'No QR code available'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel Button */}
            {(booking.status === 'booked' || booking.status === 'checked-in') && (
              <div className="mt-12 pt-8 border-t border-gray-800">
                <button
                  onClick={handleCancelBooking}
                  className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-700 font-bold py-3 rounded-lg transition-colors"
                >
                  Cancel Booking
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
