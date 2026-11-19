import React, { useState } from 'react';
import { Bot, Send, ShieldAlert, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { aiApi, extractErrorMessage } from '../services/apiClient';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  disclaimer?: string;
  piiRedacted?: boolean;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  'How can I book an appointment?',
  'How can I cancel an appointment?',
  'What documents should I bring?',
  'How can I contact my doctor?',
  'How do I submit a healthcare service request?',
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am CareFlow’s Healthcare Service Assistant. I can help you navigate appointment booking, rescheduling, cancellation policies, documents to bring, and submitting service requests.',
      disclaimer:
        'Informational guidance only: This assistant does not diagnose diseases, prescribe medications, or replace licensed medical professionals.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async (questionText?: string) => {
    const text = (questionText ?? input).trim();
    if (!text || loading) return;

    if (!consent) {
      setError('Please confirm privacy consent below before sending a message.');
      return;
    }

    setError('');
    if (!questionText) setInput('');

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setLoading(true);

    try {
      const res = await aiApi.chat({
        message: text,
        consentToProcess: consent,
        history: nextHistory.map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'assistant',
          content: res.reply,
          disclaimer: res.disclaimer,
          piiRedacted: res.piiRedacted,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setError('');
    setMessages((prev) => prev.slice(0, 1));
  };

  return (
    <AppShell
      breadcrumb="AI Service Desk / Healthcare Assistant"
      primaryAction={
        <button
          onClick={clearChat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md whitespace-nowrap shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear chat</span>
        </button>
      }
    >
      <div className="max-w-4xl space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Medical Safety Notice:</strong> This assistant provides clinic workflow and
            preparation guidance only. It does not diagnose illnesses or prescribe medication.
            Sensitive identifiers (emails, phone numbers, SSNs) are automatically redacted before
            server-side AI processing.
          </span>
        </div>

        {/* Suggested Questions */}
        <div className="flex flex-wrap items-center gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => sendMessage(q)}
              className="px-3 py-1.5 text-xs font-medium text-sky-800 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 rounded-md transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Container */}
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-[520px] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-xl px-4 py-3 space-y-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs opacity-80">
                    {msg.role === 'assistant' && <Bot className="w-3.5 h-3.5 text-teal-700" />}
                    <span className="font-medium">
                      {msg.role === 'user' ? 'You' : 'CareFlow Assistant'}
                    </span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">{msg.timestamp}</span>
                    {msg.piiRedacted && (
                      <>
                        <span>·</span>
                        <span className="text-teal-700 font-medium">PII Redacted</span>
                      </>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                  {msg.disclaimer && (
                    <p className="pt-2 border-t border-slate-200 text-xs text-slate-500">
                      {msg.disclaimer}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500">
                  Assistant is preparing guidance...
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="px-5 py-2.5 bg-red-50 border-t border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-4 border-t border-slate-200 bg-slate-50 space-y-3"
          >
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="rounded border-slate-300 text-sky-600"
              />
              <span>
                I consent to send my non-diagnostic question through the backend AI service (do not
                include sensitive personal details).
              </span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about appointments, clinic prep, or service requests..."
                className="flex-1 bg-white border border-slate-300 rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
