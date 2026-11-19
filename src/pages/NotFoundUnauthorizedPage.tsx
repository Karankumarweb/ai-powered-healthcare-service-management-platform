import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { getDashboardPathForUser, useAuth } from '../context/AuthContext';

export default function NotFoundUnauthorizedPage({ mode }: { mode: 'unauthorized' | 'notfound' }) {
  const { user } = useAuth();
  const homePath = user ? getDashboardPathForUser(user) : '/';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
        <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
          <ShieldOff className="w-5 h-5" />
        </div>
        <div className="text-xs font-mono text-slate-500">
          {mode === 'unauthorized' ? '403 · Access Restricted' : '404 · Page Not Found'}
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          {mode === 'unauthorized'
            ? 'You do not have permission to view this page'
            : 'The requested page could not be found'}
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          {mode === 'unauthorized'
            ? 'Your current role cannot access this clinical or administrative route.'
            : 'Check the URL or return to your primary workspace.'}
        </p>
        <div className="pt-2">
          <Link
            to={homePath}
            className="inline-flex px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
