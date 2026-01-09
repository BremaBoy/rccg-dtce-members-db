'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');

  useEffect(() => {
    checkAuthAndLoadSettings();
  }, []);

  const checkAuthAndLoadSettings = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/admin/login');
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminData) {
        router.push('/admin/login');
        return;
      }

      // Load settings
      const { data: settings, error: settingsError } = await supabase
        .from('admin_settings')
        .select('notification_email')
        .single();

      if (!settingsError && settings) {
        setNotificationEmail(settings.notification_email);
      } else {
        // If no settings exist, use default
        setNotificationEmail('brematech27@gmail.com');
      }
    } catch (err) {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const supabase = createClient();

      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from('admin_settings')
        .select('id')
        .single();

      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('admin_settings')
          .update({ notification_email: notificationEmail })
          .eq('id', existingSettings.id);

        if (updateError) throw updateError;
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('admin_settings')
          .insert({ notification_email: notificationEmail });

        if (insertError) throw insertError;
      }

      setSuccess('Settings saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Image
                src="/images/dtce-logo.png"
                alt="DTCE Logo"
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-2">Configure notification preferences and system settings</p>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {/* Email Notifications Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Email Notifications</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Birthday Notification Schedule</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Midnight notification sent at 00:00 AM on member's birthday</li>
                      <li>Day-before reminder sent at 00:00 AM the day before birthday</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="notificationEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="notificationEmail"
                  required
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="admin@dtce.org"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Birthday notifications will be sent to this email address
                </p>
              </div>
            </div>

            {/* Default Email Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Default Email</h3>
              <p className="text-sm text-gray-600">
                The default notification email is: <span className="font-mono bg-white px-2 py-1 rounded">brematech27@gmail.com</span>
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Portal Version</span>
              <span className="font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Database</span>
              <span className="font-medium text-gray-900">Supabase PostgreSQL</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Notification Service</span>
              <span className="font-medium text-gray-900">Supabase Edge Functions</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
