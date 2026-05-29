import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/admin/Dashboard";
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerMyGroups from "./pages/manager/MyGroups";
import GroupDetail from "./pages/manager/GroupDetail";
import TeacherProfile from "./pages/manager/MyProfile";
import TeacherPayments from "./pages/teacher/Payments";
import UserDashboard from "./pages/user/Dashboard";
import StudentsPage from "./pages/admin/Students";
import TeachersPage from "./pages/admin/teachers/index.jsx";
import PaymentsPage from "./pages/admin/payments/index.jsx";
import GroupsPage from "./pages/admin/groups/index.jsx";
import CoursesPage from "./pages/admin/courses/index.jsx";
import StaffPage from "./pages/admin/staff/index.jsx";
import ReportsPage from "./pages/admin/reports/index.jsx";
import PaymentReportsPage from "./pages/admin/payment-reports/index.jsx";
import InventoryPage from "./pages/admin/inventory/index.jsx";
import MyProfile from "./pages/student/MyProfile";
import HomeworkPage from "./pages/student/Homework";
import Attendance from "./pages/student/Attendance";
import Payments from "./pages/student/Payments";
import Ratings from "./pages/student/Ratings";

const DYNAMIC_ROLES = ["manager", "supporter", "assistant", "staff"];

const PAGE_COMPONENTS = {
  students:          StudentsPage,
  teachers:          TeachersPage,
  payments:          PaymentsPage,
  payment:           PaymentsPage,   // API alias
  groups:            GroupsPage,
  courses:           CoursesPage,
  inventory:         InventoryPage,
  reports:           ReportsPage,
  "payment-reports": PaymentReportsPage,
  staff:             StaffPage,
};

// API page name → URL path (when they differ)
const PAGE_PATH = {
  payment: "payments",
};

// useAuth ishlatish uchun AuthProvider ichida bo'lishi kerak
function AppRoutes() {
  const { user, initialized } = useAuth();
  const role = user?.role?.toLowerCase()?.trim();
  const pages = Array.isArray(user?.pagesToAccess) ? user.pagesToAccess : [];
  const isDynamic = DYNAMIC_ROLES.includes(role);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard"       element={<AdminDashboard />} />
          <Route path="/admin/students"        element={<StudentsPage />} />
          <Route path="/admin/teachers"        element={<TeachersPage />} />
          <Route path="/admin/payments"        element={<PaymentsPage />} />
          <Route path="/admin/groups"          element={<GroupsPage />} />
          <Route path="/admin/courses"         element={<CoursesPage />} />
          <Route path="/admin/reports"         element={<ReportsPage />} />
          <Route path="/admin/payment-reports" element={<PaymentReportsPage />} />
          <Route path="/admin/inventory"       element={<InventoryPage />} />
          <Route path="/admin/staff"           element={<StaffPage />} />
          <Route path="/admin/profile"         element={<TeacherProfile />} />
        </Route>
      </Route>

      {/* Teacher */}
      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/teacher/dashboard"  element={<ManagerDashboard />} />
          <Route path="/teacher/groups"     element={<ManagerMyGroups />} />
          <Route path="/teacher/groups/:id" element={<GroupDetail />} />
          <Route path="/teacher/profile"   element={<TeacherProfile />} />
          <Route path="/teacher/payments" element={<TeacherPayments />} />
        </Route>
      </Route>

      {/* Student */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student/dashboard"    element={<UserDashboard />} />
          <Route path="/student/profile"      element={<MyProfile />} />
          <Route path="/student/homework"     element={<HomeworkPage />} />
          <Route path="/student/attendance"   element={<Attendance />} />
          <Route path="/student/payments"     element={<Payments />} />
          <Route path="/student/ratings"      element={<Ratings />} />
        </Route>
      </Route>

      {/* Dynamic rollar */}
      {isDynamic && role && (
        <Route element={<ProtectedRoute allowedRoles={[role]} />}>
          <Route element={<DashboardLayout />}>
            <Route path={`/${role}/dashboard`} element={<AdminDashboard />} />
            <Route path={`/${role}/profile`}   element={<TeacherProfile />} />
            {pages.map((page) => {
              const Component = PAGE_COMPONENTS[page];
              if (!Component) return null;
              const urlPath = PAGE_PATH[page] || page;
              return (
                <Route key={page} path={`/${role}/${urlPath}`} element={<Component />} />
              );
            })}
          </Route>
        </Route>
      )}

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}