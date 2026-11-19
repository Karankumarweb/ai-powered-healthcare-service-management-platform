import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { StatusText } from '../components/StatusText';
import { analyticsApi, appointmentApi, serviceRequestApi } from '../services/apiClient';
import type { AdminSummary, Appointment, ServiceRequest } from '../types/healthcare';

export default function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.summary(), appointmentApi.list(), serviceRequestApi.list()])
      .then(([sumRes, apptRes, reqRes]) => {
        setSummary(sumRes);
        setAppointments(apptRes.content.slice(0, 6));
        setRequests(reqRes.content.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  const maxSpec = Math.max(1, ...(summary?.bySpecialization.map((s) => s.appointments) || [1]));

  return (
    <AppShell
      breadcrumb="Workspace / Admin Operations Overview"
      primaryAction={
        <Link
          to="/book-appointment"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md whitespace-nowrap shrink-0"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>Schedule Visit</span>
        </Link>
      }
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Clinic Operations Overview
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Cross-service volume across patients, specialists, bookings, and service requests.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-24 bg-white border border-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Active Patients</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
                  {summary?.totalPatients ?? 0}
                </div>
                <div className="mt-1 text-xs text-slate-500">Registered profiles</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Specialists</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
                  {summary?.totalDoctors ?? 0}
                </div>
                <div className="mt-1 text-xs text-slate-500">Accepting bookings</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Confirmed Visits</div>
                <div className="mt-1 text-2xl font-semibold text-sky-700 tabular-nums">
                  {summary?.confirmedCount ?? 0}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {summary?.completedCount ?? 0} completed · {summary?.cancelledCount ?? 0} cancelled
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Open Service Requests</div>
                <div className="mt-1 text-2xl font-semibold text-teal-700 tabular-nums">
                  {summary?.openRequests ?? 0}
                </div>
                <div className="mt-1 text-xs text-slate-500">Pending coordinator review</div>
              </div>
            </section>

            {/* Specialization Volume Chart + Status Breakdown */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Appointments by Clinical Specialization
                  </h2>
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    Total {summary?.totalAppointments ?? 0}
                  </span>
                </div>
                <div className="space-y-3 pt-2">
                  {summary?.bySpecialization.map((row) => {
                    const pct = Math.round((row.appointments / maxSpec) * 100);
                    return (
                      <div key={row.specialization} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">{row.specialization}</span>
                          <span className="font-mono text-slate-900 tabular-nums">
                            {row.appointments} visits
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-sky-600 rounded transition-all"
                            style={{ width: `${Math.max(8, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">Recent Service Requests</h2>
                  <Link to="/service-requests" className="text-xs font-medium text-sky-700 hover:text-sky-800">
                    View all
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {requests.map((sr) => (
                    <div key={sr.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-900 truncate">{sr.subject}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {sr.patientName} · {sr.category.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <StatusText status={sr.status} />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Recent Appointments Table */}
            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Recent Appointments</h2>
                <Link to="/appointments" className="text-xs font-medium text-sky-700 hover:text-sky-800">
                  Manage all
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                      <th className="py-2.5 px-5">Patient</th>
                      <th className="py-2.5 px-4">Clinician</th>
                      <th className="py-2.5 px-4">Date &amp; Time</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {appointments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-5 font-medium text-slate-900">{a.patientName}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {a.doctorName} · {a.specialization}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 tabular-nums">
                          {a.appointmentDate} · {a.startTime}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {a.visitType === 'VIDEO_TELEHEALTH' ? 'Telehealth' : 'In Person'}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <StatusText status={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
