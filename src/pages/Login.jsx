import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  staff: "/staff/dashboard",
};

function formatPhone(digits) {
  const d = digits.slice(0, 9);
  let out = "";
  if (d.length > 0) out += "(" + d.slice(0, 2);
  if (d.length > 2) out += ") " + d.slice(2, 5);
  if (d.length > 5) out += "-" + d.slice(5, 7);
  if (d.length > 7) out += "-" + d.slice(7, 9);
  return out;
}

/* Entrance animation hook */
function useEntrance(delay = 0) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return show;
}

export default function Login() {
  const { login, loading, error, isAuthenticated, initialized, user } =
    useAuth();
  const navigate = useNavigate();
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const leftIn = useEntrance(50);
  const rightIn = useEntrance(150);
  const formIn = useEntrance(300);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <Navigate to={ROLE_HOME[user.role] ?? "/student/dashboard"} replace />
    );
  }

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    setPhoneDisplay(formatPhone(digits));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phone = phoneDisplay.replace(/\D/g, "");
    try {
      const loggedUser = await login({ phone, password });
      navigate(ROLE_HOME[loggedUser.role] ?? "/student/dashboard", {
        replace: true,
      });
    } catch {
      /* error shown via context */
    }
  };

  const chartBars = [40, 65, 50, 80, 55, 70, 45];

  const panelTransition = (inView) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(16px)",
    transition:
      "opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
  });

  return (
    <div
      className="min-h-screen flex bg-neutral-950"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Left: Dark brand panel ─────────────────────────────── */}
      <div
        className="hidden lg:flex relative w-[480px] shrink-0 flex-col justify-between overflow-hidden p-12"
        style={{ background: "#0c0c0c" }}
      >
        {/* Animated gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full blur-[100px] opacity-30"
            style={{
              background:
                "radial-gradient(circle, #e8472a 0%, transparent 70%)",
              animation: "pulseOrb 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-[320px] h-[320px] rounded-full blur-[100px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, #f4a535 0%, transparent 70%)",
              animation: "pulseOrb 10s ease-in-out infinite 2s",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full"
            style={{ border: "0.5px dashed rgba(255,255,255,0.04)" }}
          />
        </div>

        {/* Logo */}
        <div
          className="relative z-10 flex items-center gap-2.5"
          style={panelTransition(leftIn)}
        >
          <div
            className="w-7 h-7 rounded-full p-[3px]"
            style={{
              background:
                "conic-gradient(#e8472a, #f4a535, #4caf50, #2196f3, #e8472a)",
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{ background: "#0c0c0c" }}
            />
          </div>
          <span className="text-white/90 font-medium text-[15px] tracking-tight">
            CRM Portal
          </span>
        </div>

        {/* Headline + description */}
        <div className="relative z-10" style={panelTransition(leftIn)}>
          <h2
            className="text-white leading-[1.1] tracking-tight mb-4"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "42px",
              fontWeight: 600,
              letterSpacing: "-0.5px",
            }}
          >
            Manage your
            <br />
            learning
            <br />
            journey.
          </h2>
          <p
            className="text-sm leading-relaxed max-w-[260px]"
            style={{ color: "rgba(255,255,255,0.38)", fontWeight: 300 }}
          >
            Track groups, payments, grades and attendance — all from a single
            unified dashboard.
          </p>

          {/* Mini dashboard mockup */}
          <div
            className="mt-10 max-w-[200px] rounded-2xl p-4 backdrop-blur-md"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="rounded-xl p-3 mb-3"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div
                className="text-[10px] mb-1 tracking-wide uppercase"
                style={{ color: "rgba(255,255,255,0.3)", fontWeight: 500 }}
              >
                This Month
              </div>
              <div className="text-white font-semibold text-xl tracking-tight">
                897.00 €
              </div>
              <div className="flex items-center gap-1 mt-1">
                <svg
                  className="w-3 h-3 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                <span className="text-[10px] text-emerald-400 font-medium">
                  +12.5%
                </span>
              </div>
            </div>
            <div
              className="flex items-end gap-[3px]"
              style={{ height: "40px" }}
            >
              {chartBars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all duration-500"
                  style={{
                    height: leftIn ? `${h}%` : "0%",
                    background:
                      i === chartBars.length - 1
                        ? "#e8472a"
                        : "rgba(255,255,255,0.12)",
                    transitionDelay: `${i * 60 + 400}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div
          className="relative z-10 text-[11px] font-light tracking-wide"
          style={{ color: "rgba(255,255,255,0.18)" }}
        >
          Global management made simple.
        </div>
      </div>

      {/* ── Right: Form panel ──────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col bg-white px-8 sm:px-10 py-10"
        style={panelTransition(rightIn)}
      >
        {/* Top bar */}
        <div className="flex justify-between items-center mb-auto">
          <div className="flex lg:hidden items-center gap-2">
            <div
              className="w-6 h-6 rounded-full p-[2.5px]"
              style={{
                background:
                  "conic-gradient(#e8472a, #f4a535, #4caf50, #2196f3, #e8472a)",
              }}
            >
              <div className="w-full h-full rounded-full bg-white" />
            </div>
            <span className="font-medium text-sm text-gray-900">
              CRM Portal
            </span>
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-1.5 cursor-pointer group">
            <svg
              className="w-4 h-4 text-gray-400 transition-colors group-hover:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
            </svg>
            <span className="text-sm text-gray-400 group-hover:text-gray-700 transition-colors">
              Sign Up
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[360px]" style={panelTransition(formIn)}>
            <div className="mb-8">
              <h1
                className="text-gray-900 mb-2"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "34px",
                  fontWeight: 600,
                  letterSpacing: "-0.5px",
                }}
              >
                Welcome back
              </h1>
              <p className="text-sm text-gray-400 font-light">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl mb-5 text-sm animate-[slideIn_0.3s_ease-out]"
                style={{
                  background: "#fff3f2",
                  border: "1px solid #fecdca",
                  color: "#c0392b",
                }}
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Phone */}
              <div className="relative group">
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Phone number"
                  value={phoneDisplay}
                  onChange={handlePhoneChange}
                  required
                  autoComplete="tel"
                  className="w-full text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-300"
                  style={{
                    height: "54px",
                    borderRadius: "14px",
                    border: "1.5px solid #e8e8e8",
                    padding: "0 20px",
                    fontSize: "14px",
                    fontWeight: 400,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#e8472a";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(232, 71, 42, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e8e8e8";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-300"
                  style={{
                    height: "54px",
                    borderRadius: "14px",
                    border: "1.5px solid #e8e8e8",
                    padding: "0 48px 0 20px",
                    fontSize: "14px",
                    fontWeight: 400,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#e8472a";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(232, 71, 42, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e8e8e8";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <svg
                      className="w-[18px] h-[18px]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-[18px] h-[18px]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <a
                  href="#"
                  className="text-sm font-medium transition-all duration-200 hover:opacity-70"
                  style={{ color: "#e8472a" }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2.5 text-white font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{
                  height: "54px",
                  borderRadius: "14px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #e8472a 0%, #f4733a 100%)",
                  fontSize: "15px",
                  fontWeight: 500,
                  letterSpacing: "0.2px",
                  boxShadow: "0 8px 24px -8px rgba(232, 71, 42, 0.45)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 32px -8px rgba(232, 71, 42, 0.55)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px -8px rgba(232, 71, 42, 0.45)";
                }}
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-between items-center mt-auto pt-6"
          style={{ borderTop: "0.5px solid #f3f4f6" }}
        >
          <span className="text-xs text-gray-300 font-light">
            © 2026 CRM Portal
          </span>
          <div className="flex items-center gap-4 text-xs text-gray-300 font-light">
            <a
              href="#"
              className="hover:text-gray-500 transition-colors duration-200"
            >
              Contact Us
            </a>
            <span className="flex items-center gap-1 cursor-pointer hover:text-gray-500 transition-colors duration-200">
              English
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulseOrb {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
