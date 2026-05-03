import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = {
  admin: [
    { label: "Dashboard", to: "/admin/dashboard", icon: HomeIcon },
    { label: "Students", to: "/admin/students", icon: UsersIcon },
    { label: "Teachers", to: "/admin/teachers", icon: AcademicIcon },
    { label: "Staff", to: "/admin/staff", icon: UsersIcon },
    { label: "Groups", to: "/admin/groups", icon: UserGroupIcon },
    { label: "Courses", to: "/admin/courses", icon: BookIcon },
    { label: "Inventory", to: "/admin/inventory", icon: BoxIcon },
    { label: "Payments", to: "/admin/payments", icon: CreditCardIcon },
    { label: "Payment Reports", to: "/admin/payment-reports", icon: ReceiptIcon },
    { label: "Reports", to: "/admin/reports", icon: FileTextIcon },
  ],
  manager: [
    { label: "Dashboard", to: "/manager/dashboard", icon: HomeIcon },
    { label: "O'quvchilar", to: "/manager/students", icon: UsersIcon },
    { label: "O'qituvchilar", to: "/manager/teachers", icon: AcademicIcon },
    { label: "Guruhlar", to: "/manager/groups", icon: UserGroupIcon },
    { label: "Kurslar", to: "/manager/courses", icon: BookIcon },
    { label: "Ombor", to: "/manager/inventory", icon: BoxIcon },
    { label: "To'lovlar", to: "/manager/payments", icon: CreditCardIcon },
   
  ],
  teacher: [
    { label: "Dashboard", to: "/teacher/dashboard", icon: HomeIcon },
    { label: "My Groups", to: "/teacher/groups", icon: UsersIcon },
  ],
  student: [
    { label: "Dashboard", to: "/student/dashboard", icon: HomeIcon },
    { label: "My Groups", to: "/student/groups", icon: UsersIcon },
    { label: "Payments", to: "/student/payments", icon: CreditCardIcon },
    { label: "Grades", to: "/student/ratings", icon: ChartIcon },
  ],
  staff: [
    { label: "Dashboard", to: "/student/dashboard", icon: HomeIcon },
    { label: "Students", to: "/staff/students", icon: AcademicIcon },
    { label: "Contacts", to: "/student/contacts", icon: UsersIcon },
    { label: "Deals", to: "/student/deals", icon: BriefcaseIcon },
  ],
};

function NavItem({ to, icon: Icon, label, collapsed, onNavClick }) {
  return (
    <div
      className={collapsed ? "tooltip tooltip-right" : ""}
      data-tip={collapsed ? label : undefined}
    >
      <NavLink
        to={to}
        onClick={onNavClick}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
          } ${
            isActive
              ? "bg-primary text-primary-content"
              : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
          }`
        }
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </NavLink>
    </div>
  );
}

function ProfileButton({ collapsed, user, onNavClick }) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  // Normalize role to lowercase for case-insensitive matching
  const normalizedRole = user?.role?.toLowerCase()?.trim();
  const profilePath =
    { student: "/student/profile", teacher: "/teacher/profile", admin: "/admin/profile", manager: "/manager/profile" }[normalizedRole] ??
    "#";
  console.log("ProfileButton - User role:", user?.role, "Normalized:", normalizedRole, "Profile path:", profilePath);

  if (collapsed) {
    return (
      <div
        className="tooltip tooltip-right flex justify-center"
        data-tip={user?.name ?? "My Profile"}
      >
        <Link
          to={profilePath}
          onClick={onNavClick}
          className="relative flex items-center justify-center w-10 h-10 rounded-xl ring-2 ring-base-200 hover:ring-primary/40 transition-all duration-200 group"
        >
          <div className="avatar placeholder">
            <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-content rounded-xl w-10 h-10 shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-xs font-bold">{initials}</span>
            </div>
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-base-100" />
        </Link>
      </div>
    );
  }

  return (
    <Link
      to={profilePath}
      onClick={onNavClick}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-base-200/50 hover:bg-base-200 border border-base-200 hover:border-base-300 transition-all duration-200"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="avatar placeholder">
          <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-content rounded-xl w-9 h-9 shadow-sm">
            <span className="text-xs font-bold">{initials}</span>
          </div>
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-base-100" />
      </div>

      {/* Text */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-semibold text-base-content truncate leading-tight">
          {user?.name ?? "My Profile"}
        </span>
        <span className="text-xs text-base-content/70 capitalize leading-tight mt-0.5">
          {user?.role}
        </span>
      </div>

      {/* Chevron */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-3.5 h-3.5 text-base-content/50 group-hover:text-base-content/50 shrink-0 transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function Sidebar({ collapsed, onToggle, onNavClick }) {
  const { user, logout } = useAuth();
  // Normalize role to lowercase for case-insensitive matching
  const role = (user?.role ?? "student").toLowerCase();
  const links = NAV[role] ?? NAV.student;
  console.log("Sidebar - User role:", user?.role, "Normalized:", role, "Links:", links);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };

  return (
    <aside
      className={`flex flex-col min-h-screen bg-base-100 border-r border-base-200 py-4 gap-1 transition-all duration-300 ${
        collapsed ? "w-16 px-2" : "w-64 px-3"
      }`}
    >
      {/* Brand + toggle (toggle hidden on mobile — drawer handles close) */}
      <div
        className={`flex items-center mb-6 ${collapsed ? "justify-center" : "justify-between px-3"}`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-primary-content"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight truncate">
              CRM Portal
            </span>
          </div>
        )}
        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          className="hidden lg:flex btn btn-ghost btn-sm btn-square text-base-content/80 hover:text-base-content"
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {links.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
            onNavClick={onNavClick}
          />
        ))}
      </nav>

      {/* Bottom: profile and logout */}
      <div className="pt-3 border-t border-base-200 flex flex-col gap-1">
        <ProfileButton
          collapsed={collapsed}
          user={user}
          onNavClick={onNavClick}
        />
        <button
          onClick={handleLogout}
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} rounded-lg text-sm font-medium transition-all duration-200 text-error/70 hover:bg-error/10 hover:text-error ${collapsed ? "px-2 py-2.5" : "px-3 py-2"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {!collapsed && <span>Chiqish</span>}
        </button>
      </div>
    </aside>
  );
}

// Icons
function HomeIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}
function UsersIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
function BriefcaseIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
function ChartIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}
function CogIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
function ClipboardIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}
function CalendarIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
function CreditCardIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}
function AcademicIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14l9-5-9-5-9 5 9 5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
      />
    </svg>
  );
}
function ChevronLeftIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRightIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
function UserGroupIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}
function BookIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}
function ContactsIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}
function FileTextIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}
function BoxIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}
function ReceiptIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
      />
    </svg>
  );
}
