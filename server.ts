import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI, Type } from '@google/genai';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const ACCESS_EXPIRY_MS = 15 * 60 * 1000;

const MEDICAL_DISCLAIMER =
  'Informational guidance only: This assistant does not diagnose diseases, prescribe medications, or replace licensed medical advice. For urgent symptoms, contact emergency services immediately.';

// ============================================================================
// In-Memory Relational Store (mirrors PostgreSQL schema-per-service 1:1)
// ============================================================================
interface UserRecord {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  roles: string[];
  enabled: boolean;
  createdAt: string;
}

interface RefreshTokenRecord {
  token: string;
  userId: number;
  expiresAt: number;
  revoked: boolean;
}

interface PatientRecord {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  emergencyContact: string;
  insuranceProvider: string;
  active: boolean;
  createdAt: string;
}

interface AvailabilitySlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  available: boolean;
}

interface DoctorRecord {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  yearsExperience: number;
  consultationFee: number;
  department: string;
  bio: string;
  acceptingPatients: boolean;
  availabilities: AvailabilitySlot[];
}

interface AppointmentRecord {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  visitType: 'IN_PERSON' | 'VIDEO_TELEHEALTH';
  reason: string;
  notes?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  cancellationReason?: string;
  createdAt: string;
}

interface ServiceRequestRecord {
  id: number;
  patientId: number;
  patientName: string;
  category: string;
  subject: string;
  description: string;
  aiSummary?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

interface NotificationRecord {
  id: number;
  recipientId: number;
  recipientEmail: string;
  appointmentId?: number;
  channel: 'IN_APP' | 'EMAIL';
  eventType: string;
  title: string;
  message: string;
  read: boolean;
  deliveryStatus: 'SENT';
  sentAt: string;
}

// Development demo credentials generated via bcrypt at startup
const DEMO_PASS_ADMIN = process.env.DEMO_ADMIN_PASS || 'AdminCare#2026';
const DEMO_PASS_DOCTOR = process.env.DEMO_DOCTOR_PASS || 'DoctorCare#2026';
const DEMO_PASS_PATIENT = process.env.DEMO_PATIENT_PASS || 'PatientCare#2026';

const users: UserRecord[] = [
  {
    id: 1,
    email: 'admin@careflow.local',
    passwordHash: bcrypt.hashSync(DEMO_PASS_ADMIN, 10),
    fullName: 'Elena Vance',
    roles: ['ROLE_ADMIN'],
    enabled: true,
    createdAt: new Date('2026-01-12T09:00:00Z').toISOString(),
  },
  {
    id: 2,
    email: 'dr.patel@careflow.local',
    passwordHash: bcrypt.hashSync(DEMO_PASS_DOCTOR, 10),
    fullName: 'Dr. Aarav Patel',
    roles: ['ROLE_DOCTOR'],
    enabled: true,
    createdAt: new Date('2026-01-15T10:30:00Z').toISOString(),
  },
  {
    id: 3,
    email: 'dr.chen@careflow.local',
    passwordHash: bcrypt.hashSync(DEMO_PASS_DOCTOR, 10),
    fullName: 'Dr. Maya Chen',
    roles: ['ROLE_DOCTOR'],
    enabled: true,
    createdAt: new Date('2026-01-20T11:00:00Z').toISOString(),
  },
  {
    id: 4,
    email: 'patient.miller@careflow.local',
    passwordHash: bcrypt.hashSync(DEMO_PASS_PATIENT, 10),
    fullName: 'Liam Miller',
    roles: ['ROLE_PATIENT'],
    enabled: true,
    createdAt: new Date('2026-02-02T14:15:00Z').toISOString(),
  },
  {
    id: 5,
    email: 'patient.garcia@careflow.local',
    passwordHash: bcrypt.hashSync(DEMO_PASS_PATIENT, 10),
    fullName: 'Sofia Garcia',
    roles: ['ROLE_PATIENT'],
    enabled: true,
    createdAt: new Date('2026-02-10T16:40:00Z').toISOString(),
  },
];

const refreshTokens: RefreshTokenRecord[] = [];

const patients: PatientRecord[] = [
  {
    id: 1,
    userId: 4,
    firstName: 'Liam',
    lastName: 'Miller',
    dateOfBirth: '1991-04-18',
    gender: 'MALE',
    phone: '+1-555-0211',
    email: 'patient.miller@careflow.local',
    address: '742 Cedar Grove Ave, Seattle, WA',
    bloodGroup: 'O+',
    emergencyContact: 'Claire Miller (+1-555-0212)',
    insuranceProvider: 'BlueCross Health',
    active: true,
    createdAt: '2026-02-02T14:15:00Z',
  },
  {
    id: 2,
    userId: 5,
    firstName: 'Sofia',
    lastName: 'Garcia',
    dateOfBirth: '1987-09-25',
    gender: 'FEMALE',
    phone: '+1-555-0244',
    email: 'patient.garcia@careflow.local',
    address: '118 Harbor View Rd, Seattle, WA',
    bloodGroup: 'A+',
    emergencyContact: 'Mateo Garcia (+1-555-0245)',
    insuranceProvider: 'Aetna Care',
    active: true,
    createdAt: '2026-02-10T16:40:00Z',
  },
  {
    id: 3,
    userId: 101,
    firstName: 'Noah',
    lastName: 'Bennett',
    dateOfBirth: '1979-11-04',
    gender: 'MALE',
    phone: '+1-555-0288',
    email: 'noah.bennett@careflow.local',
    address: '410 Pine Crest Blvd, Bellevue, WA',
    bloodGroup: 'B+',
    emergencyContact: 'Hannah Bennett (+1-555-0289)',
    insuranceProvider: 'UnitedHealthcare',
    active: true,
    createdAt: '2026-03-01T08:20:00Z',
  },
  {
    id: 4,
    userId: 102,
    firstName: 'Amara',
    lastName: 'Okafor',
    dateOfBirth: '1995-07-12',
    gender: 'FEMALE',
    phone: '+1-555-0315',
    email: 'amara.okafor@careflow.local',
    address: '905 Mercer St, Seattle, WA',
    bloodGroup: 'AB-',
    emergencyContact: 'Chidi Okafor (+1-555-0316)',
    insuranceProvider: 'Kaiser Permanente',
    active: true,
    createdAt: '2026-03-14T13:10:00Z',
  },
];

const doctors: DoctorRecord[] = [
  {
    id: 1,
    userId: 2,
    firstName: 'Aarav',
    lastName: 'Patel',
    email: 'dr.patel@careflow.local',
    phone: '+1-555-0142',
    specialization: 'Cardiology',
    licenseNumber: 'MED-CA-88421',
    yearsExperience: 12,
    consultationFee: 180,
    department: 'Heart & Vascular Center',
    bio: 'Board-certified cardiologist focusing on preventive cardiovascular care, lipid management, and non-invasive diagnostics.',
    acceptingPatients: true,
    availabilities: [
      { id: 1, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, available: true },
      { id: 2, dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, available: true },
      { id: 3, dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '14:00', slotDurationMinutes: 30, available: true },
    ],
  },
  {
    id: 2,
    userId: 3,
    firstName: 'Maya',
    lastName: 'Chen',
    email: 'dr.chen@careflow.local',
    phone: '+1-555-0198',
    specialization: 'Family Medicine',
    licenseNumber: 'MED-CA-77319',
    yearsExperience: 8,
    consultationFee: 120,
    department: 'Primary Care',
    bio: 'Primary care clinician specializing in longitudinal wellness exams, immunizations, and chronic condition coordination.',
    acceptingPatients: true,
    availabilities: [
      { id: 4, dayOfWeek: 'TUESDAY', startTime: '08:30', endTime: '16:30', slotDurationMinutes: 30, available: true },
      { id: 5, dayOfWeek: 'THURSDAY', startTime: '08:30', endTime: '16:30', slotDurationMinutes: 30, available: true },
    ],
  },
  {
    id: 3,
    userId: 201,
    firstName: 'Julian',
    lastName: 'Reyes',
    email: 'dr.reyes@careflow.local',
    phone: '+1-555-0175',
    specialization: 'Dermatology',
    licenseNumber: 'MED-CA-64210',
    yearsExperience: 10,
    consultationFee: 160,
    department: 'Clinical Dermatology',
    bio: 'Clinical dermatologist dedicated to skin cancer screenings, eczema management, and outpatient dermatologic procedures.',
    acceptingPatients: true,
    availabilities: [
      { id: 6, dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '16:00', slotDurationMinutes: 30, available: true },
      { id: 7, dayOfWeek: 'THURSDAY', startTime: '10:00', endTime: '16:00', slotDurationMinutes: 30, available: true },
    ],
  },
  {
    id: 4,
    userId: 202,
    firstName: 'Nadia',
    lastName: 'Al-Mansoor',
    email: 'dr.mansoor@careflow.local',
    phone: '+1-555-0164',
    specialization: 'Neurology',
    licenseNumber: 'MED-CA-91044',
    yearsExperience: 14,
    consultationFee: 210,
    department: 'Neurosciences Institute',
    bio: 'Neurologist treating migraine disorders, sleep neurology, and outpatient nerve conduction evaluations.',
    acceptingPatients: true,
    availabilities: [
      { id: 8, dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '15:00', slotDurationMinutes: 30, available: true },
      { id: 9, dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '15:00', slotDurationMinutes: 30, available: true },
    ],
  },
];

const addDaysIso = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const appointments: AppointmentRecord[] = [
  {
    id: 1,
    patientId: 1,
    doctorId: 1,
    appointmentDate: addDaysIso(2),
    startTime: '09:30',
    endTime: '10:00',
    visitType: 'IN_PERSON',
    reason: 'Annual cardiovascular screening and blood pressure follow-up',
    notes: 'Bring prior lipid panel printout',
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    patientId: 2,
    doctorId: 2,
    appointmentDate: addDaysIso(3),
    startTime: '10:00',
    endTime: '10:30',
    visitType: 'VIDEO_TELEHEALTH',
    reason: 'Routine primary care check-in and immunization review',
    status: 'SCHEDULED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    patientId: 3,
    doctorId: 1,
    appointmentDate: addDaysIso(-4),
    startTime: '11:00',
    endTime: '11:30',
    visitType: 'IN_PERSON',
    reason: 'Resting ECG review and exercise clearance',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 4,
    patientId: 4,
    doctorId: 3,
    appointmentDate: addDaysIso(5),
    startTime: '14:00',
    endTime: '14:30',
    visitType: 'IN_PERSON',
    reason: 'Annual dermatology skin check',
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  },
];

const serviceRequests: ServiceRequestRecord[] = [
  {
    id: 1,
    patientId: 1,
    patientName: 'Liam Miller',
    category: 'MEDICAL_RECORDS',
    subject: 'Request digital copy of prior ECG summary',
    description: 'I need a PDF copy of my annual screening records before switching insurance next month.',
    aiSummary: 'Patient requests a digital PDF copy of prior ECG screening records ahead of an upcoming insurance transition.',
    priority: 'MEDIUM',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    patientId: 2,
    patientName: 'Sofia Garcia',
    category: 'BILLING_INSURANCE',
    subject: 'Update Aetna Care policy member ID',
    description: 'My employer renewed our group insurance plan and issued a new subscriber number effective this month.',
    aiSummary: 'Administrative insurance update request to replace Aetna Care subscriber policy number on file.',
    priority: 'LOW',
    status: 'IN_REVIEW',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const notifications: NotificationRecord[] = [
  {
    id: 1,
    recipientId: 4,
    recipientEmail: 'patient.miller@careflow.local',
    appointmentId: 1,
    channel: 'IN_APP',
    eventType: 'APPOINTMENT_BOOKED',
    title: 'Appointment Confirmed with Dr. Aarav Patel',
    message: `Your cardiology visit on ${addDaysIso(2)} at 09:30 is confirmed. Please bring a photo ID and insurance card.`,
    read: false,
    deliveryStatus: 'SENT',
    sentAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 2,
    recipientId: 2,
    recipientEmail: 'dr.patel@careflow.local',
    appointmentId: 1,
    channel: 'IN_APP',
    eventType: 'APPOINTMENT_BOOKED',
    title: 'New Patient Visit Scheduled',
    message: `Liam Miller booked an in-person cardiology visit for ${addDaysIso(2)} at 09:30.`,
    read: false,
    deliveryStatus: 'SENT',
    sentAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 3,
    recipientId: 1,
    recipientEmail: 'admin@careflow.local',
    channel: 'IN_APP',
    eventType: 'SERVICE_REQUEST_UPDATED',
    title: 'New Medical Records Request (#1)',
    message: 'Liam Miller submitted a records request requiring coordinator review.',
    read: false,
    deliveryStatus: 'SENT',
    sentAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

let nextId = 50;

// ============================================================================
// Helpers: JWT, Auth Middleware, PII Redaction, Gemini Client
// ============================================================================
interface AuthPayload {
  sub: string;
  userId: number;
  fullName: string;
  roles: string[];
}

interface AuthedRequest extends Request {
  user?: AuthPayload;
}

function issueTokens(user: UserRecord) {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      fullName: user.fullName,
      roles: user.roles,
    },
    JWT_SECRET,
    { subject: user.email, expiresIn: '15m' }
  );

  const refreshToken = crypto.randomUUID() + '-' + crypto.randomUUID();
  refreshTokens.push({
    token: refreshToken,
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    revoked: false,
  });

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresInMs: ACCESS_EXPIRY_MS,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      enabled: user.enabled,
      createdAt: user.createdAt,
    },
  };
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ status: 401, error: 'Unauthorized', message: 'Missing Bearer token' });
    return;
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ status: 401, error: 'Unauthorized', message: 'Invalid or expired JWT token' });
  }
}

