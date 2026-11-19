import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage, patientApi } from '../services/apiClient';
import type { Patient } from '../types/healthcare';

export default function PatientProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    patientApi
      .getByUserId(user.id)
      .then(setPatient)
      .catch(() => {});
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setSaving(true);
    try {
      const updated = await patientApi.update(patient.id, patient);
      setPatient(updated);
      showToast('Medical profile updated', 'success');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell breadcrumb="Patient Portal / Medical Profile">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Profile</h1>
          <p className="text-sm text-slate-600 mt-1">
            Keep your emergency contact, blood group, and insurance details current.
          </p>
        </div>

        {!patient ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-xs text-slate-500">
            Loading patient profile...
          </div>
        ) : (
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                <input
                  value={patient.firstName}
                  onChange={(e) => setPatient({ ...patient, firstName: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  value={patient.lastName}
                  onChange={(e) => setPatient({ ...patient, lastName: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={patient.dateOfBirth}
                  onChange={(e) => setPatient({ ...patient, dateOfBirth: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Blood Group</label>
                <input
                  value={patient.bloodGroup}
                  onChange={(e) => setPatient({ ...patient, bloodGroup: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                <input
                  value={patient.phone}
                  onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Home Address</label>
              <input
                value={patient.address}
                onChange={(e) => setPatient({ ...patient, address: e.target.value })}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Contact</label>
                <input
                  value={patient.emergencyContact}
                  onChange={(e) => setPatient({ ...patient, emergencyContact: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Insurance Provider</label>
                <input
                  value={patient.insuranceProvider}
                  onChange={(e) => setPatient({ ...patient, insuranceProvider: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60 rounded-md"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
