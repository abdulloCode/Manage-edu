import { useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";

const BOTTOM_NAV_ROLES = ["teacher", "student"];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const drawerCheckbox = useRef(null);
  const { user } = useAuth();
  const role = user?.role?.toLowerCase()?.trim();
  const useBottomNav = BOTTOM_NAV_ROLES.includes(role);

  const closeDrawer = () => {
    if (drawerCheckbox.current) drawerCheckbox.current.checked = false;
  };

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      {/* teacher/student mobilda sidebar drawer ochilmasin — faqat desktop da ishlaydi */}
      <input
        id="main-drawer"
        type="checkbox"
        className="drawer-toggle"
        ref={drawerCheckbox}
        disabled={useBottomNav}
      />

      {/* ── Page content ── */}
      <div className="drawer-content flex flex-col bg-base-200 min-h-screen">

        {/* Mobile top bar — faqat admin/manager uchun */}
        {!useBottomNav && (
          <header className="lg:hidden flex items-center gap-3 h-14 px-4 bg-base-100 border-b border-base-200 sticky top-0 z-30">
            <label
              htmlFor="main-drawer"
              className="btn btn-ghost btn-sm btn-square"
              aria-label="Open menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary-content" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                </svg>
              </div>
              <span className="font-bold text-base">CRM Portal</span>
            </div>
          </header>
        )}

        {/* Teacher / Student uchun mobil header — faqat brand va rol ko'rsatadi */}
        {useBottomNav && (
          <header className="lg:hidden flex items-center justify-between h-12 px-4 bg-base-100/95 backdrop-blur-md border-b border-base-200 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <svg className="w-7 h-7 shrink-0" viewBox="0 20 250 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="bnhdr" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7C3AED"/>
                    <stop offset="100%" stopColor="#5B21B6"/>
                  </linearGradient>
                </defs>
                <g transform="translate(40,20)">
                  <path d="M110 10 L180 50 Q205 65 205 92 L205 168 Q205 195 180 210 L110 250 Q85 265 60 250 L-10 210 Q-35 195 -35 168 L-35 92 Q-35 65 -10 50 L60 10 Q85 -5 110 10" stroke="url(#bnhdr)" strokeWidth="12" fill="none"/>
                  <path d="M20 95 L85 60 L150 95 L85 128 Z" fill="url(#bnhdr)"/>
                  <path d="M50 108 V145 L85 165 L120 145 V108" fill="url(#bnhdr)"/>
                  <rect x="138" y="94" width="6" height="30" rx="3" fill="url(#bnhdr)"/>
                  <path d="M-5 145 Q40 158 85 205 Q130 158 175 145 V188 Q130 200 85 240 Q40 200 -5 188 Z" fill="url(#bnhdr)"/>
                </g>
              </svg>
              <span className="font-black text-sm tracking-tight">
                Manage <span className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent">Edu</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                role === "teacher" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {role === "teacher" ? "O'qituvchi" : "O'quvchi"}
              </span>
              <div className="w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            </div>
          </header>
        )}

        {/* Main content — bottom nav uchun pastdan joy */}
        <main className={`flex-1 overflow-y-auto ${
          useBottomNav ? "pb-20 lg:pb-6 p-3 md:p-4" : "p-4 md:p-6"
        }`}>
          <Outlet />
        </main>

        {/* Bottom nav — faqat teacher/student, faqat mobil */}
        {useBottomNav && <BottomNav />}
      </div>

      {/* ── Drawer sidebar — desktop: doim ko'rinadi (lg:drawer-open), mobil: faqat admin/manager ── */}
      <div className="drawer-side z-40 lg:!overflow-visible">
        <label
          htmlFor="main-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onNavClick={closeDrawer}
        />
      </div>
    </div>
  );
}
