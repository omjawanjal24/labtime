'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/theme-context';
import { AdminNavbar } from '@/components/AdminNavbar';

interface Equipment {
  id: string;
  name: string;
}

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function EquipmentSlotsPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const equipmentId = params.id as string;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    start_time: '09:00',
    end_time: '10:00',
  });
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

      // Load equipment
      const { data: equipData } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', equipmentId)
        .single();

      if (equipData) {
        setEquipment(equipData);
      }

      // Load slots
      const { data: slotsData } = await supabase
        .from('slots')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('start_time', { ascending: true });

      if (slotsData) {
        setSlots(slotsData);
      }

      setLoading(false);
    };

    loadData();
  }, [equipmentId, router]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.start_time || !formData.end_time) {
      alert('Please fill in all fields');
      return;
    }

    // Validate that end time is after start time
    if (formData.start_time >= formData.end_time) {
      alert('End time must be after start time');
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('slots')
        .insert([
          {
            equipment_id: equipmentId,
            start_time: formData.start_time,
            end_time: formData.end_time,
            allowed_user_type: 'student',
            is_active: true,
          },
        ]);

      if (!error) {
        // Reload slots
        const { data: updatedSlots } = await supabase
          .from('slots')
          .select('*')
          .eq('equipment_id', equipmentId)
          .order('start_time', { ascending: true });

        if (updatedSlots) {
          setSlots(updatedSlots);
        }
        setShowForm(false);
        setFormData({ start_time: '09:00', end_time: '10:00' });
      } else {
        alert('Error creating slot: ' + error.message);
      }
    } catch (err) {
      alert('An error occurred while creating the slot');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSlot = async (slotId: string, currentStatus: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('slots')
      .update({ is_active: !currentStatus })
      .eq('id', slotId);

    if (!error) {
      setSlots(slots.map(slot => 
        slot.id === slotId ? { ...slot, is_active: !currentStatus } : slot
      ));
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('slots')
      .delete()
      .eq('id', slotId);

    if (!error) {
      setSlots(slots.filter(slot => slot.id !== slotId));
    }
  };

  if (loading) {
    return (
      <div className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}>
        <AdminNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto"></div>
            <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading slots...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}>
        <AdminNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Equipment not found</h1>
            <button
              onClick={() => router.push('/admin/equipment')}
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/admin/equipment')}
          className={`flex items-center ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} font-semibold mb-6`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Equipment
        </button>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Slots</h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2`}>{equipment.name}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {showForm ? '✕ Close' : '+ Add Slots'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 mb-8`}>
            <h2 className="text-xl font-bold mb-4">Add New Time Slot</h2>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none`}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  {submitting ? 'Adding...' : 'Add Slot'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ start_time: '09:00', end_time: '10:00' });
                  }}
                  className={`flex-1 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} text-gray-900 dark:text-white font-semibold py-2 rounded-lg transition-colors`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Slots List */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden`}>
          {slots.length === 0 ? (
            <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <p>No time slots added yet. Add time slots to allow users to book this equipment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Time</th>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Status</th>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {slots.map((slot) => (
                    <tr key={slot.id} className={theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          slot.is_active 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {slot.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => handleToggleSlot(slot.id, slot.is_active)}
                          className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                            slot.is_active
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {slot.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition-colors"
                        >
                          Delete
                        </button>
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
