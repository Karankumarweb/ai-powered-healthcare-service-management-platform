import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CalendarCheck } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { appointmentApi, doctorApi, extractErrorMessage, patientApi } from '../services/apiClient';
import type { Doctor, Patient } from '../types/healthcare';

const TIME_SLOTS = [
  { start: '09:00', end: '09:30' },
  { start: '09:30', end: '10:00' },
  { start: '10:00', end: '10:30' },
  { start: '10:30', end: '11:00' },
  { start: '11:00', end: '11:30' },
  { start: '14:00', end: '14:30' },
  { start: '14:30', end: '15:00' },
  { start: '15:00', end: '15:30' },
];

export default function AppointmentBookingPage() {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(
    Number(searchParams.get('doctorId')) || 1
  );
  const [selectedPatientId, setSelectedPatientId] = useState<number>(1);
  const [appointmentDate, setAppointmentDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [slotIdx, setSlotIdx] = useState<number>(2);
  const [visitType, setVisitType] = useState<'IN_PERSON' | 'VIDEO_TELEHEALTH'>('IN_PERSON');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    doctorApi.list().then((res) => {
      setDoctors(res.content);
      if (!searchParams.get('doctorId') && res.content.length > 0) {
        setSelectedDoctorId(res.content[0].id);
      }
    });

    if (hasRole('ROLE_ADMIN')) {
      patientApi.list().then((res) => {
        setPatients(res.content);
        if (res.content.length > 0) setSelectedPatientId(res.content[0].id);
      });
    } else if (user) {
      patientApi
        .getByUserId(user.id)
        .then((p) => {
          setPatients([p]);
          setSelectedPatientId(p.id);
        })
        .catch(() => {});
    }
  }, [user]);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!reason.trim()) {
      setError('Please describe the reason for your visit.');
      return;
    }

    const slot = TIME_SLOTS[slotIdx];
    setSubmitting(true);
    try {
      await appointmentApi.book({
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        appointmentDate,
        startTime: slot.start,
        endTime: slot.end,
        visitType,
        reason,
        notes,
      });
      showToast('Appointment confirmed and notification sent', 'success');
      navigate('/appointments');
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell breadcrumb="Scheduling / Book Appointment">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Book an Appointment</h1>
          <p className="text-sm text-slate-600 mt-1">
            Select a specialist and preferred time slot. Overlapping double-bookings are automatically prevented.
          </p>
        </div>

        <form onSubmit={handleBook} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Specialist Physician
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.firstName} {d.lastName} — {d.specialization} (${d.consultationFee})
                  </option>
                ))}
              </select>
            </div>

            {hasRole('ROLE_ADMIN') && patients.length > 0 ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Visit Type</label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-md">
                  <button
                    type="button"
                    onClick={() => setVisitType('IN_PERSON')}
                    className={`py-1.5 text-xs font-medium rounded ${
                      visitType === 'IN_PERSON' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    In Person
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitType('VIDEO_TELEHEALTH')}
                    className={`py-1.5 text-xs font-medium rounded ${
                      visitType === 'VIDEO_TELEHEALTH' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Telehealth
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedDoctor && (
            <div className="text-xs text-slate-600 border-y border-slate-100 py-3 flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-900">{selectedDoctor.department}</span>
              <span>·</span>
              <span>
                Weekly Hours:{' '}
                <span className="font-mono">
                  {selectedDoctor.availabilities
                    .filter((a) => a.available)
                    .map((a) => `${a.dayOfWeek.slice(0, 3)} ${a.startTime}–${a.endTime}`)
                    .join(' / ')}
                </span>
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Visit Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {hasRole('ROLE_ADMIN') && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Visit Type</label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-md">
                  <button
                    type="button"
                    onClick={() => setVisitType('IN_PERSON')}
                    className={`py-1.5 text-xs font-medium rounded ${
                      visitType === 'IN_PERSON' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    In Person
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitType('VIDEO_TELEHEALTH')}
                    className={`py-1.5 text-xs font-medium rounded ${
                      visitType === 'VIDEO_TELEHEALTH' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Telehealth
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">Select Time Slot</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot, idx) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => setSlotIdx(idx)}
                  className={`py-2 px-3 text-xs font-mono rounded-md border transition-colors tabular-nums ${
                    slotIdx === idx
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {slot.start} – {slot.end}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Reason for Visit
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual cardiovascular check-in"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Additional Notes (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferred pharmacy, mobility accommodations, or referral details..."
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60 rounded-md transition-colors"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{submitting ? 'Verifying Slot...' : 'Confirm Appointment'}</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
