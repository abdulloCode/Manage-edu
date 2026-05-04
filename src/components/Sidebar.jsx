import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { getStaffPages } from "../api/staff";


const NAV = {
  admin: [
    { label: "Dashboard",        to: "/admin/dashboard",        icon: HomeIcon },
    { label: "Students",         to: "/admin/students",         icon: UsersIcon },
    { label: "Teachers",         to: "/admin/teachers",         icon: AcademicIcon },
    { label: "Staff",            to: "/admin/staff",            icon: UsersIcon },
    { label: "Groups",           to: "/admin/groups",           icon: UserGroupIcon },
    { label: "Courses",          to: "/admin/courses",          icon: BookIcon },
    { label: "Inventory",        to: "/admin/inventory",        icon: BoxIcon },
    { label: "Payments",         to: "/admin/payments",         icon: CreditCardIcon },
    { label: "Payment Reports",  to: "/admin/payment-reports",  icon: ReceiptIcon },
    { label: "Reports",          to: "/admin/reports",          icon: FileTextIcon },
  ],

  teacher: [
    { label: "Dashboard",        to: "/teacher/dashboard",      icon: HomeIcon },
    { label: "My Groups",        to: "/teacher/groups",         icon: UsersIcon },
  ],
  student: [
    { label: "Dashboard",        to: "/student/dashboard",      icon: HomeIcon },
    { label: "My Groups",        to: "/student/groups",         icon: UsersIcon },
    { label: "Payments",         to: "/student/payments",       icon: CreditCardIcon },
    { label: "Grades",           to: "/student/ratings",        icon: ChartIcon },
  ],
 
};

const PAGES_MAP = {
  dashboard:       { label: "Dashboard",       icon: HomeIcon },
  students:        { label: "O'quvchilar",     icon: UsersIcon },
  teachers:        { label: "O'qituvchilar",   icon: AcademicIcon },
  groups:          { label: "Guruhlar",        icon: UserGroupIcon },
  courses:         { label: "Kurslar",         icon: BookIcon },
  payments:        { label: "To'lovlar",       icon: CreditCardIcon },
  inventory:       { label: "Ombor",           icon: BoxIcon },
  reports:         { label: "Hisobotlar",      icon: FileTextIcon },
  "payment-reports": { label: "To'lov hisobotlari", icon: ReceiptIcon },
};
let cachedPagesMap = null;
const DYNAMIC_ROLES = ["staff", "manager", "receptionist"];

function getDynamicLinks(role, pagesToAccess, pagesMap) {
  const pages = Array.isArray(pagesToAccess) ? pagesToAccess : [];
  const dashboard = { label: "Dashboard", to: `/${role}/dashboard`, icon: HomeIcon };
  const rest = pages
    .filter(p => p !== "dashboard" && pagesMap[p])
    .map(p => ({
      label: pagesMap[p].label,
      to: `/${role}/${p}`,
      icon: pagesMap[p].icon,
    }));
  return [dashboard, ...rest];
}

export default function Sidebar({ collapsed, onToggle, onNavClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = (user?.role ?? "student").toLowerCase().trim();
  const [pagesMap, setPagesMap] = useState(cachedPagesMap || PAGES_MAP);
  console.log("user:", user);
  console.log("role:", role);
  console.log("pagesToAccess:", user?.pagesToAccess);
  useEffect(() => {
    if (cachedPagesMap) return;
    getStaffPages()
      .then(res => {
        const map = { ...PAGES_MAP }; // PAGES_MAP ni base qilib olamiz
        (res.data.pages || []).forEach(p => {
          if (!map[p.name]) {
            map[p.name] = {
              label: p.name,
              icon: HomeIcon,
            };
          }
        });
        cachedPagesMap = map;
        setPagesMap(map);
      })
      .catch(() => {});
  }, []);

  const links = DYNAMIC_ROLES.includes(role)
    ? getDynamicLinks(role, user?.pagesToAccess || [], pagesMap)
    : NAV[role] ?? NAV.student;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

  return (
    <aside
      className={`flex flex-col min-h-screen bg-base-100 border-r border-base-200 py-4 gap-1 transition-all duration-300 ${
        collapsed ? "w-16 px-2" : "w-64 px-3"
      }`}
    >
      {/* Brand + toggle */}
      <div className={`flex items-center mb-6 ${collapsed ? "justify-center" : "justify-between px-3"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary-content" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight truncate">Manage Edu</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="hidden lg:flex btn btn-ghost btn-sm btn-square text-base-content/80 hover:text-base-content"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {links.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} onNavClick={onNavClick} />
        ))}
      </nav>

      {/* Bottom: profile + logout */}
      <div className="pt-3 border-t border-base-200 flex flex-col gap-1">
        <ProfileButton collapsed={collapsed} user={user} onNavClick={onNavClick} />
        <button
          onClick={handleLogout}
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} rounded-lg text-sm font-medium transition-all duration-200 text-error/70 hover:bg-error/10 hover:text-error ${collapsed ? "px-2 py-2.5" : "px-3 py-2"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Chiqish</span>}
        </button>
      </div>
    </aside>
  );
}
function NavItem({ label, to, icon: Icon, collapsed, onNavClick }) {
  return (
    <NavLink
      to={to}
      onClick={onNavClick}
      className={({ isActive }) =>
        `flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-primary text-primary-content"
            : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
        }`
      }
    >
      {Icon && <Icon className="w-5 h-5 shrink-0" />}
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}function ProfileButton({ collapsed, user, onNavClick }) {
  return (
    <Link
      to={`/${user?.role?.toLowerCase()}/profile`}
      onClick={onNavClick}
      className={`flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} py-2 rounded-lg text-sm font-medium transition-all duration-200 text-base-content/70 hover:bg-base-200 hover:text-base-content`}
    >
      <div className="w-5 h-5 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
        {user?.name?.[0]?.toUpperCase() ?? "U"}
      </div>
      {!collapsed && (
        <span className="truncate">{user?.name ?? "Profile"}</span>
      )}
    </Link>
  );
}
// ── Icons ──
function HomeIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function UsersIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function AcademicIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>;
}
function UserGroupIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
}
function BookIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
}
function CreditCardIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
}
function BoxIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
}
function FileTextIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function ReceiptIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>;
}
function ChartIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function BriefcaseIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function ChevronLeftIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
}
function ChevronRightIcon({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
}