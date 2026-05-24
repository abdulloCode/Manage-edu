import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME = {
  admin:     "/admin/dashboard",
  manager:   "/manager/dashboard",
  teacher:   "/teacher/dashboard",
  student:   "/student/dashboard",
  staff:     "/staff/dashboard",
  supporter: "/supporter/dashboard",
  assistant: "/assistant/dashboard",
};

function getRoleHome(role) {
  return ROLE_HOME[role?.toLowerCase()?.trim()] ?? "/student/dashboard";
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

function EyeIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function GradientOrb({ className }) {
  return <div className={`absolute rounded-full blur-3xl opacity-20 animate-pulse ${className}`} />;
}

function FeatureItem({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white flex-shrink-0 text-base">
        {icon}
      </div>
      <span className="text-sm text-white/80 font-medium">{text}</span>
    </div>
  );
}

export default function Login() {
  const { login, loading, error, isAuthenticated, initialized, user } = useAuth();
  const navigate = useNavigate();

  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted]           = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleHome(user.role)} replace />;
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
      navigate(getRoleHome(loggedUser.role), { replace: true });
    } catch {
      /* error shown via context */
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex-col justify-between p-12">
        <GradientOrb className="w-80 h-80 bg-violet-400 -top-20 -left-20" />
        <GradientOrb className="w-96 h-96 bg-indigo-300 bottom-0 right-0" />
        <GradientOrb className="w-56 h-56 bg-blue-400 top-1/2 left-1/3" />

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`, backgroundSize: "28px 28px" }}
        />

        {/* Logo */}
        <div
          className="relative z-10 flex items-center gap-3"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(-12px)", transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight tracking-tight">Manage Edu</p>
            <p className="text-indigo-200 text-xs font-medium">CRM Platform</p>
          </div>
        </div>

        {/* Center text */}
        <div
          className="relative z-10 space-y-8"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s 0.15s cubic-bezier(0.22,1,0.36,1)" }}
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/80 text-xs font-medium">Ta'lim markazi boshqarish tizimi</span>
            </div>
            <h1 className="text-white font-bold leading-[1.15] tracking-tight" style={{ fontSize: "clamp(28px, 3.5vw, 42px)" }}>
              O'quv markazingizni<br />
              <span className="text-indigo-200">professional</span> boshqaring
            </h1>
            <p className="text-white/65 text-sm leading-relaxed max-w-sm">
              O'quvchilar, o'qituvchilar, guruhlar va to'lovlarni bir joydan qulay va tez boshqaring.
            </p>
          </div>
          <div className="space-y-3">
            <FeatureItem icon="👨‍🎓" text="O'quvchilar va guruhlarni boshqarish" />
            <FeatureItem icon="💳" text="To'lovlar va moliyaviy hisobotlar" />
            <FeatureItem icon="📊" text="Real vaqt statistika va tahlil" />
            <FeatureItem icon="🔐" text="Rol asosida ruxsatlar tizimi" />
          </div>
        </div>

        {/* Stats */}
        <div
          className="relative z-10 grid grid-cols-3 gap-4"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "all 0.8s 0.3s cubic-bezier(0.22,1,0.36,1)" }}
        >
          {[
            { num: "500+", label: "O'quvchilar" },
            { num: "50+",  label: "O'qituvchilar" },
            { num: "99%",  label: "Ishonchlilik" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-sm text-center">
              <p className="text-white font-bold text-xl">{s.num}</p>
              <p className="text-white/60 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <p className="font-bold text-gray-900 text-sm">Manage Edu CRM</p>
        </div>

        <div
          className="w-full max-w-[400px]"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "all 0.7s 0.2s cubic-bezier(0.22,1,0.36,1)" }}
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Tizimga kirish</h2>
            <p className="text-sm text-gray-500">Telefon raqamingiz va parolingizni kiriting</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl mb-5">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Telefon raqam</label>
              <div className="relative flex items-center">
                <div className="absolute left-0 flex items-center h-full pl-4 pr-3 border-r border-gray-200 pointer-events-none">
                  <span className="text-sm font-semibold text-gray-500 whitespace-nowrap">+998</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="(90) 123-45-67"
                  value={phoneDisplay}
                  onChange={handlePhoneChange}
                  required
                  autoComplete="tel"
                  className="w-full pl-[72px] pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Parol</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3.5 pr-12 bg-white border-2 border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Kirish...</span>
                </>
              ) : (
                <>
                  <span>Kirish</span>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">Manage Edu CRM</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Admin",   color: "bg-purple-50 text-purple-600 border-purple-100" },
              { label: "Manager", color: "bg-blue-50 text-blue-600 border-blue-100"       },
              { label: "Teacher", color: "bg-green-50 text-green-600 border-green-100"    },
              { label: "Student", color: "bg-amber-50 text-amber-600 border-amber-100"    },
            ].map((r) => (
              <span key={r.label} className={`px-3 py-1 rounded-full text-xs font-semibold border ${r.color}`}>
                {r.label}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-10 text-xs text-gray-400 text-center">
          © 2026 Manage Edu CRM. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
}
