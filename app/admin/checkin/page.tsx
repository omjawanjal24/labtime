'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AdminNavbar } from '@/components/AdminNavbar';

interface BookingDetails {
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

export default function CheckInOutPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
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
    };

    checkAuth();
  }, [router]);

  const startCamera = async () => {
    try {
      // Try with constraints first (for most browsers)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (constraintError) {
        // If constraints fail, try without them (Brave and other privacy-focused browsers)
        console.log('Retrying without video constraints for compatibility...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure autoplay happens
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => console.error('Autoplay failed:', err));
        };
        setCameraActive(true);
        setMessage('');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      let errorMsg = 'Unable to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMsg += 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMsg += 'No camera device found.';
      } else if (err.name === 'NotReadableError') {
        errorMsg += 'Camera is already in use by another application.';
      } else {
        errorMsg += 'Please check browser permissions and ensure HTTPS is used.';
      }
      
      setMessage(errorMsg);
      setMessageType('error');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const handleQRCodeSubmit = async (qrCode: string) => {
    if (!qrCode.trim()) return;

    setLoading(true);
    setMessage('');
    setMessageType('');
    setBookingDetails(null);

    try {
      const supabase = createClient();

      // Find booking by booking ID (from QR code scan)
      const { data: booking, error } = await supabase
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
        .eq('id', qrCode)
        .single();

      if (error || !booking) {
        setMessage('QR code not found. Please try again.');
        setMessageType('error');
        setLoading(false);
        return;
      }

      setBookingDetails(booking as any);
      setQrCodeInput('');
    } catch (err) {
      setMessage('Error scanning QR code. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'check_in' | 'check_out') => {
    if (!bookingDetails) return;

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const supabase = createClient();

      const updateData: any = {
        status: action === 'check_in' ? 'checked-in' : 'checked-out',
      };

      if (action === 'check_in') {
        updateData.checked_in_at = new Date().toISOString();
      } else {
        updateData.checked_out_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingDetails.id);

      if (error) {
        setMessage(`Failed to ${action === 'check_in' ? 'check in' : 'check out'}`);
        setMessageType('error');
      } else {
        setMessage(`Successfully ${action === 'check_in' ? 'checked in' : 'checked out'} ${bookingDetails.user.first_name} ${bookingDetails.user.last_name}`);
        setMessageType('success');
        setTimeout(() => {
          setBookingDetails(null);
        }, 2000);
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Check In/Out</h1>
          <p className="text-gray-400 mt-2">Scan QR codes to manage check-ins and check-outs</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success'
              ? 'bg-green-900 text-green-200 border border-green-700'
              : 'bg-red-900 text-red-200 border border-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">QR Code Scanner</h2>

            {cameraActive ? (
              <div className="space-y-4">
                <div className="bg-black rounded-lg border border-gray-700 overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    disablePictureInPicture
                    className="w-full h-96 bg-black"
                  />
                </div>
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="hidden"
                />
                <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-3 text-center">
                  <p className="text-sm text-indigo-300">📷 Point camera at QR code to scan</p>
                </div>
                <button
                  onClick={stopCamera}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  ✕ Stop Camera
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={startCamera}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>📱</span>
                  <span>Start Camera</span>
                </button>
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-xs text-gray-400">
                  <p className="font-semibold mb-2">💡 Camera Permission Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>For Brave: Shields down or allow camera in site settings</li>
                    <li>For Chrome/Edge: Allow when prompted</li>
                    <li>For Safari: Check System Preferences → Security & Privacy → Camera</li>
                    <li>HTTPS required (except localhost)</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Manual Input */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3">Manual Input</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleQRCodeSubmit(qrCodeInput);
                    }
                  }}
                  placeholder="Paste QR code data here..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={() => handleQRCodeSubmit(qrCodeInput)}
                  disabled={loading || !qrCodeInput.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Scanning...' : 'Scan'}
                </button>
              </div>
            </div>
          </div>

          {/* Booking Details Section */}
          <div>
            {bookingDetails ? (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Booking Details</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-400">User</p>
                    <p className="text-lg font-semibold text-white">
                      {bookingDetails.user.first_name} {bookingDetails.user.last_name}
                    </p>
                    <p className="text-sm text-gray-400">{bookingDetails.user.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Equipment</p>
                    <p className="text-lg font-semibold text-white">{bookingDetails.equipment.name}</p>
                    <p className="text-sm text-gray-400">{bookingDetails.equipment.location}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Date & Time</p>
                    <p className="text-lg font-semibold text-white">
                      {new Date(bookingDetails.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-400">
                      {bookingDetails.slot?.start_time.slice(0, 5)} - {bookingDetails.slot?.end_time.slice(0, 5)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      bookingDetails.status === 'booked'
                        ? 'bg-yellow-900 text-yellow-200'
                        : bookingDetails.status === 'checked-in'
                        ? 'bg-blue-900 text-blue-200'
                        : 'bg-green-900 text-green-200'
                    }`}>
                      {bookingDetails.status === 'booked' ? 'Booked' : bookingDetails.status === 'checked-in' ? 'Checked In' : 'Checked Out'}
                    </span>
                  </div>

                  {bookingDetails.checked_in_at && (
                    <div>
                      <p className="text-sm text-gray-400">Checked In</p>
                      <p className="text-lg font-semibold text-white">
                        {new Date(bookingDetails.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}

                  {bookingDetails.checked_out_at && (
                    <div>
                      <p className="text-sm text-gray-400">Checked Out</p>
                      <p className="text-lg font-semibold text-white">
                        {new Date(bookingDetails.checked_out_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {bookingDetails.status === 'booked' && (
                    <button
                      onClick={() => handleAction('check_in')}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      ✓ Check In
                    </button>
                  )}

                  {bookingDetails.status === 'checked-in' && (
                    <button
                      onClick={() => handleAction('check_out')}
                      disabled={loading}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      ✗ Check Out
                    </button>
                  )}

                  {bookingDetails.status === 'checked-out' && (
                    <div className="bg-green-900 text-green-200 p-4 rounded-lg text-center font-semibold">
                      Already Checked Out
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-center h-full flex items-center justify-center">
                <div>
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-gray-400">Scan a QR code or enter the code manually to see booking details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
