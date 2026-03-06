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
    student_id: '',
    department: '',
    year: '',
    mobile_no: '',
    user_type: 'student',
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
          student_id: profileData.student_id || '',
          department: profileData.department || '',
          year: profileData.year || '',
          mobile_no: profileData.mobile_no || '',
          user_type: profileData.user_type || 'student',
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
        student_id: formData.student_id,
        department: formData.department,
        year: formData.year,
        mobile_no: formData.mobile_no,
        user_type: formData.user_type,
      })
      .eq('id', session.user.id);

    if (!error) {
      setMessage('Profile updated successfully!');
      setMessageType('success');
      setEditing(false);
      setProfile({ ...profile, ...formData });
    } else {
      setMessage('Failed to update profile: ' + error.message);
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
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">PRN ID</label>
                <input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g. 1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g. Computer Engineering"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Year</option>
                    <option value="FY">FY</option>
                    <option value="SY">SY</option>
                    <option value="TY">TY</option>
                    <option value="BTech">BTech</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Role</label>
                  <select
                    value={formData.user_type}
                    onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobile_no}
                  onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="flex gap-4 pt-2">
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
                      student_id: profile.student_id || '',
                      department: profile.department || '',
                      year: profile.year || '',
                      mobile_no: profile.mobile_no || '',
                      user_type: profile.user_type || 'student',
                    });
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-lg transition-colors border border-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Email Address</p>
                <p className="text-lg font-semibold text-white">{profile?.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">First Name</p>
                  <p className="text-lg font-semibold text-white">{profile?.first_name || '—'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Last Name</p>
                  <p className="text-lg font-semibold text-white">{profile?.last_name || '—'}</p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">PRN ID</p>
                <p className="text-lg font-semibold text-white">{profile?.student_id || '—'}</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Department</p>
                <p className="text-lg font-semibold text-white">{profile?.department || '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Year</p>
                  <p className="text-lg font-semibold text-white">{profile?.year || '—'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Role</p>
                  <p className="text-lg font-bold text-blue-400 capitalize">{profile?.user_type || '—'}</p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Mobile Number</p>
                <p className="text-lg font-semibold text-white">{profile?.mobile_no || '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Account Role</p>
                  <p className="text-lg font-bold text-blue-400 uppercase tracking-wider">{profile?.role}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Member Since</p>
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
