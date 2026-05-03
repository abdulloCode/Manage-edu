import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, initialized } = useAuth()

  console.log("ProtectedRoute - User:", user);
  console.log("ProtectedRoute - User role:", user?.role);
  console.log("ProtectedRoute - Allowed roles:", allowedRoles);
  console.log("ProtectedRoute - Is authenticated:", isAuthenticated);
  console.log("ProtectedRoute - Is initialized:", initialized);

  // Wait for the silent refresh attempt to finish before making any routing decision
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute - Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />
  }

  // Case-insensitive role check + normalize role to lowercase
  const userRole = user?.role?.toLowerCase()?.trim();
  const normalizedAllowedRoles = allowedRoles?.map(role => role?.toLowerCase()?.trim());

  console.log("ProtectedRoute - Normalized user role:", userRole);
  console.log("ProtectedRoute - Normalized allowed roles:", normalizedAllowedRoles);

  if (allowedRoles && !normalizedAllowedRoles?.includes(userRole)) {
    console.log("ProtectedRoute - Role not in allowed roles, redirecting to unauthorized");
    console.log("ProtectedRoute - User role:", userRole, "Allowed:", normalizedAllowedRoles);
    return <Navigate to="/unauthorized" replace />
  }

  console.log("ProtectedRoute - Access granted");
  return <Outlet />
}
