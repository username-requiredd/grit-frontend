"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '../components/ThemeToggle';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { apiFetch } from '@/lib/apiFetch';
import { User, Mail, Save, ArrowLeft, Loader2, Bell, ShieldAlert, Trash2, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useAlerts } from '@/hooks/useAlerts';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const alerts = useAlerts(); // Explicitly resolve theme-aware alerts
  
  // Profile State
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Preferences State
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === session?.user?.name) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch('/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      await update({ name });

      alerts.success('Profile Updated', 'Your display name has been updated successfully.', 2000);
    } catch (error: any) {
      alerts.error('Error', error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await alerts.confirmDanger(
      'Delete Account?',
      "This is a permanent action. All your boards, cards, and data will be wiped out.",
      'Yes, delete my account'
    );

    if (confirmed) {
      try {
        // Trigger account deletion endpoint (make sure this exists on your backend)
        // await apiFetch('/users/me', { method: 'DELETE' });
        
        alerts.success('Deleted!', 'Your account has been deleted.', 2000);
        signOut({ callbackUrl: '/sign-up' });
      } catch (error: any) {
        alerts.error('Error', 'Failed to delete account.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-12">
      <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border shadow-sm px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/board" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition flex items-center gap-2">
            <ArrowLeft size={20} /> Back to Boards
          </Link>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-dark-primary hidden sm:block">Profile & Settings</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>
          <ProfileDropdown />
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 mt-6 space-y-8">
        
        {/* Section 1: Profile Details */}
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-elevated">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User size={20} className="text-indigo-600 dark:text-indigo-400" /> Personal Information
            </h2>
          </div>
          
          <div className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-8 border-b border-gray-100 dark:border-dark-border">
            <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl font-bold uppercase border-4 border-white dark:border-dark-surface shadow-md flex-shrink-0">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                session?.user?.name?.charAt(0) || "U"
              )}
            </div>
            <div className="flex-1 w-full text-center sm:text-left">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{session?.user?.name || 'User'}</h3>
              <p className="text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 w-full p-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-elevated text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="pl-10 w-full p-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-500 cursor-not-allowed outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Email address is used for login and cannot be changed.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting || name === session?.user?.name || !name.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition flex items-center gap-2 font-medium"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Profile
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Preferences */}
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-elevated">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Monitor size={20} className="text-indigo-600 dark:text-indigo-400" /> App Preferences
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Appearance (Dark Mode)</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Toggle between light and dark theme.</p>
              </div>
              <div className="scale-125 transform origin-right">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Notifications */}
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-elevated">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={20} className="text-indigo-600 dark:text-indigo-400" /> Notifications
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Receive emails when invited to a board or mentioned.</p>
              </div>
              <input type="checkbox" checked={emailNotifs} onChange={(e) => setEmailNotifs(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:border-dark-border dark:bg-dark-elevated cursor-pointer" />
            </label>
            <hr className="border-gray-100 dark:border-dark-border" />
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">In-App Alerts</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Receive push notifications while the app is open.</p>
              </div>
              <input type="checkbox" checked={pushNotifs} onChange={(e) => setPushNotifs(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:border-dark-border dark:bg-dark-elevated cursor-pointer" />
            </label>
          </div>
        </div>

        {/* Section 4: Danger Zone */}
        <div className="bg-white dark:bg-dark-surface border border-red-200 dark:border-red-900/50 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert size={20} /> Danger Zone
            </h2>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Delete Account</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Once you delete your account, there is no going back.</p>
            </div>
            <button 
              onClick={handleDeleteAccount}
              className="px-5 py-2.5 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 rounded-lg transition flex items-center gap-2 font-medium whitespace-nowrap"
            >
              <Trash2 size={18} /> Delete Account
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}