function requireRole(...allowed: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles || [];
    if (!allowed.some((r) => userRoles.includes(r))) {
      res.status(403).json({ status: 403, error: 'Forbidden', message: 'Insufficient role permissions' });
      return;
    }
    next();
  };
}

function sanitizePii(raw: string): { text: string; redacted: boolean } {
  let text = raw.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]');
  text = text.replace(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]');
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_ID]');
  return { text, redacted: text !== raw };
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

// ============================================================================
// Express App & REST API Routes (/api/v1/**)
// ============================================================================
async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. AUTH SERVICE ROUTES
  app.post('/api/v1/auth/register', (req: Request, res: Response) => {
    const { fullName, email, password, role } = req.body || {};
    if (!fullName || !email || !password || String(password).length < 8) {
      res.status(400).json({ message: 'Full name, valid email, and password (min 8 chars) are required.' });
      return;
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (users.some((u) => u.email === normalizedEmail)) {
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }

    const assignedRole = String(role).toUpperCase().includes('DOCTOR') ? 'ROLE_DOCTOR' : 'ROLE_PATIENT';
    const newUser: UserRecord = {
      id: nextId++,
      email: normalizedEmail,
      passwordHash: bcrypt.hashSync(String(password), 10),
      fullName: String(fullName).trim(),
      roles: [assignedRole],
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);

    const parts = newUser.fullName.split(/\s+/);
    const firstName = parts[0] || newUser.fullName;
    const lastName = parts.slice(1).join(' ') || 'Member';

    if (assignedRole === 'ROLE_PATIENT') {
      patients.push({
        id: nextId++,
        userId: newUser.id,
        firstName,
        lastName,
        dateOfBirth: '1994-01-01',
        gender: 'PREFER_NOT_TO_SAY',
        phone: '+1-555-0100',
        email: normalizedEmail,
        address: 'Seattle, WA',
        bloodGroup: 'O+',
        emergencyContact: '',
        insuranceProvider: 'Self-Pay / Pending',
        active: true,
        createdAt: new Date().toISOString(),
      });
    } else {
      doctors.push({
        id: nextId++,
        userId: newUser.id,
        firstName,
        lastName,
        email: normalizedEmail,
        phone: '+1-555-0190',
        specialization: 'General Practice',
        licenseNumber: `MED-CA-${Math.floor(10000 + Math.random() * 89999)}`,
        yearsExperience: 5,
        consultationFee: 140,
        department: 'Outpatient Clinic',
        bio: 'Newly onboarded CareFlow physician.',
        acceptingPatients: true,
        availabilities: [
          { id: nextId++, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, available: true },
          { id: nextId++, dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, available: true },
        ],
      });
    }

    res.status(201).json(issueTokens(newUser));
  });

  app.post('/api/v1/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = users.find((u) => u.email === normalizedEmail);
    if (!user || !bcrypt.compareSync(String(password || ''), user.passwordHash)) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    refreshTokens.forEach((rt) => {
      if (rt.userId === user.id) rt.revoked = true;
    });
    res.json(issueTokens(user));
  });

  // Convenient development-only quick-role endpoint returning credentials info or tokens for the 3 seeded demo personas
  app.post('/api/v1/auth/demo-login', (req: Request, res: Response) => {
    const { role } = req.body || {};
    const emailMap: Record<string, string> = {
      ADMIN: 'admin@careflow.local',
      DOCTOR: 'dr.patel@careflow.local',
      PATIENT: 'patient.miller@careflow.local',
    };
    const targetEmail = emailMap[String(role || '').toUpperCase()];
    const user = users.find((u) => u.email === targetEmail);
    if (!user) {
      res.status(404).json({ message: 'Demo persona not found' });
      return;
    }
    res.json(issueTokens(user));
  });

  app.post('/api/v1/auth/refresh', (req: Request, res: Response) => {
    const { refreshToken } = req.body || {};
    const existing = refreshTokens.find((rt) => rt.token === refreshToken);
    if (!existing || existing.revoked || existing.expiresAt < Date.now()) {
      res.status(401).json({ message: 'Refresh token expired or revoked' });
      return;
    }
    existing.revoked = true;
    const user = users.find((u) => u.id === existing.userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    res.json(issueTokens(user));
  });

  app.post('/api/v1/auth/logout', requireAuth, (req: AuthedRequest, res: Response) => {
    refreshTokens.forEach((rt) => {
      if (rt.userId === req.user?.userId) rt.revoked = true;
    });
    res.json({ message: 'Logged out and refresh tokens revoked' });
  });

  app.get('/api/v1/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = users.find((u) => u.id === req.user?.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      enabled: user.enabled,
      createdAt: user.createdAt,
    });
  });

  app.put('/api/v1/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = users.find((u) => u.id === req.user?.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (req.body?.fullName) user.fullName = String(req.body.fullName).trim();
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      enabled: user.enabled,
      createdAt: user.createdAt,
    });
  });

  // 2. PATIENT SERVICE ROUTES
  app.get('/api/v1/patients', requireAuth, requireRole('ROLE_ADMIN', 'ROLE_DOCTOR'), (req: Request, res: Response) => {
    const q = String(req.query.query || '').trim().toLowerCase();
    const page = Math.max(0, Number(req.query.page || 0));
    const size = Math.max(1, Number(req.query.size || 20));
    const filtered = patients.filter(
      (p) =>
        p.active &&
        (!q ||
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q))
    );
    const start = page * size;
    res.json({
      content: filtered.slice(start, start + size),
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      page,
      size,
    });
  });

  app.get('/api/v1/patients/by-user/:userId', requireAuth, (req: Request, res: Response) => {
    const patient = patients.find((p) => p.userId === Number(req.params.userId));
    if (!patient) {
      res.status(404).json({ message: 'Patient profile not found' });
      return;
    }
    res.json(patient);
  });

  app.get('/api/v1/patients/:id', requireAuth, (req: Request, res: Response) => {
    const patient = patients.find((p) => p.id === Number(req.params.id));
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }
    res.json(patient);
  });

  app.post('/api/v1/patients', requireAuth, requireRole('ROLE_ADMIN', 'ROLE_PATIENT'), (req: Request, res: Response) => {
    const body = req.body || {};
    if (!body.firstName || !body.lastName || !body.email) {
      res.status(400).json({ message: 'First name, last name, and email are required.' });
      return;
    }
    const created: PatientRecord = {
      id: nextId++,
      userId: body.userId || nextId++,
      firstName: String(body.firstName).trim(),
      lastName: String(body.lastName).trim(),
      dateOfBirth: body.dateOfBirth || '1990-01-01',
      gender: body.gender || 'OTHER',
      phone: body.phone || '+1-555-0100',
      email: String(body.email).trim().toLowerCase(),
      address: body.address || '',
      bloodGroup: body.bloodGroup || 'O+',
      emergencyContact: body.emergencyContact || '',
      insuranceProvider: body.insuranceProvider || '',
      active: true,
      createdAt: new Date().toISOString(),
    };
    patients.push(created);
    res.status(201).json(created);
  });

  app.put('/api/v1/patients/:id', requireAuth, (req: Request, res: Response) => {
    const patient = patients.find((p) => p.id === Number(req.params.id));
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }
    Object.assign(patient, {
      firstName: req.body.firstName ?? patient.firstName,
      lastName: req.body.lastName ?? patient.lastName,
      dateOfBirth: req.body.dateOfBirth ?? patient.dateOfBirth,
      gender: req.body.gender ?? patient.gender,
      phone: req.body.phone ?? patient.phone,
      address: req.body.address ?? patient.address,
      bloodGroup: req.body.bloodGroup ?? patient.bloodGroup,
      emergencyContact: req.body.emergencyContact ?? patient.emergencyContact,
      insuranceProvider: req.body.insuranceProvider ?? patient.insuranceProvider,
    });
    res.json(patient);
  });

  app.delete('/api/v1/patients/:id', requireAuth, requireRole('ROLE_ADMIN'), (req: Request, res: Response) => {
    const patient = patients.find((p) => p.id === Number(req.params.id));
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }
    patient.active = false;
    res.status(204).send();
  });

  // 3. DOCTOR SERVICE ROUTES
  app.get('/api/v1/doctors', (req: Request, res: Response) => {
    const spec = String(req.query.specialization || '').trim().toLowerCase();
    const q = String(req.query.query || '').trim().toLowerCase();
    const filtered = doctors.filter(
      (d) =>
        (!spec || spec === 'all' || d.specialization.toLowerCase().includes(spec)) &&
        (!q ||
          d.firstName.toLowerCase().includes(q) ||
          d.lastName.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q))
    );
    res.json({ content: filtered, totalElements: filtered.length });
  });

  app.get('/api/v1/doctors/by-user/:userId', requireAuth, (req: Request, res: Response) => {
    const doc = doctors.find((d) => d.userId === Number(req.params.userId));
    if (!doc) {
      res.status(404).json({ message: 'Doctor profile not found' });
      return;
    }
    res.json(doc);
  });

  app.get('/api/v1/doctors/:id', (req: Request, res: Response) => {
    const doc = doctors.find((d) => d.id === Number(req.params.id));
    if (!doc) {
      res.status(404).json({ message: 'Doctor not found' });
      return;
    }
    res.json(doc);
  });

  app.put('/api/v1/doctors/:id/availability', requireAuth, requireRole('ROLE_ADMIN', 'ROLE_DOCTOR'), (req: Request, res: Response) => {
    const doc = doctors.find((d) => d.id === Number(req.params.id));
    if (!doc) {
      res.status(404).json({ message: 'Doctor not found' });
      return;
    }
    const slots = Array.isArray(req.body) ? req.body : [];
    doc.availabilities = slots.map((s: AvailabilitySlot) => ({
      id: nextId++,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDurationMinutes: s.slotDurationMinutes || 30,
      available: s.available !== false,
    }));
    res.json(doc.availabilities);
  });

  // 4. APPOINTMENT SERVICE ROUTES (with real double-booking & availability checks)
  const enrichAppointment = (a: AppointmentRecord) => {
    const p = patients.find((pt) => pt.id === a.patientId);
    const d = doctors.find((dr) => dr.id === a.doctorId);
    return {
      ...a,
      patientName: p ? `${p.firstName} ${p.lastName}` : `Patient #${a.patientId}`,
      doctorName: d ? `Dr. ${d.firstName} ${d.lastName}` : `Doctor #${a.doctorId}`,
      specialization: d?.specialization || 'General',
    };
  };

  app.get('/api/v1/appointments', requireAuth, (req: AuthedRequest, res: Response) => {
    const roles = req.user?.roles || [];
    let list = appointments;
    if (roles.includes('ROLE_PATIENT') && !roles.includes('ROLE_ADMIN')) {
      const pt = patients.find((p) => p.userId === req.user?.userId);
      list = pt ? appointments.filter((a) => a.patientId === pt.id) : [];
    } else if (roles.includes('ROLE_DOCTOR') && !roles.includes('ROLE_ADMIN')) {
      const dr = doctors.find((d) => d.userId === req.user?.userId);
      list = dr ? appointments.filter((a) => a.doctorId === dr.id) : [];
    }
    res.json({ content: list.map(enrichAppointment), totalElements: list.length });
  });

  app.post('/api/v1/appointments', requireAuth, (req: AuthedRequest, res: Response) => {
    const { patientId, doctorId, appointmentDate, startTime, endTime, visitType, reason, notes } = req.body || {};
    if (!patientId || !doctorId || !appointmentDate || !startTime || !endTime || !reason) {
      res.status(400).json({ message: 'Patient, doctor, date, time window, and reason are required.' });
      return;
    }
    if (endTime <= startTime) {
      res.status(400).json({ message: 'End time must be after start time.' });
      return;
    }

    const patient = patients.find((p) => p.id === Number(patientId));
    const doctor = doctors.find((d) => d.id === Number(doctorId));
    if (!patient || !doctor) {
      res.status(404).json({ message: 'Patient or Doctor not found.' });
      return;
    }

    const overlap = appointments.some(
      (a) =>
        a.doctorId === doctor.id &&
        a.appointmentDate === appointmentDate &&
        ['SCHEDULED', 'CONFIRMED', 'RESCHEDULED'].includes(a.status) &&
        a.startTime < endTime &&
        a.endTime > startTime
    );

    if (overlap) {
      res.status(409).json({
        status: 409,
        error: 'Slot Conflict',
        message: `Time slot ${startTime}–${endTime} on ${appointmentDate} overlaps with an existing booking for Dr. ${doctor.lastName}.`,
      });
      return;
    }

    const created: AppointmentRecord = {
      id: nextId++,
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentDate,
      startTime,
      endTime,
      visitType: visitType || 'IN_PERSON',
      reason: String(reason).trim(),
      notes,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };
    appointments.unshift(created);

    // Trigger automatic notification
    notifications.unshift({
      id: nextId++,
      recipientId: patient.userId,
      recipientEmail: patient.email,
      appointmentId: created.id,
      channel: 'IN_APP',
      eventType: 'APPOINTMENT_BOOKED',
      title: `Appointment Confirmed with Dr. ${doctor.firstName} ${doctor.lastName}`,
      message: `Scheduled for ${appointmentDate} at ${startTime}.`,
      read: false,
      deliveryStatus: 'SENT',
      sentAt: new Date().toISOString(),
    });

    res.status(201).json(enrichAppointment(created));
  });

  app.patch('/api/v1/appointments/:id/reschedule', requireAuth, (req: Request, res: Response) => {
    const appt = appointments.find((a) => a.id === Number(req.params.id));
    if (!appt) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }
    const { appointmentDate, startTime, endTime } = req.body || {};
    if (!appointmentDate || !startTime || !endTime || endTime <= startTime) {
      res.status(400).json({ message: 'Valid date and time window are required' });
      return;
    }
    const overlap = appointments.some(
      (a) =>
        a.id !== appt.id &&
        a.doctorId === appt.doctorId &&
        a.appointmentDate === appointmentDate &&
        ['SCHEDULED', 'CONFIRMED', 'RESCHEDULED'].includes(a.status) &&
        a.startTime < endTime &&
        a.endTime > startTime
    );
    if (overlap) {
      res.status(409).json({ message: 'Requested reschedule window overlaps with another appointment.' });
      return;
    }
    appt.appointmentDate = appointmentDate;
    appt.startTime = startTime;
    appt.endTime = endTime;
    appt.status = 'RESCHEDULED';
    res.json(enrichAppointment(appt));
  });

  app.patch('/api/v1/appointments/:id/cancel', requireAuth, (req: Request, res: Response) => {
    const appt = appointments.find((a) => a.id === Number(req.params.id));
    if (!appt) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }
    appt.status = 'CANCELLED';
    appt.cancellationReason = req.body?.reason || 'Cancelled by user';

    const patient = patients.find((p) => p.id === appt.patientId);
    if (patient) {
      notifications.unshift({
        id: nextId++,
        recipientId: patient.userId,
        recipientEmail: patient.email,
        appointmentId: appt.id,
        channel: 'IN_APP',
        eventType: 'APPOINTMENT_CANCELLED',
        title: 'Appointment Cancelled',
        message: `Your visit scheduled on ${appt.appointmentDate} at ${appt.startTime} was cancelled.`,
        read: false,
        deliveryStatus: 'SENT',
        sentAt: new Date().toISOString(),
      });
    }
    res.json(enrichAppointment(appt));
  });

  app.patch('/api/v1/appointments/:id/complete', requireAuth, requireRole('ROLE_DOCTOR', 'ROLE_ADMIN'), (req: Request, res: Response) => {
    const appt = appointments.find((a) => a.id === Number(req.params.id));
    if (!appt) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }
    appt.status = 'COMPLETED';
    res.json(enrichAppointment(appt));
  });

  // 5. SERVICE REQUESTS ROUTES
  app.get('/api/v1/service-requests', requireAuth, (req: AuthedRequest, res: Response) => {
    const roles = req.user?.roles || [];
    let list = serviceRequests;
    if (roles.includes('ROLE_PATIENT') && !roles.includes('ROLE_ADMIN')) {
      const pt = patients.find((p) => p.userId === req.user?.userId);
      list = pt ? serviceRequests.filter((sr) => sr.patientId === pt.id) : [];
    }
    res.json({ content: list, totalElements: list.length });
  });

  app.post('/api/v1/service-requests', requireAuth, (req: AuthedRequest, res: Response) => {
    const { patientId, category, subject, description, aiSummary, priority } = req.body || {};
    const pt = patients.find((p) => p.id === Number(patientId)) || patients.find((p) => p.userId === req.user?.userId);
    if (!pt || !category || !subject || !description) {
      res.status(400).json({ message: 'Category, subject, and description are required.' });
      return;
    }
    const created: ServiceRequestRecord = {
      id: nextId++,
      patientId: pt.id,
      patientName: `${pt.firstName} ${pt.lastName}`,
      category,
      subject: String(subject).trim(),
      description: String(description).trim(),
      aiSummary,
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    serviceRequests.unshift(created);
    res.status(201).json(created);
  });

  app.patch('/api/v1/service-requests/:id/status', requireAuth, requireRole('ROLE_ADMIN', 'ROLE_DOCTOR'), (req: Request, res: Response) => {
    const sr = serviceRequests.find((item) => item.id === Number(req.params.id));
    if (!sr) {
      res.status(404).json({ message: 'Service request not found' });
      return;
    }
    if (req.body?.status) sr.status = req.body.status;
    if (req.body?.aiSummary) sr.aiSummary = req.body.aiSummary;
    res.json(sr);
  });

  // 6. NOTIFICATION SERVICE ROUTES
  app.get('/api/v1/notifications/my', requireAuth, (req: AuthedRequest, res: Response) => {
    const isAdmin = req.user?.roles.includes('ROLE_ADMIN');
    const list = isAdmin
      ? notifications
      : notifications.filter((n) => n.recipientId === req.user?.userId);
    res.json({ content: list, totalElements: list.length });
  });

  app.patch('/api/v1/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
    const n = notifications.find((item) => item.id === Number(req.params.id));
    if (!n) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }
    n.read = true;
    res.json(n);
  });

  app.patch('/api/v1/notifications/read-all', requireAuth, (req: AuthedRequest, res: Response) => {
    const isAdmin = req.user?.roles.includes('ROLE_ADMIN');
    notifications.forEach((n) => {
      if (isAdmin || n.recipientId === req.user?.userId) n.read = true;
    });
    res.json({ message: 'All notifications marked read' });
  });

  // 7. AI ASSISTANT SERVICE ROUTES (Server-side Gemini via @google/genai + PII redaction)
  app.post('/api/v1/ai/chat', requireAuth, async (req: AuthedRequest, res: Response) => {
    const { message, consentToProcess, history } = req.body || {};
    if (!consentToProcess) {
      res.status(400).json({ message: 'Explicit privacy consent is required before sending your message to the AI Assistant.' });
      return;
    }
    if (!message || !String(message).trim()) {
      res.status(400).json({ message: 'Message cannot be empty.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        message: 'AI Assistant requires GEMINI_API_KEY configured in the Secrets panel.',
      });
      return;
    }

    const sanitized = sanitizePii(String(message));
    const historyTranscript = Array.isArray(history)
      ? history
          .slice(-6)
          .map((turn: { role: string; content: string }) => `${turn.role}: ${sanitizePii(turn.content).text}`)
          .join('\n')
      : '';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: historyTranscript
          ? `Recent conversation:\n${historyTranscript}\n\nUser question: ${sanitized.text}`
          : sanitized.text,
        config: {
          systemInstruction:
            'You are CareFlow Healthcare Service Assistant. Answer general platform FAQs, explain how to book/reschedule/cancel appointments, list documents to bring (photo ID, insurance card, medication list, prior records), and guide patients on submitting Service Requests. NEVER diagnose medical conditions, interpret clinical results, prescribe medication, or replace licensed medical advice. If emergency symptoms are mentioned, direct the user to call emergency services immediately. Keep answers clear, structured, and under 160 words.',
        },
      });

      res.json({
        reply: response.text || 'Unable to generate a response.',
        disclaimer: MEDICAL_DISCLAIMER,
        suggestedNextSteps: ['Open Appointment Booking', 'Browse Doctor Directory', 'Submit a Service Request'],
        piiRedacted: sanitized.redacted,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upstream AI service error';
      res.status(502).json({ message: `AI service error: ${msg}` });
    }
  });

  app.post('/api/v1/ai/summarize-request', requireAuth, async (req: AuthedRequest, res: Response) => {
    const { category, subject, description, consentToProcess } = req.body || {};
    if (!consentToProcess) {
      res.status(400).json({ message: 'Consent is required before AI summarization.' });
      return;
    }
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        message: 'AI summarization requires GEMINI_API_KEY configured in the Secrets panel.',
      });
      return;
    }

    const cleanSubject = sanitizePii(String(subject || '')).text;
    const cleanDesc = sanitizePii(String(description || '')).text;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Summarize this administrative healthcare service request without making medical diagnoses.\nCategory: ${category}\nSubject: ${cleanSubject}\nDescription: ${cleanDesc}`,
        config: {
          systemInstruction:
            'Return a concise structured administrative summary for clinic coordinators. Never diagnose diseases or prescribe treatments.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              conciseSummary: { type: Type.STRING },
              recommendedDepartment: { type: Type.STRING },
              urgencyLevel: { type: Type.STRING },
              actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      });
      const parsed = JSON.parse(response.text || '{}');
      res.json({
        ...parsed,
        disclaimer: MEDICAL_DISCLAIMER,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI summarization error';
      res.status(502).json({ message: msg });
    }
  });

  // Admin Analytics Snapshot Route
  app.get('/api/v1/analytics/summary', requireAuth, requireRole('ROLE_ADMIN'), (_req: Request, res: Response) => {
    const totalPatients = patients.filter((p) => p.active).length;
    const totalDoctors = doctors.length;
    const totalAppointments = appointments.length;
    const confirmedCount = appointments.filter((a) => ['CONFIRMED', 'SCHEDULED', 'RESCHEDULED'].includes(a.status)).length;
    const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
    const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;
    const openRequests = serviceRequests.filter((sr) => sr.status === 'OPEN' || sr.status === 'IN_REVIEW').length;

    const bySpecialization = doctors.map((d) => ({
      specialization: d.specialization,
      appointments: appointments.filter((a) => a.doctorId === d.id).length,
    }));

    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      confirmedCount,
      completedCount,
      cancelledCount,
      openRequests,
      bySpecialization,
    });
  });

  // Vite / Static Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareFlow Healthcare Platform server listening on http://localhost:${PORT}`);
  });
}

startServer();
