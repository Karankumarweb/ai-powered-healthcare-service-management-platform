export type RoleName = 'ROLE_ADMIN' | 'ROLE_DOCTOR' | 'ROLE_PATIENT';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  roles: RoleName[];
  enabled: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  user: UserProfile;
}

export interface Patient {
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

export interface AvailabilitySlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  available: boolean;
}

export interface Doctor {
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

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  patientName?: string;
  doctorName?: string;
  specialization?: string;
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

export interface ServiceRequest {
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

export interface NotificationItem {
  id: number;
  recipientId: number;
  recipientEmail: string;
  appointmentId?: number;
  channel: string;
  eventType: string;
  title: string;
  message: string;
  read: boolean;
  deliveryStatus: string;
  sentAt: string;
}

export interface AiChatResponse {
  reply: string;
  disclaimer: string;
  suggestedNextSteps: string[];
  piiRedacted: boolean;
  timestamp: string;
}

export interface StructuredSummaryResponse {
  conciseSummary: string;
  recommendedDepartment: string;
  urgencyLevel: string;
  actionItems: string[];
  disclaimer: string;
}

export interface AdminSummary {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  openRequests: number;
  bySpecialization: { specialization: string; appointments: number }[];
}
