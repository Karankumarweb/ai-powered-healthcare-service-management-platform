import React, { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi, extractErrorMessage } from '../services/apiClient';

export default function UserProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    try {
      await authApi.updateMe(fullName);
      await refreshProfile();
      showToast('Account profile updated', 'success');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell breadcrumb="Account / User Profile">
      <div className="max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your authenticated CareFlow identity and role assignment.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input
              disabled
              value={user?.email || ''}
              className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Assigned Roles:</span>
            <span className="font-mono text-slate-900">{user?.roles.join(', ')}</span>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md"
            >
              {saving ? 'Updating...' : 'Save Name'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
