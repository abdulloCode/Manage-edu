import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users2,
  CreditCard,
  User,
  CalendarCheck,
  ClipboardList,
  Star,
  LogOut,
  AlertTriangle,
  Globe,
} from "lucide-react";

/* ── Nav config ────────────────────────────────────────────── */
const NAV_CONFIG = {
  teacher: (t) => [
    { label: t("nav_dashboard"), to: "/teacher/dashboard", icon: Home },
    { label: t("nav_my_groups"), to: "/teacher/groups",    icon: Users2 },
    { label: t("nav_payments"),  to: "/teacher/payments",  icon: CreditCard },
    { label: "Profil",           to: "/teacher/profile",   icon: User },
  ],
  student: (t) => [
    { label: t("nav_dashboard"),  to: "/student/dashboard",  icon: Home },
    { label: t("nav_attendance"), to: "/student/attendance", icon: CalendarCheck },
    { label: t("nav_homework"),   to: "/student/homework",   icon: ClipboardList },
    { label: t("nav_payments"),   to: "/student/payments",   icon: CreditCard },
    { label: t("nav_ratings"),    to: "/student/ratings",    icon: Star },
    { label: "Profil",            to: "/student/profile",    icon: User },
  ],
};

const ROLE_COLORS = {
  teacher: { active: "text-emerald-600", dot: "bg-emerald-500", ring: "bg-emerald-50" },
  student: { active: "text-amber-500",   dot: "bg-amber-400",   ring: "bg-amber-50"  },
};

export default function BottomNav() {
  const { user, logout } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const role = user?.role?.toLowerCase()?.trim();
  const items = NAV_CONFIG[role]?.(t);
  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.student;

  if (!items) return null;

  const handleLogout = async () => {
    setShowLogout(false);
    try { await logout(); } catch {}
    navigate("/login");
  };

  return (
    <>
      {/* ── Bottom Bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-base-100/95 backdrop-blur-md border-t border-base-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch h-16 pb-safe">

          {/* Nav items */}
          {items.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 pt-1 pb-1 relative transition-all duration-200 ${
                  isActive ? colors.active : "text-base-content/40 hover:text-base-content/70"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full ${colors.dot}`} />
                  )}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive ? colors.ring : ""}`}>
                    <Icon className="w-5 h-5 shrink-0" />
                  </div>
                  <span className={`text-[9px] font-bold leading-none tracking-wide truncate max-w-[52px] text-center ${isActive ? "opacity-100" : "opacity-60"}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* Divider */}
          <div className="w-px bg-base-200 my-3" />

          {/* Til tugmasi */}
          <button
            onClick={toggleLang}
            className="flex flex-col items-center justify-center gap-0.5 pt-1 pb-1 px-3 text-base-content/40 hover:text-base-content/70 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold leading-none tracking-wide opacity-60">
              {lang === "uz" ? "EN" : "UZ"}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={() => setShowLogout(true)}
            className="flex flex-col items-center justify-center gap-0.5 pt-1 pb-1 px-3 text-error/50 hover:text-error transition-colors"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold leading-none tracking-wide opacity-60">Chiq</span>
          </button>

        </div>
      </nav>

      {/* ── Logout modal ── */}
      {showLogout && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-sm pb-safe"
          onClick={() => setShowLogout(false)}
        >
          <div
            className="w-full max-w-sm bg-base-100 rounded-t-3xl p-6 pb-8 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp 0.25s cubic-bezier(0.22,1,0.36,1)" }}
          >
            <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

            {/* Handle bar */}
            <div className="w-10 h-1 bg-base-300 rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-error/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-base-content">Chiqishni tasdiqlang</h3>
                <p className="text-xs text-base-content/50 mt-0.5">Hisobdan chiqmoqchimisiz?</p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 py-3 rounded-2xl bg-base-200 text-sm font-bold text-base-content/70 hover:bg-base-300 transition-colors"
              >
                Bekor
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-2xl bg-error text-white text-sm font-bold hover:bg-error/90 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Chiqish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
