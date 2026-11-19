import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientManagementPage from './pages/PatientManagementPage';
import DoctorDirectoryPage from './pages/DoctorDirectoryPage';
import AppointmentManagementPage from './pages/AppointmentManagementPage';
import AppointmentBookingPage from './pages/AppointmentBookingPage';
import PatientProfilePage from './pages/PatientProfilePage';
import NotificationCenterPage from './pages/NotificationCenterPage';
import AiAssistantPage from './pages/AiAssistantPage';
import ServiceRequestsPage from './pages/ServiceRequestsPage';
import UserProfilePage from './pages/UserProfilePage';
import NotFoundUnauthorizedPage from './pages/NotFoundUnauthorizedPage';
import ArchitectureBlueprintPage from './pages/ArchitectureBlueprintPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/blueprint" element={<ArchitectureBlueprintPage />} />
            <Route path="/unauthorized" element={<NotFoundUnauthorizedPage mode="unauthorized" />} />

            {/* Role Dashboards */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient"
              element={
                <ProtectedRoute allowedRoles={['ROLE_PATIENT', 'ROLE_ADMIN']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={['ROLE_DOCTOR', 'ROLE_ADMIN']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Shared & Role-Specific Clinical Modules */}
            <Route
              path="/patients"
              element={
                <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_DOCTOR']}>
                  <PatientManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctors"
              element={
                <ProtectedRoute>
                  <DoctorDirectoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <AppointmentManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book-appointment"
              element={
                <ProtectedRoute allowedRoles={['ROLE_PATIENT', 'ROLE_ADMIN']}>
                  <AppointmentBookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-profile"
              element={
                <ProtectedRoute allowedRoles={['ROLE_PATIENT']}>
                  <PatientProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationCenterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ProtectedRoute>
                  <AiAssistantPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/service-requests"
              element={
                <ProtectedRoute>
                  <ServiceRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              }
            />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundUnauthorizedPage mode="notfound" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
