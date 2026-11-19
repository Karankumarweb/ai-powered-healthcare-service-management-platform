import React, { useEffect, useState } from 'react';
import { Bot, ClipboardList, Plus, X } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { EmptyState, StatusText } from '../components/StatusText';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { aiApi, extractErrorMessage, serviceRequestApi } from '../services/apiClient';
import type { ServiceRequest } from '../types/healthcare';

export default function ServiceRequestsPage() {
  const { primaryRole } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [category, setCategory] = useState('MEDICAL_RECORDS');
  const [priority, setPriority] = useState('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  const load = () => {
    serviceRequestApi.list().then((res) => setRequests(res.content));
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerateSummary = async () => {
    if (!subject.trim() || !description.trim()) {
      showToast('Enter a subject and description first.', 'error');
      return;
    }
    setSummarizing(true);
    try {
      const res = await aiApi.summarizeRequest({
        category,
        subject,
        description,
        consentToProcess: true,
      });
      setAiSummary(`${res.conciseSummary} (Suggested Dept: ${res.recommendedDepartment})`);
      showToast('Structured AI summary generated', 'success');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSummarizing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await serviceRequestApi.create({
        category,
        priority,
        subject,
        description,
        aiSummary: aiSummary || undefined,
      });
      showToast('Service request submitted', 'success');
      setShowCreate(false);
      setSubject('');
      setDescription('');
      setAiSummary('');
      load();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await serviceRequestApi.updateStatus(id, status);
      showToast(`Ticket #${id} updated to ${status}`, 'success');
      load();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  return (
    <AppShell
      breadcrumb="Support / Healthcare Service Requests"
      primaryAction={
        primaryRole !== 'DOCTOR' ? (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Request</span>
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Healthcare Service Requests
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Submit records, billing, or scheduling assistance requests with optional AI summarization.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
          {requests.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-5 h-5" />}
              title="No service requests yet"
              description="Submit a request for medical records copies, billing checks, or referrals."
            />
          ) : (
            requests.map((sr) => (
              <div key={sr.id} className="p-5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-medium text-slate-700">#{sr.id}</span>
                    <span>·</span>
                    <span>{sr.patientName}</span>
                    <span>·</span>
                    <span>{sr.category.replace(/_/g, ' ')}</span>
                    <span>·</span>
                    <StatusText status={sr.priority} />
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusText status={sr.status} />
                    {(primaryRole === 'ADMIN' || primaryRole === 'DOCTOR') && (
                      <select
                        value={sr.status}
                        onChange={(e) => updateStatus(sr.id, e.target.value)}
                        aria-label={`Change status for request ${sr.id}`}
                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-slate-900">{sr.subject}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{sr.description}</p>

                {sr.aiSummary && (
                  <div className="bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2.5 text-xs text-slate-700">
                    <span className="font-semibold text-teal-800 mr-1.5">AI Summary:</span>
                    {sr.aiSummary}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">Submit Service Request</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs bg-white"
                  >
                    <option value="MEDICAL_RECORDS">Medical Records</option>
                    <option value="BILLING_INSURANCE">Billing &amp; Insurance</option>
                    <option value="SCHEDULING_HELP">Scheduling Assistance</option>
                    <option value="REFERRAL_FOLLOWUP">Referral Follow-up</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                <input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Short summary of your request"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe how our patient services team can assist..."
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs"
                />
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={summarizing}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>{summarizing ? 'Summarizing...' : 'Generate Safe AI Summary Preview'}</span>
                </button>
                {aiSummary && (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-700">
                    {aiSummary}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
