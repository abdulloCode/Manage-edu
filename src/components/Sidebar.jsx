import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getStaffPages } from "../api/staff";
import {
  Home,
  Users,
  Users2,
  GraduationCap,
  Briefcase,
  BookOpen,
  ClipboardList,
  CreditCard,
  Package,
  FileText,
  Receipt,
  CalendarCheck,
  Star,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AlertTriangle,
} from "lucide-react";

const getNav = (t) => ({
  admin: [
    { label: t('nav_dashboard'),       to: "/admin/dashboard",        icon: Home },
    { label: t('nav_students'),        to: "/admin/students",         icon: Users },
    { label: t('nav_teachers'),        to: "/admin/teachers",         icon: GraduationCap },
    { label: t('nav_staff'),           to: "/admin/staff",            icon: Briefcase },
    { label: t('nav_groups'),          to: "/admin/groups",           icon: Users2 },
    { label: t('nav_courses'),         to: "/admin/courses",          icon: BookOpen },
    { label: t('nav_inventory'),       to: "/admin/inventory",        icon: Package },
    { label: t('nav_payments'),        to: "/admin/payments",         icon: CreditCard },
    { label: t('nav_payment_reports'), to: "/admin/payment-reports",  icon: Receipt },
    { label: t('nav_reports'),         to: "/admin/reports",          icon: FileText },
  ],

  teacher: [
    { label: t('nav_dashboard'), to: "/teacher/dashboard", icon: Home      },
    { label: t('nav_my_groups'), to: "/teacher/groups",    icon: Users2    },
    { label: t('nav_payments'),  to: "/teacher/payments",  icon: CreditCard },
  ],

  student: [
    { label: t('nav_dashboard'),  to: "/student/dashboard",  icon: Home },
    { label: t('nav_attendance'), to: "/student/attendance", icon: CalendarCheck },
    { label: t('nav_homework'),   to: "/student/homework",   icon: ClipboardList },
    { label: t('nav_payments'),   to: "/student/payments",   icon: CreditCard },
    { label: t('nav_ratings'),    to: "/student/ratings",    icon: Star },
  ],
});

const getPagesMap = (t) => ({
  dashboard:         { label: t('nav_dashboard'),          icon: Home,          path: "dashboard"       },
  students:          { label: t('nav_students'),           icon: Users,         path: "students"        },
  teachers:          { label: t('nav_teachers'),           icon: GraduationCap, path: "teachers"        },
  groups:            { label: t('nav_groups'),             icon: Users2,        path: "groups"          },
  courses:           { label: t('nav_courses'),            icon: BookOpen,      path: "courses"         },
  payment:           { label: t('nav_payments'),           icon: CreditCard,    path: "payments"        },
  payments:          { label: t('nav_payments'),           icon: CreditCard,    path: "payments"        },
  staff:             { label: t('nav_staff'),              icon: Briefcase,     path: "staff"           },
  inventory:         { label: t('nav_inventory'),          icon: Package,       path: "inventory"       },
  reports:           { label: t('nav_reports'),            icon: FileText,      path: "reports"         },
  "payment-reports": { label: t('nav_payment_reports'),    icon: Receipt,       path: "payment-reports" },
});

let cachedPagesMap = null;
const DYNAMIC_ROLES = ["manager", "supporter", "assistant", "staff"];

function getDynamicLinks(role, pagesToAccess, pagesMap, t) {
  const pages = Array.isArray(pagesToAccess) ? pagesToAccess : [];
  const dashboard = { label: t('nav_dashboard'), to: `/${role}/dashboard`, icon: Home };
  const rest = pages
    .filter(p => p !== "dashboard" && pagesMap[p])
    .map(p => ({
      label: pagesMap[p].label,
      to: `/${role}/${pagesMap[p].path || p}`,
      icon: pagesMap[p].icon,
    }));
  return [dashboard, ...rest];
}

