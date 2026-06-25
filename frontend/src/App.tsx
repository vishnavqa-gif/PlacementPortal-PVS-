import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './utils/theme';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import BookInterview from './pages/student/BookInterview';
import MyInterviews from './pages/student/MyInterviews';
import StudentProfile from './pages/student/Profile';
import StudentAnnouncements from './pages/student/Announcements';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminInterviews from './pages/admin/Interviews';
import AdminReports from './pages/admin/Reports';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminSlots from './pages/admin/Slots';
import { AdminTechnologies, AdminInterviewers, AdminCabins } from './pages/admin/ManageResources';

// Super Admin pages
import SuperAdminDashboard from './pages/superadmin/Dashboard';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Student routes */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/book" element={<BookInterview />} />
              <Route path="/student/interviews" element={<MyInterviews />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              <Route path="/student/announcements" element={<StudentAnnouncements />} />
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin/interviews" element={<AdminInterviews />} />
              <Route path="/admin/technologies" element={<AdminTechnologies />} />
              <Route path="/admin/interviewers" element={<AdminInterviewers />} />
              <Route path="/admin/cabins" element={<AdminCabins />} />
              <Route path="/admin/slots" element={<AdminSlots />} />
              <Route path="/admin/announcements" element={<AdminAnnouncements />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
            </Route>

            {/* Super Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
              <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/admins" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/settings" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/audit-logs" element={<SuperAdminDashboard />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
