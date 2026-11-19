import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  FileCode2,
  Folder,
  FolderOpen,
  Layers,
  Server,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import {
  DATABASE_TABLES,
  FOLDER_TREE,
  FolderNode,
  MICROSERVICES,
  PHASE_CHECKLIST,
  SCHEMA_SQL_PREVIEW,
  STACK_MATRIX,
  WORKFLOW_TRACES,
} from '../data/phase1Data';

type TabKey = 'overview' | 'architecture' | 'database' | 'structure' | 'setup';

export default function ArchitectureBlueprintPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('appointment-service');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('booking');
  const [selectedTableName, setSelectedTableName] = useState<string>('appointments');
  const [schemaFilter, setSchemaFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({
    'healthcare-platform/': true,
    'backend/': true,
    'frontend/': true,
    'database/': true,
    'docs/': true,
    'docker/': true,
  });

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  const toggleDir = (name: string) => {
    setExpandedDirs((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const selectedService = MICROSERVICES.find((s) => s.id === selectedServiceId) || MICROSERVICES[0];
  const selectedWorkflow = WORKFLOW_TRACES.find((w) => w.id === selectedWorkflowId) || WORKFLOW_TRACES[0];
  const filteredTables =
    schemaFilter === 'all' ? DATABASE_TABLES : DATABASE_TABLES.filter((t) => t.schema === schemaFilter);
  const selectedTable = DATABASE_TABLES.find((t) => t.name === selectedTableName) || DATABASE_TABLES[0];

  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Project Checklist', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'architecture', label: 'Microservices', icon: <Layers className="w-4 h-4" /> },
    { key: 'database', label: 'Database & ER', icon: <Database className="w-4 h-4" /> },
    { key: 'structure', label: 'Folder Tree', icon: <Folder className="w-4 h-4" /> },
    { key: 'setup', label: 'Docker & Setup', icon: <Terminal className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-900 whitespace-nowrap">
            <span className="w-7 h-7 rounded-md bg-sky-600 text-white flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </span>
            <span>CareFlow Architecture</span>
          </Link>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeTab === item.key
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Open Live App</span>
        </Link>
      </header>

      <main className="flex-1 p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="text-xs font-medium text-teal-700">
                All 9 Phases Complete · Spring Boot 3.4.5 + React + PostgreSQL 16 + Spring AI
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
                Complete Platform Architecture &amp; Delivery Matrix
              </h1>
              <p className="text-sm text-slate-600 max-w-3xl">
                Full microservices repository generated under <code className="font-mono text-xs">/healthcare-platform/</code> alongside the live interactive CareFlow portal.
              </p>
            </div>

            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-900">9-Phase Implementation Checklist</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                      <th className="py-2.5 px-5 w-20">Phase</th>
                      <th className="py-2.5 px-4">Milestone</th>
                      <th className="py-2.5 px-4">Deliverables</th>
                      <th className="py-2.5 px-5 text-right w-32">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {PHASE_CHECKLIST.map((item) => (
                      <tr key={item.phase} className="hover:bg-slate-50/70">
                        <td className="py-3 px-5 font-mono text-xs font-medium text-slate-700 tabular-nums">
                          0{item.phase}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{item.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.summary}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 font-mono">
                          {item.deliverables.join(' · ')}
                        </td>
                        <td className="py-3 px-5 text-right text-xs font-medium text-teal-700 whitespace-nowrap">
                          Completed
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-900">Verified Stack Compatibility</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                      <th className="py-2.5 px-5">Layer</th>
                      <th className="py-2.5 px-4">Technology</th>
                      <th className="py-2.5 px-4">Version</th>
                      <th className="py-2.5 px-5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {STACK_MATRIX.map((row) => (
                      <tr key={row.layer}>
                        <td className="py-2.5 px-5 text-xs font-medium text-slate-500">{row.layer}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">{row.technology}</td>
                        <td className="py-2.5 px-4 font-mono text-xs text-sky-700 tabular-nums">{row.version}</td>
                        <td className="py-2.5 px-5 text-xs text-slate-600">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'architecture' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                {MICROSERVICES.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedServiceId(svc.id)}
                    className={`w-full text-left px-4 py-3.5 flex items-center justify-between ${
                      svc.id === selectedService.id ? 'bg-sky-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Server className="w-4 h-4 text-sky-600" />
                        <span>{svc.name}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">
                        :{svc.port} · {svc.schema}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>

              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
                <div className="text-xs font-mono text-sky-700">
                  {selectedService.id} · Port {selectedService.port} · {selectedService.schema}
                </div>
                <h2 className="text-lg font-bold text-slate-900">{selectedService.name}</h2>
                <p className="text-sm text-slate-600">{selectedService.role}</p>
                <ul className="space-y-1.5 text-sm text-slate-700 pt-2">
                  {selectedService.responsibilities.map((r) => (
                    <li key={r}>— {r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-base font-semibold text-slate-900">Service Communication Workflows</h2>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                  {WORKFLOW_TRACES.map((wf) => (
                    <button
                      key={wf.id}
                      onClick={() => setSelectedWorkflowId(wf.id)}
                      className={`px-3 py-1 text-xs font-medium rounded ${
                        selectedWorkflowId === wf.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {wf.id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                {selectedWorkflow.steps.map((s) => (
                  <div key={s.stepNumber} className="px-4 py-3 flex flex-col sm:flex-row gap-3 text-xs">
                    <span className="font-mono font-semibold text-sky-700 w-8">0{s.stepNumber}</span>
                    <span className="font-medium text-slate-900 sm:w-56 flex items-center gap-1">
                      {s.actor} <ArrowRight className="w-3 h-3 text-slate-400" /> {s.target}
                    </span>
                    <span className="text-slate-600">{s.action} — {s.detail}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-teal-800 pt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>PII redaction and non-diagnostic system guardrails are enforced server-side.</span>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
              <div className="p-3 flex flex-wrap gap-1">
                {['all', 'auth_schema', 'patient_schema', 'doctor_schema', 'appointment_schema', 'notification_schema'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSchemaFilter(s)}
                    className={`px-2 py-1 text-xs rounded ${schemaFilter === s ? 'bg-sky-50 text-sky-700 font-medium' : 'text-slate-600'}`}
                  >
                    {s === 'all' ? 'All' : s.replace('_schema', '')}
                  </button>
                ))}
              </div>
              {filteredTables.map((tbl) => (
                <button
                  key={tbl.name}
                  onClick={() => setSelectedTableName(tbl.name)}
                  className={`w-full text-left px-4 py-3 flex justify-between text-xs ${
                    tbl.name === selectedTable.name ? 'bg-sky-50/80 font-semibold' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>{tbl.schema}.{tbl.name}</span>
                  <span className="font-mono text-slate-400">{tbl.columns.length}</span>
                </button>
              ))}
            </div>
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <div className="text-xs font-mono text-teal-700">{selectedTable.schema}.{selectedTable.name}</div>
                <p className="text-xs text-slate-600 mt-1">{selectedTable.description}</p>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <th className="py-2 px-4">Column</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Key</th>
                    <th className="py-2 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedTable.columns.map((c) => (
                    <tr key={c.name}>
                      <td className="py-2 px-4 font-mono font-medium">{c.name}</td>
                      <td className="py-2 px-3 font-mono text-sky-700">{c.type}</td>
                      <td className="py-2 px-3 font-mono text-teal-700">{c.key || '—'}</td>
                      <td className="py-2 px-4 text-slate-600">{c.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <TreeRenderer nodes={FOLDER_TREE} expandedDirs={expandedDirs} onToggle={toggleDir} />
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Run Complete Platform via Docker Compose</h2>
              <button
                onClick={() => handleCopy('docker-cmd', 'cp .env.example .env && docker compose up --build -d')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50"
              >
                {copiedId === 'docker-cmd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'docker-cmd' ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 rounded-md p-4 text-xs font-mono overflow-x-auto">
{`cd healthcare-platform
cp .env.example .env
# Fill POSTGRES_PASSWORD, JWT_SECRET, and OPENAI_API_KEY in .env
docker compose up --build -d`}
            </pre>
            <pre className="bg-slate-900 text-slate-100 rounded-md p-4 text-xs font-mono overflow-x-auto">
              {SCHEMA_SQL_PREVIEW}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}

function TreeRenderer({
  nodes,
  expandedDirs,
  onToggle,
  depth = 0,
}: {
  nodes: FolderNode[];
  expandedDirs: Record<string, boolean>;
  onToggle: (name: string) => void;
  depth?: number;
}) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => {
        const isDir = node.type === 'dir';
        const isOpen = !!expandedDirs[node.name];
        return (
          <div key={node.name}>
            <div style={{ paddingLeft: `${depth * 18}px` }} className="py-1 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {isDir && node.children ? (
                  <button onClick={() => onToggle(node.name)} className="flex items-center gap-1.5 font-mono font-semibold text-slate-900">
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    {isOpen ? <FolderOpen className="w-4 h-4 text-sky-600" /> : <Folder className="w-4 h-4 text-sky-600" />}
                    <span>{node.name}</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 font-mono text-slate-700 pl-5">
                    {isDir ? <Folder className="w-4 h-4 text-slate-400" /> : <FileCode2 className="w-4 h-4 text-teal-600" />}
                    <span>{node.name}</span>
                  </span>
                )}
                <span className="text-slate-500 hidden sm:inline">— {node.description}</span>
              </div>
              <span className="font-mono text-slate-400">{node.phase}</span>
            </div>
            {isDir && isOpen && node.children && (
              <TreeRenderer nodes={node.children} expandedDirs={expandedDirs} onToggle={onToggle} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}
