import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  staff: "/staff/dashboard",
  supporter: "/admin/dashboard",
  assistant: "/admin/dashboard",
};

// Helper function to normalize role to lowercase for case-insensitive matching
function getRoleHome(role) {
  const normalizedRole = role?.toLowerCase()?.trim();
  console.log("Login - User role:", role, "Normalized:", normalizedRole);
  return ROLE_HOME[normalizedRole] ?? "/student/dashboard";
}

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

  const rightIn = useEntrance(150);
  const formIn = useEntrance(300);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <Navigate to={getRoleHome(user.role)} replace />
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
      console.log("Login - Logged user:", loggedUser);
      navigate(getRoleHome(loggedUser.role), {
        replace: true,
      });
    } catch {
      /* error shown via context */
    }
  };

  const panelTransition = (inView) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(16px)",
    transition:
      "opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-base-100"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div
        className="h-full w-full max-w-[400px] px-6 sm:px-0"
        style={panelTransition(rightIn)}
      >
        {/* Top bar */}

        <div className="flex justify-between items-center mb-auto">
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-base-100" />
            </div>
            <span className="font-medium text-sm text-base-content">
              CRM Portal
            </span>
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-1.5 cursor-pointer group">
            <svg
              className="w-4 h-4 text-base-content/70 transition-colors group-hover:text-base-content/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
            </svg>
            <span className="text-sm text-base-content/70 group-hover:text-base-content/70 transition-colors">
              Sign Up
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[360px]" style={panelTransition(formIn)}>
            <div className="mb-8">
              <h1
                className="text-base-content mb-2"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "34px",
                  fontWeight: 600,
                  letterSpacing: "-0.5px",
                }}
              >
                Welcome back
              </h1>
              <p className="text-sm text-base-content/70 font-light">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error flex items-center gap-2.5 px-4 py-3 rounded-2xl mb-5 text-sm animate-[slideIn_0.3s_ease-out]">
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
                  className="w-full text-sm text-base-content outline-none transition-all duration-300 placeholder:text-base-content/60 border border-base-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  style={{
                    height: "54px",
                    borderRadius: "14px",
                    padding: "0 20px",
                    fontSize: "14px",
                    fontWeight: 400,
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
                  className="w-full text-sm text-base-content outline-none transition-all duration-300 placeholder:text-base-content/60 border border-base-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  style={{
                    height: "54px",
                    borderRadius: "14px",
                    padding: "0 48px 0 20px",
                    fontSize: "14px",
                    fontWeight: 400,
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content/60 transition-colors duration-200"
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
                  // className="text-sm font-medium transition-all duration-200 hover:opacity-70"
                  className="text-primary"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2.5 text-primary-content font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] bg-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-px"
                style={{
                  height: "54px",
                  borderRadius: "14px",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: 500,
                  letterSpacing: "0.2px",
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
        <div className="flex justify-between items-center mt-auto pt-6 border-t border-base-200">
          <span className="text-xs text-base-content/60 font-light">
            © 2026 CRM Portal
          </span>
          <div className="flex items-center gap-4 text-xs text-base-content/60 font-light">
            <a
              href="#"
              className="hover:text-base-content/50 transition-colors duration-200"
            >
              Contact Us
            </a>
            {/* <span className="flex items-center gap-1 cursor-pointer hover:text-base-content/50 transition-colors duration-200">
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
            </span> */}
          </div>
        </div>
      </div>
    </div>
  );
}
