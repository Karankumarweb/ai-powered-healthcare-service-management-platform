import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Stethoscope } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/StatusText';
import { doctorApi } from '../services/apiClient';
import type { Doctor } from '../types/healthcare';

const SPECIALIZATIONS = ['all', 'Cardiology', 'Family Medicine', 'Dermatology', 'Neurology'];

export default function DoctorDirectoryPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialization, setSpecialization] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDoctors = (spec = specialization, q = query) => {
    setLoading(true);
    doctorApi
      .list(spec, q)
      .then((res) => setDoctors(res.content))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDoctors('all', '');
  }, []);

  return (
    <AppShell breadcrumb="Directory / Physicians & Specialists">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Directory</h1>
            <p className="text-sm text-slate-600 mt-1">
              Filter by clinical specialization and inspect weekly availability before booking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-md overflow-x-auto">
              {SPECIALIZATIONS.map((sp) => (
                <button
                  key={sp}
                  onClick={() => {
                    setSpecialization(sp);
                    loadDoctors(sp, query);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition-colors ${
                    specialization === sp
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sp === 'all' ? 'All Specialties' : sp}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  loadDoctors(specialization, val);
                }}
                placeholder="Search doctor or dept..."
                className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-xs text-slate-500">Loading specialists...</div>
        ) : doctors.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg">
            <EmptyState
              icon={<Stethoscope className="w-5 h-5" />}
              title="No specialists matched"
              description="Try clearing the specialization filter or search keyword."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {doctors.map((doc) => (
              <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium text-teal-700">
                      {doc.specialization} · {doc.department}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                      Dr. {doc.firstName} {doc.lastName}
                    </h2>
                    <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                      License {doc.licenseNumber} · {doc.yearsExperience} years experience
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
                      ${doc.consultationFee}
                    </div>
                    <div className="text-xs text-slate-500">Consultation</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{doc.bio}</p>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 font-mono">
                    {doc.availabilities
                      .filter((a) => a.available)
                      .map((a) => `${a.dayOfWeek.slice(0, 3)} ${a.startTime}–${a.endTime}`)
                      .join(' · ') || 'Schedule on request'}
                  </div>
                  <Link
                    to={`/book-appointment?doctorId=${doc.id}`}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md whitespace-nowrap shrink-0 text-center"
                  >
                    Book Visit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
