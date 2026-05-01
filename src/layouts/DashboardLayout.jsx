import { useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const drawerCheckbox = useRef(null);

  const closeDrawer = () => {
    if (drawerCheckbox.current) drawerCheckbox.current.checked = false;
  };

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input
        id="main-drawer"
        type="checkbox"
        className="drawer-toggle"
        ref={drawerCheckbox}
      />

      {/* ── Page content ── */}

      <div className="drawer-content flex flex-col bg-base-200 min-h-screen">
        {/* Mobile top bar */}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </label>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-primary-content"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
            </div>
            <span className="font-bold text-base">CRM Portal</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* ── Drawer sidebar ── */}
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
