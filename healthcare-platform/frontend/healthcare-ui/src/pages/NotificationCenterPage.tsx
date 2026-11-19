import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/StatusText';
import { useToast } from '../context/ToastContext';
import { notificationApi } from '../services/apiClient';
import type { NotificationItem } from '../types/healthcare';

export default function NotificationCenterPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = () => {
    notificationApi.listMy().then((res) => setItems(res.content));
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: number) => {
    await notificationApi.markRead(id);
    load();
  };

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    showToast('All notifications marked read', 'success');
    load();
  };

  const visible = filter === 'unread' ? items.filter((n) => !n.read) : items;

  return (
    <AppShell
      breadcrumb="Inbox / Notification Center"
      primaryAction={
        items.some((n) => !n.read) ? (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md whitespace-nowrap shrink-0"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Notification Center
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Real-time confirmations, cancellations, and service request updates.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-md">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs font-medium rounded ${
                filter === 'unread' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Unread ({items.filter((i) => !i.read).length})
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
          {visible.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-5 h-5" />}
              title="Inbox is clear"
              description="Booking confirmations and schedule updates will appear here."
            />
          ) : (
            visible.map((n) => (
              <div
                key={n.id}
                className={`px-5 py-4 flex items-start justify-between gap-4 ${
                  n.read ? 'bg-white' : 'bg-sky-50/40'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{n.eventType.replace(/_/g, ' ')}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(n.sentAt).toLocaleString()}
                    </span>
                    {!n.read && (
                      <>
                        <span>·</span>
                        <span className="font-medium text-sky-700">Unread</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{n.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-xs font-medium text-sky-700 hover:text-sky-900 whitespace-nowrap shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
