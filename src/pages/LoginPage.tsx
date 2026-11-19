import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, AlertCircle } from 'lucide-react';
import { getDashboardPathForUser, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../services/apiClient';

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const profile = await login(email, password);
      showToast(`Signed in as ${profile.fullName}`, 'success');
      navigate(getDashboardPathForUser(profile));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async (role: 'ADMIN' | 'DOCTOR' | 'PATIENT') => {
    setError('');
    setSubmitting(true);
    try {
      const profile = await demoLogin(role);
      showToast(`Signed in with ${role.toLowerCase()} workspace`, 'success');
      navigate(getDashboardPathForUser(profile));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-900 font-bold text-lg">
            <span className="w-7 h-7 rounded-md bg-sky-600 text-white flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </span>
            <span>CareFlow Health</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h1>
          <p className="text-sm text-slate-600">
            Access your clinical schedule, patient portal, or administration console.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-medium text-slate-700">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@careflow.local"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-medium text-slate-700">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60 rounded-md transition-colors"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-5 border-t border-slate-100 space-y-3">
            <p className="text-xs font-medium text-slate-500 text-center">
              Quick Development Workspace Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDemo('PATIENT')}
                className="py-2 px-2.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
              >
                Patient
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDemo('DOCTOR')}
                className="py-2 px-2.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
              >
                Doctor
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDemo('ADMIN')}
                className="py-2 px-2.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600">
          New to CareFlow?{' '}
          <Link to="/register" className="font-medium text-sky-700 hover:text-sky-800">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
