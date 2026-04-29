import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/admin/Dashboard";
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerMyGroups from "./pages/manager/MyGroups";
import GroupDetail from "./pages/manager/GroupDetail";
import TeacherProfile from "./pages/manager/MyProfile";
import UserDashboard from "./pages/user/Dashboard";
import StudentsPage from "./pages/admin/Students";
import TeachersPage from "./pages/admin/teachers/index.jsx";
import PaymentsPage from "./pages/admin/payments/index.jsx";
import GroupsPage from "./pages/admin/groups/index.jsx";
import CoursesPage from "./pages/admin/courses/index.jsx";
import BlogsPage from "./pages/admin/blog/index.jsx";
import MyProfile from "./pages/student/MyProfile";
import MyGroups from "./pages/student/MyGroups";
import HomeworkPage from "./pages/student/Homework";
import Attendance from "./pages/student/Attendance";
import Payments from "./pages/student/Payments";
import Ratings from "./pages/student/Ratings";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            {/* Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/students" element={<StudentsPage />} />
                <Route path="/admin/teachers" element={<TeachersPage />} />
                <Route path="/admin/payments" element={<PaymentsPage />} />
                <Route path="/admin/groups" element={<GroupsPage />} />
                <Route path="/admin/courses" element={<CoursesPage />} />
                <Route path="/admin/blog" element={<BlogsPage />} />
                <Route
                  path="/admin/contacts"
                  element={<PlaceholderPage title="Contacts" />}
                />
                <Route
                  path="/admin/reports"
                  element={<PlaceholderPage title="Reports" />}
                />
                <Route
                  path="/admin/settings"
                  element={<PlaceholderPage title="Settings" />}
                />
              </Route>
            </Route>

            {/* Teacher routes */}
            <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
              <Route element={<DashboardLayout />}>
                <Route
                  path="/teacher/dashboard"
                  element={<ManagerDashboard />}
                />
                <Route path="/teacher/groups" element={<ManagerMyGroups />} />
                <Route path="/teacher/groups/:id" element={<GroupDetail />} />
                <Route path="/teacher/profile" element={<TeacherProfile />} />
              </Route>
            </Route>

            {/* Student routes */}
            <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/student/dashboard" element={<UserDashboard />} />
                <Route path="/student/profile" element={<MyProfile />} />
                <Route path="/student/groups" element={<MyGroups />} />
                <Route path="/student/homework" element={<HomeworkPage />} />
                <Route path="/student/attendance" element={<Attendance />} />
                <Route path="/student/payments" element={<Payments />} />
                <Route path="/student/ratings" element={<Ratings />} />
              </Route>
            </Route>

            {/* Staff routes */}
            <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/staff/dashboard" element={<UserDashboard />} />
                <Route path="/staff/students" element={<StudentsPage />} />
                <Route
                  path="/staff/contacts"
                  element={<PlaceholderPage title="Contacts" />}
                />
                <Route
                  path="/staff/deals"
                  element={<PlaceholderPage title="Deals" />}
                />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col gap-6 p-1">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Bu sahifa hozircha ishlab chiqilmoqda
        </p>
      </div>
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body items-center text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <p className="text-base-content/60 text-lg font-normal">
            Sahifa tayyorlanmoqda
          </p>
          <p className="text-base-content/40 text-sm mt-2">
            Tez orada bu funksiya mavjud bo'ladi
          </p>
        </div>
      </div>
    </div>
  );
}
