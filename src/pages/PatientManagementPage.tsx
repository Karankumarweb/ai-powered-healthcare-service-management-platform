import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Users, X } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/StatusText';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage, patientApi } from '../services/apiClient';
import type { Patient } from '../types/healthcare';

export default function PatientManagementPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+1-555-0190',
    dateOfBirth: '1992-06-15',
    gender: 'FEMALE' as Patient['gender'],
    bloodGroup: 'O+',
    insuranceProvider: 'BlueCross Health',
  });

  const loadPatients = async (search = query) => {
    setLoading(true);
    try {
      const res = await patientApi.list(search, 0, 50);
      setPatients(res.content);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients('');
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await patientApi.create(form);
      showToast('Patient record created', 'success');
      setShowModal(false);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '+1-555-0190',
        dateOfBirth: '1992-06-15',
        gender: 'FEMALE',
        bloodGroup: 'O+',
        insuranceProvider: 'BlueCross Health',
      });
      loadPatients();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await patientApi.remove(id);
      showToast('Patient deactivated', 'info');
      loadPatients();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  return (
    <AppShell
      breadcrumb="Directory / Patient Management"
      primaryAction={
        hasRole('ROLE_ADMIN') ? (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Patient</span>
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Directory</h1>
            <p className="text-sm text-slate-600 mt-1">
              Search active patient profiles, insurance carriers, and emergency contacts.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadPatients(query);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or email..."
                className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800"
            >
              Search
            </button>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-xs text-slate-500">Loading patient directory...</div>
          ) : patients.length === 0 ? (
            <EmptyState
              icon={<Users className="w-5 h-5" />}
              title="No matching patients found"
              description="Adjust your search query or add a new patient record."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                    <th className="py-2.5 px-5">Patient</th>
                    <th className="py-2.5 px-4">DOB</th>
                    <th className="py-2.5 px-4">Phone</th>
                    <th className="py-2.5 px-4">Blood</th>
                    <th className="py-2.5 px-4">Insurance</th>
                    {hasRole('ROLE_ADMIN') && <th className="py-2.5 px-5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-5">
                        <div className="font-semibold text-slate-900">
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-slate-500">{p.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 tabular-nums">
                        {p.dateOfBirth}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 tabular-nums">{p.phone}</td>
                      <td className="py-3 px-4 font-mono text-teal-700">{p.bloodGroup || '—'}</td>
                      <td className="py-3 px-4 text-slate-700">{p.insuranceProvider || '—'}</td>
                      {hasRole('ROLE_ADMIN') && (
                        <td className="py-3 px-5 text-right">
                          <button
                            onClick={() => handleDelete(p.id)}
                            aria-label={`Deactivate ${p.firstName}`}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">Register New Patient</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First name</label>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last name</label>
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">DOB</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Blood Group</label>
                  <input
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Insurance</label>
                  <input
                    value={form.insuranceProvider}
                    onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md"
                >
                  Save Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
