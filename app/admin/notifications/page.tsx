'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/theme-context';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', type: 'general' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const checkAuthAndFetchNotifications = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Check if user is admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileData?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);

      // Fetch notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setNotifications(data || []);
      }

      setLoading(false);
    };

    checkAuthAndFetchNotifications();
  }, [router]);

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setErrorMessage('Session not found. Please login again.');
        setSubmitting(false);
        return;
      }

      // Debug: Check user's profile role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      console.log('Session user ID:', session.user.id);
      console.log('User profile role:', profileData?.role);
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      // Check if user is actually an admin
      if (profileData?.role !== 'admin') {
        setErrorMessage('You do not have permission to create notifications. Only admins can create notifications.');
        setSubmitting(false);
        return;
      }

      const { error, data: insertedData } = await supabase.from('notifications').insert([
        {
          title: formData.title,
          message: formData.message,
          type: formData.type,
          is_active: true,
          created_by: session.user.id,
        },
      ]);

      console.log('Insert response - error:', error, 'data:', insertedData);

      if (error) {
        console.error('Notification insert failed:', error);
        console.log('User role check result:', profileData?.role === 'admin');
        
        // RLS errors often come back as empty objects
        const errorMsg = error?.message || (Object.keys(error).length === 0 ? 'Permission denied by database policy. Verify your admin role in the database.' : JSON.stringify(error));
        setErrorMessage(`Error: ${errorMsg}`);
      } else {
        setFormData({ title: '', message: '', type: 'general' });
        setShowForm(false);
        setSuccessMessage('Notification created successfully!');
        
        // Refresh notifications
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        setNotifications(data || []);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setErrorMessage(`Unexpected error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleNotificationStatus = async (id: string, currentStatus: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, is_active: !currentStatus } : n
        )
      );
    }
  };

  const deleteNotification = async (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      const supabase = createClient();
      const { error } = await supabase.from('notifications').delete().eq('id', id);

      if (!error) {
        setNotifications(notifications.filter((n) => n.id !== id));
      }
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-gray-900'} flex items-center justify-center`}>
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <Link href="/admin/dashboard" className="text-lg font-bold">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Notifications Management</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {showForm ? 'Cancel' : 'Create Notification'}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <p className="text-green-700 dark:text-green-400">{successMessage}</p>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <form
            onSubmit={handleCreateNotification}
            className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} border rounded-lg p-6 mb-8`}
          >
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notification Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter notification title"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notification Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="general">General</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notification Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter notification message"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Notification'}
              </button>
            </div>
          </form>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <p>No notifications yet. Create one to get started!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`${notification.is_active ? (theme === 'dark' ? 'border-green-700 bg-green-900/20' : 'border-green-200 bg-green-50') : (theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50')} border rounded-lg p-6`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          notification.is_active
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {notification.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      Created: {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleNotificationStatus(notification.id, notification.is_active)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        notification.is_active
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {notification.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
