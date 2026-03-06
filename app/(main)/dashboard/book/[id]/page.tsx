'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/theme-context';
import { Navbar } from '@/components/Navbar';

interface Equipment {
  id: string;
  name: string;
  description: string;
  location: string;
}

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function BookEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const equipmentId = params.id as string;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Check session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        router.push('/auth/login');
        return;
      }
      setSession(currentSession);

      // Load equipment
      const { data: equipData } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', equipmentId)
        .single();

      if (equipData) {
        setEquipment(equipData);
      }

      // Load available time slots for this equipment
      const { data: slotsData } = await supabase
        .from('slots')
        .select('*')
        .eq('equipment_id', equipmentId)
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (slotsData) {
        setSlots(slotsData);
      }

      // Set initial selected date to today
      const today = new Date();
      setSelectedDate(today.toISOString().split('T')[0]);

      setLoading(false);
    };

    loadData();
  }, [equipmentId, router]);

  // Load bookings for selected date
  useEffect(() => {
    const loadBookingsForDate = async () => {
      if (!selectedDate || !equipmentId) return;

      const supabase = createClient();
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('equipment_id', equipmentId)
        .eq('booking_date', selectedDate);

      if (bookingsData) {
        setBookings(bookingsData);
      }
    };

    loadBookingsForDate();
  }, [selectedDate, equipmentId]);

  // Check if user already has a booking for this equipment today
  const checkExistingBooking = async () => {
    if (!session || !selectedDate || !selectedSlot) return false;

    const supabase = createClient();
    const { data } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('equipment_id', equipmentId)
      .eq('booking_date', selectedDate)
      .neq('status', 'cancelled');

    return data && data.length > 0;
  };

  const handleBooking = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!selectedDate || !selectedSlot) {
      setError('Please select a date and time slot');
      return;
    }

    // Check for existing booking
    const hasExisting = await checkExistingBooking();
    if (hasExisting) {
      setError('You already have a booking for this equipment on this date');
      return;
    }

    setBooking(true);

    try {
      const supabase = createClient();

      // Ensure profile row exists (handles users who signed up before the trigger was added)
      await supabase
        .from('profiles')
        .upsert(
          { id: session.user.id, email: session.user.email, role: 'user' },
          { onConflict: 'id', ignoreDuplicates: true }
        );

      // Get slot details
      const selectedSlotData = slots.find(s => s.id === selectedSlot);
      if (!selectedSlotData) {
        setError('Invalid slot selected');
        setBooking(false);
        return;
      }

      // Create booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: session.user.id,
            equipment_id: equipmentId,
            slot_id: selectedSlot,
            booking_date: selectedDate,
            status: 'booked',
          },
        ])
        .select()
        .single();

      if (bookingError) {
        setError('Failed to create booking: ' + bookingError.message);
        setBooking(false);
        return;
      }

      setSuccess('Booking created successfully! Redirecting to your bookings...');
      setTimeout(() => {
        router.push(`/dashboard/my-bookings/${bookingData.id}`);
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setBooking(false);
    }
  };

  // Get available slots for selected date
  const availableSlotsForDate = slots.filter(slot => slot.is_active);

  // Check if a slot is booked on the selected date
  const isSlotBooked = (slotId: string) => {
    return bookings.some(b => b.slot_id === slotId && b.booking_date === selectedDate && b.status !== 'cancelled');
  };

  // Check if a slot is expired (time has passed)
  const isSlotExpired = (slot: Slot) => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    
    // If date is in the past, it's expired
    if (selectedDate < currentDate) {
      return true;
    }
    
    // If it's today, check if the time has passed
    if (selectedDate === currentDate) {
      const [hours, minutes] = slot.start_time.split(':').map(Number);
      const slotTime = new Date();
      slotTime.setHours(hours, minutes, 0);
      
      return now > slotTime;
    }
    
    return false;
  };

  // Get slot status
  const getSlotStatus = (slot: Slot) => {
    if (isSlotExpired(slot)) return 'expired';
    if (isSlotBooked(slot.id)) return 'booked';
    return 'available';
  };

  if (loading) {
    return (
      <div className={theme === 'dark' ? 'bg-black' : 'bg-gray-50'}>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto"></div>
            <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading equipment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Equipment not found</h1>
            <button
              onClick={() => router.push('/equipment')}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Back to Equipment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/equipment')}
          className={`flex items-center ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} font-semibold mb-6`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Equipment
        </button>

        <div className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-lg p-8`}>
          {/* Equipment Info */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{equipment.name}</h1>
            {equipment.description && (
              <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{equipment.description}</p>
            )}
            {equipment.location && (
              <p className={`mt-2 flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Location: {equipment.location}
              </p>
            )}
          </div>

          {/* Booking Form */}
          <div className="space-y-6">
            {error && (
              <div className={`${theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg`}>
                {error}
              </div>
            )}

            {success && (
              <div className={`${theme === 'dark' ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700'} border px-4 py-3 rounded-lg`}>
                {success}
              </div>
            )}

            {/* Date Selection */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(''); // Reset slot selection
                }}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none`}
              />
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Select Time Slot
              </label>
              {availableSlotsForDate.length === 0 ? (
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>No available slots for this date</p>
              ) : (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {availableSlotsForDate.map(slot => {
                      const status = getSlotStatus(slot);
                      let bgColor = '';
                      let textColor = '';
                      let borderColor = '';
                      let isDisabled = false;
                      let statusLabel = '';

                      if (status === 'expired') {
                        bgColor = 'bg-red-600/30';
                        borderColor = 'border-red-600';
                        textColor = 'text-red-400';
                        isDisabled = true;
                        statusLabel = '(Expired)';
                      } else if (status === 'booked') {
                        bgColor = 'bg-gray-600/30';
                        borderColor = 'border-gray-600';
                        textColor = 'text-gray-400';
                        isDisabled = true;
                        statusLabel = '(Booked)';
                      } else {
                        bgColor = 'bg-green-600/30';
                        borderColor = 'border-green-600';
                        textColor = 'text-green-400';
                        statusLabel = '(Available)';
                      }

                      return (
                        <button
                          key={slot.id}
                          onClick={() => !isDisabled && setSelectedSlot(slot.id)}
                          disabled={isDisabled}
                          className={`p-3 rounded-lg font-semibold transition-colors border-2 ${
                            isDisabled
                              ? `${bgColor} ${borderColor} ${textColor} cursor-not-allowed opacity-60`
                              : selectedSlot === slot.id
                              ? `bg-indigo-600 border-indigo-600 text-white`
                              : `${bgColor} ${borderColor} ${textColor} hover:opacity-80`
                          }`}
                          title={isDisabled ? `This slot is ${status}` : 'Available for booking'}
                        >
                          <div className="text-sm">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</div>
                          <div className="text-xs mt-1">{statusLabel}</div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Status Legend */}
                  <div className="flex flex-wrap gap-4 text-xs mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-600 rounded"></div>
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-600 rounded"></div>
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-600 rounded"></div>
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Expired</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Booking Summary */}
            {selectedDate && selectedSlot && (
              <div className={`${theme === 'dark' ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-200'} border rounded-lg p-4`}>
                <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Booking Summary</h3>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  <strong>Equipment:</strong> {equipment.name}
                </p>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  <strong>Time:</strong> {availableSlotsForDate.find(s => s.id === selectedSlot)?.start_time.slice(0, 5)} - {availableSlotsForDate.find(s => s.id === selectedSlot)?.end_time.slice(0, 5)}
                </p>
              </div>
            )}

            {/* Book Button */}
            <button
              onClick={handleBooking}
              disabled={booking || !selectedDate || !selectedSlot}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {booking ? 'Creating Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
