import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AdminLayout from '../layouts/AdminLayout/AdminLayout';
import TeacherLayout from '../layouts/TeacherLayout/TeacherLayout';
import ParentLayout from '../layouts/ParentLayout/ParentLayout';
import StudentLayout from '../layouts/StudentLayout/StudentLayout';

// Pages
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard';
import Attendance from '../pages/Attendance/Attendance';
import Marks from '../pages/Marks/Marks';
import Behaviour from '../pages/Behaviour/Behaviour';
import Complaints from '../pages/Complaints/Complaints';
import Homework from '../pages/Homework/Homework';
import Announcements from '../pages/Announcements/Announcements';
import Reports from '../pages/Reports/Reports';
import Notifications from '../pages/Notifications/Notifications';
import Profile from '../pages/Profile/Profile';
import Settings from '../pages/Settings/Settings';
import Timetable from '../pages/Timetable/Timetable';
import ChatbotPage from '../pages/ChatbotPage/ChatbotPage';
import Promotion from '../pages/Promotion/Promotion';
import TeacherLoginManagement from '../pages/TeacherLoginManagement/TeacherLoginManagement';
import StudentLoginManagement from '../pages/StudentLoginManagement/StudentLoginManagement';

// Helper component to redirect authenticated users automatically
const RootRedirect = () => {
  const userJson = localStorage.getItem('edutrack_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.role) {
        return <Navigate to={`/${user.role}/dashboard`} replace />;
      }
    } catch (e) {
      localStorage.removeItem('edutrack_user');
    }
  }
  return <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirecting based on session */}
      <Route path="/" element={<RootRedirect />} />

      {/* Login Screen */}
      <Route path="/login" element={<Login />} />

      {/* ADMIN CONSOLE ROUTES */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="marks" element={<Marks />} />
        <Route path="behaviour" element={<Behaviour />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="promotion" element={<Promotion />} />
        <Route path="teacher-login" element={<TeacherLoginManagement />} />
      </Route>

      {/* TEACHER CONSOLE ROUTES */}
      <Route path="/teacher" element={<TeacherLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="marks" element={<Marks />} />
        <Route path="behaviour" element={<Behaviour />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="student-login" element={<StudentLoginManagement />} />
      </Route>

      {/* PARENT CONSOLE ROUTES */}
      <Route path="/parent" element={<ParentLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="marks" element={<Marks />} />
        <Route path="behaviour" element={<Behaviour />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="timetable" element={<Timetable />} />
      </Route>

      {/* STUDENT CONSOLE ROUTES */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="chatbot" element={<ChatbotPage />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="marks" element={<Marks />} />
        <Route path="behaviour" element={<Behaviour />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="timetable" element={<Timetable />} />
      </Route>

      {/* Catch-all redirect to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
