'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AdminNavbar } from '@/components/AdminNavbar';

interface Equipment {
  id: string;
  name: string;
  description: string;
  location: string;
  is_active: boolean;
}

export default function EquipmentManagementPage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
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
      const { data: equipmentData } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (equipmentData) {
        setEquipment(equipmentData);
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    try {
      if (editingId) {
        // Update equipment
        const { error } = await supabase
          .from('equipment')
          .update({
            name: formData.name,
            description: formData.description || null,
            location: formData.location || null,
          })
          .eq('id', editingId);

        if (!error) {
          // Reload equipment
          const { data: updatedEquipment } = await supabase
            .from('equipment')
            .select('*')
            .order('created_at', { ascending: false });

          if (updatedEquipment) {
            setEquipment(updatedEquipment);
          }
          setShowForm(false);
          setEditingId(null);
          setFormData({ name: '', description: '', location: '' });
        } else {
          alert('Error updating equipment: ' + error.message);
        }
      } else {
        // Create new equipment with is_active: true
        const { error } = await supabase
          .from('equipment')
          .insert([
            {
              name: formData.name,
              description: formData.description || null,
              location: formData.location || null,
              is_active: true,
            },
          ]);

        if (!error) {
          // Reload equipment
          const { data: newEquipment } = await supabase
            .from('equipment')
            .select('*')
            .order('created_at', { ascending: false });

          if (newEquipment) {
            setEquipment(newEquipment);
          }
          setShowForm(false);
          setFormData({ name: '', description: '', location: '' });
        } else {
          alert('Error creating equipment: ' + error.message);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (item: Equipment) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      location: item.location || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const supabase = createClient();
    const newIsActive = !currentStatus;
    
    const { error } = await supabase
      .from('equipment')
      .update({ is_active: newIsActive })
      .eq('id', id);

    if (!error) {
      // Reload equipment to ensure real-time sync
      const { data: updatedEquipment } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (updatedEquipment) {
        setEquipment(updatedEquipment);
      }
    } else {
      alert('Error updating equipment: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id);

    if (!error) {
      setEquipment(equipment.filter(item => item.id !== id));
    }
  };

  if (loading) {
    return (
      <div>
        <AdminNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading equipment...</p>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Equipment Management</h1>
            <p className="text-gray-400 mt-2">Add, edit, and manage equipment</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: '', description: '', location: '' });
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {showForm ? '✕ Close' : '+ Add Equipment'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingId ? 'Edit Equipment' : 'Add New Equipment'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Equipment Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="e.g., Oscilloscope"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Describe the equipment..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="e.g., Lab A"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  {editingId ? 'Update Equipment' : 'Add Equipment'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: '', description: '', location: '' });
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Equipment List */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {equipment.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No equipment added yet. Create your first equipment to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {equipment.map(item => (
                    <tr key={item.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-400 truncate">{item.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{item.location || '-'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(item.id, item.is_active)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            item.is_active
                              ? 'bg-green-900/30 text-green-300 border border-green-700 hover:bg-green-900/50'
                              : 'bg-red-900/30 text-red-300 border border-red-700 hover:bg-red-900/50'
                          }`}
                        >
                          {item.is_active ? '✓ Active' : '✕ Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold mr-4"
                        >
                          Edit
                        </button>
                        <Link
                          href={`/admin/equipment/${item.id}/slots`}
                          className="text-blue-400 hover:text-blue-300 font-semibold mr-4"
                        >
                          Slots
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-300 font-semibold"
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
