import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";


const ROLE_HOME = {
  admin:     "/admin/dashboard",
  manager:   "/manager/dashboard",
  teacher:   "/teacher/dashboard",
  student:   "/student/dashboard",
  staff:     "/staff/dashboard",
  supporter: "/supporter/dashboard",
  assistant: "/assistant/dashboard",
};
const getRoleHome = (role) => ROLE_HOME[role?.toLowerCase()?.trim()] ?? "/student/dashboard";

const fmtPhone = (raw) => {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  d = d.slice(0, 9);
  if (!d) return "";
  let o = "+998";
  if (d.length >= 1) o += " " + d.slice(0, 2);
  if (d.length >= 3) o += " " + d.slice(2, 5);
  if (d.length >= 6) o += "-" + d.slice(5, 7);
  if (d.length >= 8) o += "-" + d.slice(7, 9);
  return o;
};

export default function Login() {
  const { login, loading, error, isAuthenticated, initialized, user } = useAuth();
  const navigate = useNavigate();
  const { lang, toggleLang } = useLang();

  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [password, setPassword]         = useState("");
  const [showPass, setShowPass]         = useState(false);

  if (!initialized) return (
    <div style={S.page}>
      <div style={S.spinner} />
      <style>{CSS}</style>
    </div>
  );

  if (isAuthenticated && user) return <Navigate to={getRoleHome(user.role)} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phone9 = phoneDisplay.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
    try {
      const u = await login({ phone: phone9, password });
      navigate(getRoleHome(u.role), { replace: true });
    } catch {}
  };

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Decorative blobs */}
      <div style={{ ...S.blob, top: -80, left: -80, background: "radial-gradient(circle, rgba(167,139,250,.18) 0%, transparent 70%)", width: 380, height: 380 }} />
      <div style={{ ...S.blob, bottom: -60, right: -60, background: "radial-gradient(circle, rgba(196,181,253,.15) 0%, transparent 70%)", width: 320, height: 320 }} />
      <div style={{ ...S.blob, top: "40%", right: "15%", background: "radial-gradient(circle, rgba(224,231,255,.2) 0%, transparent 70%)", width: 240, height: 240 }} />

      <div className="login-card-wrap">
        {/* Card */}
        <div className="login-card">

          {/* Header */}
          <div style={S.header}>
            <div style={S.logoWrap}>
              <div style={S.logo}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
                </svg>
              </div>
            </div>
            <h1 style={S.title}>Manage Edu</h1>
            <p style={S.sub}>
              {lang === "uz" ? "Hisobingizga kiring" : "Welcome back"}
            </p>
          </div>

          {/* Body */}
          <div style={S.body}>

            {/* Error */}
            {error && (
              <div className="login-error">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Phone */}
              <div style={S.fieldWrap}>
                <label style={S.label}>{lang === "uz" ? "Telefon" : "Phone"}</label>
                <div style={{ position: "relative" }}>
                  <PhoneIcon />
                  <input
                    className="login-input"
                    style={{ paddingLeft: 40 }}
                    type="tel"
                    inputMode="numeric"
                    placeholder="+998 90 123-45-67"
                    value={phoneDisplay}
                    onChange={(e) => setPhoneDisplay(fmtPhone(e.target.value))}
                    required
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Password */}
              <div style={S.fieldWrap}>
                <label style={S.label}>{lang === "uz" ? "Parol" : "Password"}</label>
                <div style={{ position: "relative" }}>
                  <LockIcon />
                  <input
                    className="login-input"
                    style={{ paddingLeft: 40, paddingRight: 42 }}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)} style={S.eyeBtn}>
                    {showPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: 6 }}>
                {loading ? (
                  <div style={S.spinner} />
                ) : (
                  <>
                    {lang === "uz" ? "Kirish" : "Sign in"}
                    <ArrowIcon />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div style={S.footer}>
            <div style={S.divider}>
              <span style={S.dividerLine} />
              <span style={S.dividerText}>roles</span>
              <span style={S.dividerLine} />
            </div>
            <div style={S.chips}>
              {CHIPS.map(c => (
                <span key={c.label} style={{ ...S.chip, background: c.bg, color: c.color }}>{c.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Lang toggle */}
        <button className="lang-toggle" onClick={toggleLang}>
          <GlobeIcon />
          {lang === "uz" ? "English" : "O'zbek"}
        </button>
      </div>
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────
const CHIPS = [
  { label: "Admin",   bg: "#f3f0ff", color: "#7c3aed" },
  { label: "Manager", bg: "#eff6ff", color: "#3b82f6" },
  { label: "Teacher", bg: "#f0fdf4", color: "#16a34a" },
  { label: "Student", bg: "#fffbeb", color: "#d97706" },
];

// ── Styles ────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #f8f7ff 0%, #fdfcff 45%, #f5f3ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    padding: "32px 32px 24px",
    textAlign: "center",
    borderBottom: "1px solid #f3f0ff",
  },
  logoWrap: { marginBottom: 16 },
  logo: {
    width: 56,
    height: 56,
    background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    boxShadow: "0 8px 24px rgba(124,58,237,.22)",
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "#1e1b4b",
    margin: "0 0 6px",
    letterSpacing: "-0.02em",
  },
  sub: {
    fontSize: 13,
    color: "#a5b4fc",
    margin: 0,
    fontWeight: 500,
  },
  body: {
    padding: "24px 32px",
  },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#c4b5fd",
    padding: 4,
    display: "flex",
    alignItems: "center",
    lineHeight: 1,
  },
  footer: {
    padding: "0 32px 28px",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#ede9fe",
  },
  dividerText: {
    fontSize: 10,
    fontWeight: 700,
    color: "#c4b5fd",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "center",
  },
  chip: {
    padding: "4px 13px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.03em",
  },
  spinner: {
    width: 20,
    height: 20,
    border: "2.5px solid rgba(167,139,250,.3)",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
};

const CSS = `
  @keyframes spin  { to { transform: rotate(360deg) } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }

  .login-card-wrap {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 400px;
    animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .login-card {
    width: 100%;
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 24px;
    border: 1px solid rgba(196,181,253,.35);
    box-shadow: 0 8px 40px rgba(124,58,237,.08), 0 2px 12px rgba(0,0,0,.04);
    overflow: hidden;
  }
  .login-input {
    width: 100%;
    height: 48px;
    padding: 0 14px;
    border: 1.5px solid #ede9fe;
    border-radius: 13px;
    background: #faf9ff;
    font-size: 14px;
    font-weight: 500;
    color: #1e1b4b;
    outline: none;
    transition: border-color .15s, background .15s, box-shadow .15s;
    box-sizing: border-box;
    font-family: inherit;
  }
  .login-input:focus {
    border-color: #a78bfa;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(167,139,250,.12);
  }
  .login-input::placeholder { color: #ddd6fe; }
  .login-btn {
    width: 100%;
    height: 50px;
    background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
    color: #fff;
    border: none;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity .15s, transform .1s, box-shadow .15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 18px rgba(124,58,237,.28);
    letter-spacing: 0.01em;
    font-family: inherit;
  }
  .login-btn:hover:not(:disabled) {
    box-shadow: 0 6px 24px rgba(124,58,237,.38);
    opacity: .93;
  }
  .login-btn:active:not(:disabled) { transform: scale(0.98); }
  .login-btn:disabled { opacity: .55; cursor: not-allowed; }
  .login-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 14px;
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-radius: 11px;
    margin-bottom: 14px;
    font-size: 13px;
    color: #e11d48;
    font-weight: 500;
  }
  .lang-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 999px;
    background: rgba(255,255,255,0.7);
    border: 1px solid #ede9fe;
    font-size: 12px;
    font-weight: 600;
    color: #a78bfa;
    cursor: pointer;
    transition: background .15s;
    backdrop-filter: blur(8px);
    font-family: inherit;
  }
  .lang-toggle:hover { background: rgba(255,255,255,.9); }
  input[type="password"]::-ms-reveal,
  input[type="password"]::-ms-clear { display: none; }
`;

// ── Icons ─────────────────────────────────────────────────────────
const iconStyle = { position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#c4b5fd", pointerEvents: "none", display: "flex" };

function PhoneIcon() {
  return (
    <span style={iconStyle}>
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.338c0-.966.784-1.75 1.75-1.75h2.154c.356 0 .674.22.794.553l1.31 3.66a.875.875 0 01-.198.944L7.03 10.86a13.128 13.128 0 006.11 6.11l1.115-1.08a.875.875 0 01.944-.198l3.66 1.31c.333.12.553.438.553.794v2.154a1.75 1.75 0 01-1.75 1.75C8.574 21.5 2.25 15.176 2.25 7.338v-1z" />
      </svg>
    </span>
  );
}
function LockIcon() {
  return (
    <span style={iconStyle}>
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    </span>
  );
}
function EyeIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12a8.96 8.96 0 00.284 2.253" />
    </svg>
  );
}
