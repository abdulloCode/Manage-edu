import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";



const Login = lazy(() => import("./pages/Login"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const ManagerDashboard = lazy(() => import("./pages/manager/Dashboard"));
const ManagerMyGroups = lazy(() => import("./pages/manager/MyGroups"));
const GroupDetail = lazy(() => import("./pages/manager/GroupDetail"));
const StudentScreenTimeReport = lazy(() => import("./pages/manager/StudentScreenTimeReport"));
const TeacherProfile = lazy(() => import("./pages/manager/MyProfile"));
const TeacherPayments = lazy(() => import("./pages/teacher/Payments"));
const UserDashboard = lazy(() => import("./pages/user/Dashboard"));
const StudentsPage = lazy(() => import("./pages/admin/Students"));
const TeachersPage = lazy(() => import("./pages/admin/teachers/index.jsx"));
const PaymentsPage = lazy(() => import("./pages/admin/payments/index.jsx"));
const GroupsPage = lazy(() => import("./pages/admin/groups/index.jsx"));
const CoursesPage = lazy(() => import("./pages/admin/courses/index.jsx"));
const StaffPage = lazy(() => import("./pages/admin/staff/index.jsx"));
const ReportsPage = lazy(() => import("./pages/admin/reports/index.jsx"));
const PaymentReportsPage = lazy(() => import("./pages/admin/payment-reports/index.jsx"));
const InventoryPage = lazy(() => import("./pages/admin/inventory/index.jsx"));
const MyProfile = lazy(() => import("./pages/student/MyProfile"));
const HomeworkPage = lazy(() => import("./pages/student/Homework"));
const Attendance = lazy(() => import("./pages/student/Attendance"));
const Payments = lazy(() => import("./pages/student/Payments"));
const Ratings = lazy(() => import("./pages/student/Ratings"));

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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    }>
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
          <Route path="/teacher/groups/:id/students/:studentId/screen-time" element={<StudentScreenTimeReport />} />
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
    </Suspense>
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