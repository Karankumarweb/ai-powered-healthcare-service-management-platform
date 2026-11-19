import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, ShieldCheck, Stethoscope } from 'lucide-react';
import { doctorApi } from '../services/apiClient';
import { useAuth, getDashboardPathForUser } from '../context/AuthContext';
import type { Doctor } from '../types/healthcare';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    doctorApi
      .list()
      .then((res) => setDoctors(res.content.slice(0, 4)))
      .catch(() => {});
  }, []);

  const primaryCtaTarget = isAuthenticated && user ? getDashboardPathForUser(user) : '/book-appointment';

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Top Bar Contract: Zone 1 Wordmark — Zone 2 4 Nav Links — Zone 3 1 Primary CTA */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <Link to="/" className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            CareFlow
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#capabilities" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Capabilities
            </a>
            <a href="#specialists" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Specialists
            </a>
            <Link to="/blueprint" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Architecture
            </Link>
            <Link
              to={isAuthenticated && user ? getDashboardPathForUser(user) : '/login'}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              {isAuthenticated ? 'Dashboard' : 'Sign In'}
            </Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={primaryCtaTarget}
              className="px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              {isAuthenticated ? 'Open Workspace' : 'Book Visit'}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Split */}
        <section className="max-w-6xl mx-auto px-6 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-xs font-medium text-teal-700">
              Outpatient Care Coordination · Seattle Clinical Network
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 text-balance leading-tight">
              Coordinated clinical scheduling and patient service care.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              Book verified specialist visits with automatic conflict protection, track medical
              records requests, and get clear pre-visit guidance through our privacy-first AI
              service assistant.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <span>Access Care Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Create Patient Account
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-72 lg:h-full min-h-[320px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src="/src/assets/images/clinic_hero_architecture_1794910565147.jpg"
                alt="Sunlit modern CareFlow outpatient reception atrium"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Full-Width Clinical Proof Strip */}
        <section className="border-y border-slate-200 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">7</div>
              <div className="text-xs text-slate-600 mt-1">Independent microservices behind API Gateway</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">0</div>
              <div className="text-xs text-slate-600 mt-1">Overlapping slots permitted per clinician</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">3 Roles</div>
              <div className="text-xs text-slate-600 mt-1">Patient, Physician, and Administrator RBAC</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-teal-700 tabular-nums">100%</div>
              <div className="text-xs text-slate-600 mt-1">PII-sanitized backend AI service workflow</div>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section id="capabilities" className="max-w-6xl mx-auto px-6 py-16 space-y-10">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Built for clinics, physicians, and patients
            </h2>
            <p className="text-sm text-slate-600">
              Every module maps directly to an isolated service with strict validation and role access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-slate-200 rounded-xl p-6 space-y-3 bg-white">
              <CalendarCheck className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-semibold text-slate-900">
                01. Conflict-Free Scheduling
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Verifies clinician weekly availability windows and enforces transactional overlap
                checks so no doctor is ever double-booked.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-6 space-y-3 bg-white">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-semibold text-slate-900">
                02. Role-Tailored Workspaces
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Dedicated consoles for Patients, Physicians, and Clinic Administrators powered by
                stateless JWT authentication and refresh rotation.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-6 space-y-3 bg-white">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-semibold text-slate-900">
                03. Guarded AI Service Desk
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Answers appointment FAQs and summarizes service requests with automatic PII
                redaction and non-diagnostic clinical boundaries.
              </p>
            </div>
          </div>
        </section>

        {/* Verified Specialists Directory Preview */}
        <section id="specialists" className="border-t border-slate-200 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6 py-16 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Featured Specialists
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Live data served from the Doctor Directory microservice.
                </p>
              </div>
              <Link
                to="/login"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap"
              >
                Sign in to book an appointment
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {doctors.map((doc) => (
                <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
                  <div className="text-xs font-medium text-teal-700">
                    {doc.specialization} · {doc.yearsExperience} yrs
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Dr. {doc.firstName} {doc.lastName}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{doc.bio}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{doc.department}</span>
                    <span className="font-mono text-slate-900 tabular-nums">${doc.consultationFee}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>CareFlow Healthcare Service Management Platform</div>
          <div className="flex items-center gap-6">
            <Link to="/blueprint" className="hover:text-slate-900">System Architecture</Link>
            <Link to="/login" className="hover:text-slate-900">Sign In</Link>
            <Link to="/register" className="hover:text-slate-900">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
