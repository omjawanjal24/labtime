'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFormData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
        });
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleSave = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
      })
      .eq('id', session.user.id);

    if (!error) {
      setMessage('Profile updated successfully!');
      setMessageType('success');
      setEditing(false);
      setProfile({
        ...profile,
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
    } else {
      setMessage('Failed to update profile');
      setMessageType('error');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl p-8">
          <h1 className="text-4xl font-bold mb-8">Profile Settings</h1>

          {message && (
            <div className={`mb-8 p-4 rounded-lg border ${
              messageType === 'success'
                ? 'bg-green-900/20 text-green-300 border-green-700'
                : 'bg-red-900/20 text-red-300 border-red-700'
            }`}>
              {message}
            </div>
          )}

          {editing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      first_name: profile.first_name || '',
                      last_name: profile.last_name || '',
                    });
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-lg transition-colors border border-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Email Address</p>
                <p className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {profile?.email}
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">Full Name</p>
                <p className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {profile?.first_name} {profile?.last_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">Account Role</p>
                  <p className="text-lg font-bold text-blue-400 uppercase tracking-wider">{profile?.role}</p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">Member Since</p>
                  <p className="text-lg font-semibold text-white">
                    {new Date(profile?.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
