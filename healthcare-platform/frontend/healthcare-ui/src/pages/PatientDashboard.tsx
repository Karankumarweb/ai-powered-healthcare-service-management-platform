import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, CalendarCheck, CalendarPlus } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { EmptyState, StatusText } from '../components/StatusText';
import { useAuth } from '../context/AuthContext';
import { appointmentApi, notificationApi, serviceRequestApi } from '../services/apiClient';
import type { Appointment, NotificationItem, ServiceRequest } from '../types/healthcare';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([appointmentApi.list(), serviceRequestApi.list(), notificationApi.listMy()])
      .then(([apptRes, srRes, notifRes]) => {
        setAppointments(apptRes.content);
        setRequests(srRes.content);
        setNotifications(notifRes.content.slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter((a) => ['CONFIRMED', 'SCHEDULED', 'RESCHEDULED'].includes(a.status));

  return (
    <AppShell
      breadcrumb="Patient Portal / Overview"
      primaryAction={
        <Link
          to="/book-appointment"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md whitespace-nowrap shrink-0"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>Book Appointment</span>
        </Link>
      }
    >
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.fullName}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage your upcoming visits, pre-visit preparations, and support tickets.
            </p>
          </div>
          <Link
            to="/ai-assistant"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-md whitespace-nowrap shrink-0"
          >
            <Bot className="w-4 h-4" />
            <span>Ask AI Service Assistant</span>
          </Link>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500">Upcoming Visits</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
              {upcoming.length}
            </div>
            <div className="mt-1 text-xs text-slate-500">Confirmed or scheduled</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500">Service Requests</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
              {requests.length}
            </div>
            <div className="mt-1 text-xs text-slate-500">Records &amp; billing inquiries</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500">Unread Alerts</div>
            <div className="mt-1 text-2xl font-semibold text-sky-700 tabular-nums">
              {notifications.filter((n) => !n.read).length}
            </div>
            <div className="mt-1 text-xs text-slate-500">Appointment confirmations &amp; updates</div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Your Upcoming Appointments</h2>
              <Link to="/appointments" className="text-xs font-medium text-sky-700 hover:text-sky-800">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="p-6 text-xs text-slate-500">Loading appointments...</div>
            ) : upcoming.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck className="w-5 h-5" />}
                title="No upcoming visits scheduled"
                description="Browse our specialist directory and reserve an open time slot."
                action={
                  <Link
                    to="/book-appointment"
                    className="px-4 py-2 text-xs font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                  >
                    Book First Visit
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {upcoming.map((a) => (
                  <div key={a.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">
                        {a.doctorName} · {a.specialization}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                        {a.appointmentDate} · {a.startTime}–{a.endTime} ·{' '}
                        {a.visitType === 'VIDEO_TELEHEALTH' ? 'Telehealth' : 'In Person'}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 truncate">{a.reason}</div>
                    </div>
                    <StatusText status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Recent Notifications</h2>
              <Link to="/notifications" className="text-xs font-medium text-sky-700 hover:text-sky-800">
                Inbox
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-xs text-slate-500">No notifications yet.</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="px-5 py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">{n.title}</span>
                      {!n.read && <span className="text-xs font-medium text-sky-700">New</span>}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