export default function ({ collapsed, onToggle, onNavClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useLang();
  const role = (user?.role ?? "student").toLowerCase().trim();
  const [pagesMap, setPagesMap] = useState(cachedPagesMap || null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!DYNAMIC_ROLES.includes(role)) return;
    if (cachedPagesMap) return;
    getStaffPages()
      .then(res => {
        const map = { ...getPagesMap(t) };
        (res.data.pages || []).forEach(p => {
          if (!map[p.name]) map[p.name] = { label: p.name, icon: Home };
        });
        cachedPagesMap = map;
        setPagesMap(map);
      })
      .catch(() => {});
  }, []);

  const currentPagesMap = pagesMap || getPagesMap(t);

  const links = (() => {
    const NAV = getNav(t);
    if (role === "admin") return NAV.admin;
    if (DYNAMIC_ROLES.includes(role)) return getDynamicLinks(role, user?.pagesToAccess || [], currentPagesMap, t);
    return NAV[role] ?? NAV.student;
  })();

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try { await logout(); } catch {}
    navigate("/login");
  };

  return (
    <aside
      className={`flex flex-col min-h-screen bg-base-100 border-r border-base-200 py-4 gap-1 transition-all duration-300 ${
        collapsed ? "w-16 px-2" : "w-64 px-3"
      }`}
    >
      {/* Brand + toggle */}
      <div className={`flex items-center mb-5 ${collapsed ? "flex-col gap-2 px-0" : "justify-between px-3"}`}>
        {!collapsed ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <svg className="w-9 h-9 shrink-0" viewBox="0 20 250 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sbgp1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7C3AED"/>
                    <stop offset="100%" stopColor="#5B21B6"/>
                  </linearGradient>
                </defs>
                <g transform="translate(40,20)">
                  <path d="M110 10 L180 50 Q205 65 205 92 L205 168 Q205 195 180 210 L110 250 Q85 265 60 250 L-10 210 Q-35 195 -35 168 L-35 92 Q-35 65 -10 50 L60 10 Q85 -5 110 10" stroke="url(#sbgp1)" strokeWidth="12" fill="none"/>
                  <path d="M20 95 L85 60 L150 95 L85 128 Z" fill="url(#sbgp1)"/>
                  <path d="M50 108 V145 L85 165 L120 145 V108" fill="url(#sbgp1)"/>
                  <rect x="138" y="94" width="6" height="30" rx="3" fill="url(#sbgp1)"/>
                  <path d="M-5 145 Q40 158 85 205 Q130 158 175 145 V188 Q130 200 85 240 Q40 200 -5 188 Z" fill="url(#sbgp1)"/>
                </g>
              </svg>
              <span className="text-lg font-black tracking-tight truncate">
                Manage <span className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent">Edu</span>
              </span>
            </div>
            <span className={`ml-11 text-[10px] font-semibold uppercase tracking-widest ${ROLE_META[role]?.textColor ?? "text-base-content/35"}`}>
              {ROLE_META[role]?.label ?? role}
            </span>
          </div>
        ) : (
          <svg className="w-10 h-10 shrink-0" viewBox="0 20 250 260" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sbgp2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7C3AED"/>
                <stop offset="100%" stopColor="#5B21B6"/>
              </linearGradient>
            </defs>
            <g transform="translate(40,20)">
              <path d="M110 10 L180 50 Q205 65 205 92 L205 168 Q205 195 180 210 L110 250 Q85 265 60 250 L-10 210 Q-35 195 -35 168 L-35 92 Q-35 65 -10 50 L60 10 Q85 -5 110 10" stroke="url(#sbgp2)" strokeWidth="12" fill="none"/>
              <path d="M20 95 L85 60 L150 95 L85 128 Z" fill="url(#sbgp2)"/>
              <path d="M50 108 V145 L85 165 L120 145 V108" fill="url(#sbgp2)"/>
              <rect x="138" y="94" width="6" height="30" rx="3" fill="url(#sbgp2)"/>
              <path d="M-5 145 Q40 158 85 205 Q130 158 175 145 V188 Q130 200 85 240 Q40 200 -5 188 Z" fill="url(#sbgp2)"/>
            </g>
          </svg>
        )}
        <button
          onClick={onToggle}
          className="hidden lg:flex btn btn-ghost btn-sm btn-square text-base-content/80 hover:text-base-content"
          aria-label="Toggle "
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <ChevronLeft  className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {links.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} onNavClick={onNavClick} />
        ))}
      </nav>

      {/* Bottom: lang toggle + profile + logout */}
      <div className="pt-3 border-t border-base-200 flex flex-col gap-1">

        {/* UZ / EN toggle */}
        <button
          onClick={toggleLang}
          className={`flex items-center ${collapsed ? "justify-center px-2" : "gap-2 px-3"} py-2 rounded-lg transition-all duration-200 group`}
        >
          {collapsed ? (
            <span className="w-8 h-8 rounded-lg bg-base-200 hover:bg-primary/10 text-base-content/50 hover:text-primary flex items-center justify-center text-[11px] font-black transition-colors">
              {lang === 'uz' ? 'EN' : 'UZ'}
            </span>
          ) : (
            <span className="flex items-center gap-2 w-full px-1 py-1 rounded-xl border border-base-200 hover:border-primary/30 hover:bg-primary/5 transition-all">
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors ${lang === 'uz' ? 'bg-primary text-primary-content shadow-sm' : 'text-base-content/40'}`}>UZ</span>
              <span className="text-base-content/20 text-xs">|</span>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors ${lang === 'en' ? 'bg-primary text-primary-content shadow-sm' : 'text-base-content/40'}`}>EN</span>
            </span>
          )}
        </button>

        <ProfileButton collapsed={collapsed} user={user} onNavClick={onNavClick} />
        <button
          onClick={() => setShowLogoutModal(true)}
          className={`flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} py-2 rounded-lg text-sm font-medium transition-all duration-200 text-error/70 hover:bg-error/10 hover:text-error`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>{t('nav_logout')}</span>}
        </button>

      {createPortal(
        <AnimatePresence>
          {showLogoutModal && (
            <motion.div
              key="logout-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => setShowLogoutModal(false)}
            >
              <motion.div
                key="logout-modal"
                initial={{ opacity: 0, scale: 0.85, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 24 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="bg-base-100 rounded-2xl shadow-2xl p-8 w-80 flex flex-col items-center gap-5 border border-base-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-error" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-base-content mb-1">{t('logout_confirm_title') || "Chiqishni tasdiqlang"}</h3>
                  <p className="text-sm text-base-content/60">{t('logout_confirm_desc') || "Hisobdan chiqishni xohlaysizmi? Qayta kirish uchun login va parolingiz kerak bo'ladi."}</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 btn btn-ghost btn-sm rounded-xl border border-base-200 text-base-content/70"
                  >
                    {t('cancel') || "Bekor qilish"}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 btn btn-error btn-sm rounded-xl text-white gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('nav_logout') || "Chiqish"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
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
}

const ROLE_META = {
  admin:     { label: "Admin",     textColor: "text-violet-400" },
  manager:   { label: "Manager",   textColor: "text-sky-400"    },
  teacher:   { label: "Teacher",   textColor: "text-emerald-400"},
  student:   { label: "Student",   textColor: "text-amber-400"  },
  supporter: { label: "Supporter", textColor: "text-pink-400"   },
  assistant: { label: "Assistant", textColor: "text-teal-400"   },
  staff:     { label: "Staff",     textColor: "text-orange-400" },
};

function ProfileButton({ collapsed, user, onNavClick }) {
  return (
    <Link
      to={`/${user?.role?.toLowerCase()}/profile`}
      onClick={onNavClick}
      className={`flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} py-2 rounded-lg text-sm font-medium transition-all duration-200 text-base-content/70 hover:bg-base-200 hover:text-base-content`}
    >
      <div className="w-5 h-5 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
        {user?.name?.[0]?.toUpperCase() ?? "U"}
      </div>
      {!collapsed && <span className="truncate">{user?.name ?? "Profile"}</span>}
    </Link>
  );
}
