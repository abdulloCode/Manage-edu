import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = {
  admin: '/admin/dashboard',
  teacher: '/manager/dashboard',
  student: '/student/dashboard',
  staff: '/staff/dashboard',
};

function formatPhone(digits) {
  const d = digits.slice(0, 9);
  let out = '';
  if (d.length > 0) out += '(' + d.slice(0, 2);
  if (d.length > 2) out += ') ' + d.slice(2, 5);
  if (d.length > 5) out += '-' + d.slice(5, 7);
  if (d.length > 7) out += '-' + d.slice(7, 9);
  return out;
}

export default function Login() {
  const { login, loading, error, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  if (isAuthenticated && user) {
    const role = user.role || 'student';
    return <Navigate to={ROLE_HOME[role] ?? '/user/dashboard'} replace />;
  }

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setPhoneDisplay(formatPhone(digits));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phone = phoneDisplay.replace(/\D/g, '');
    try {
      const loggedUser = await login({ phone, password });
      navigate(ROLE_HOME[loggedUser.role] ?? '/user/dashboard', { replace: true });
    } catch {
      // error displayed via context
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: '#F8F7F4',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .edu-input {
          width: 100%;
          height: 54px;
          padding: 0 18px;
          border: 1.5px solid #E4E1D9;
          border-radius: 12px;
          font-size: 15px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1C1917;
          background: #FFFFFF;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          letter-spacing: 0.01em;
        }
        .edu-input:focus {
          border-color: #2A5F4F;
          box-shadow: 0 0 0 4px rgba(42,95,79,0.10);
        }
        .edu-input::placeholder { color: #A8A29E; }

        .edu-btn {
          width: 100%;
          height: 54px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #FFFFFF;
          background: #2A5F4F;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.02em;
        }
        .edu-btn:hover:not(:disabled) { background: #1F4A3D; transform: translateY(-1px); }
        .edu-btn:active:not(:disabled) { transform: scale(0.99); }
        .edu-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .role-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.1);
        }
        .role-chip .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.7);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .divider-line {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.2);
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim { opacity: 0; animation: fadeSlideUp 0.5s ease forwards; }
        .anim-1 { animation-delay: 0.08s; }
        .anim-2 { animation-delay: 0.16s; }
        .anim-3 { animation-delay: 0.24s; }
        .anim-4 { animation-delay: 0.32s; }
        .anim-5 { animation-delay: 0.40s; }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 0.75s linear infinite; }

        @keyframes shimmer {
          0%   { opacity: 0.6; }
          50%  { opacity: 1; }
          100% { opacity: 0.6; }
        }
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ADE80;
          animation: shimmer 1.8s ease-in-out infinite;
        }

        @media (max-width: 860px) {
          .left-col { display: none !important; }
          .right-col {
            width: 100% !important;
            border-radius: 0 !important;
            padding: 48px 24px !important;
            box-shadow: none !important;
          }
        }

        a { color: #2A5F4F; text-decoration: none; font-weight: 500; }
        a:hover { text-decoration: underline; }
      `}</style>

      {/* ── LEFT COLUMN ────────────────────────────────── */}
      <div
        className="left-col"
        style={{
          flex: 1,
          background: 'linear-gradient(160deg, #1B3D30 0%, #2A5F4F 60%, #1E4D40 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '44px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 320, height: 320, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: 60, left: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L4 7V13C4 17.4 7.4 21.5 12 22.5C16.6 21.5 20 17.4 20 13V7L12 3Z"
                fill="white" fillOpacity="0.9"/>
              <path d="M9 12L11 14L15 10" stroke="#2A5F4F"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 700, fontSize: 20,
            color: '#fff', letterSpacing: '-0.01em',
          }}>
            Iceberg Edu
          </span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 40 }}>

          {/* Tag */}
          <div className="anim anim-1" style={{ marginBottom: 24 }}>
            <span style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
            }}>
              Ta'lim boshqaruv tizimi
            </span>
          </div>

          {/* Heading */}
          <div className="anim anim-2">
            <h1 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(38px, 3.8vw, 56px)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              marginBottom: 20,
            }}>
              O'quvchilar,<br/>
              to'lovlar va<br/>
              <span style={{ color: 'rgba(255,255,255,0.38)' }}>natijalarni</span><br/>
              <span style={{ color: 'rgba(255,255,255,0.38)' }}>boshqaring</span>
            </h1>
          </div>

          {/* Description */}
          <div className="anim anim-3">
            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.65, maxWidth: 360, marginBottom: 36,
            }}>
              Barcha o'qituvchilar, guruhlar va to'lovlar — bitta qulay platformada.
            </p>
          </div>

          {/* Role chips */}
          <div className="anim anim-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 48 }}>
            {['Admin', "O'qituvchi", "O'quvchi", 'Xodim'].map((r) => (
              <div key={r} className="role-chip">
                <span className="dot" />
                {r}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="anim anim-5" style={{
            display: 'flex', alignItems: 'center', gap: 28,
            paddingTop: 32,
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            {[
              { num: '2,400+', label: "O'quvchilar" },
              { num: '48', label: 'Guruhlar' },
              { num: '99%', label: 'Aniqlik' },
            ].map((s, i) => (
              <>
                <div key={s.label} className="stat-item">
                  <span style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 24, fontWeight: 700,
                    color: '#fff', letterSpacing: '-0.02em',
                  }}>{s.num}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{s.label}</span>
                </div>
                {i < 2 && <div key={`div-${i}`} className="divider-line" />}
              </>
            ))}
          </div>
        </div>

        {/* Live badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          marginTop: 32,
        }}>
          <div className="live-dot" />
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Tizim ishlayapti</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 1 }}>
              To'lovlar real vaqtda kuzatilmoqda
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN ───────────────────────────────── */}
      <div
        className="right-col"
        style={{
          width: 500,
          flexShrink: 0,
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px 56px',
          position: 'relative',
          borderLeft: '1px solid #EEEBE4',
        }}
      >
        {/* Help link */}
        <div style={{ position: 'absolute', top: 28, right: 32 }}>
          <a href="#" style={{ fontSize: 13, color: '#A8A29E', fontWeight: 400 }}>
            Yordam kerakmi? <span style={{ color: '#2A5F4F', fontWeight: 500 }}>Bog'laning</span>
          </a>
        </div>

        {/* Brand mark (mobile only backup) */}
        <div className="anim anim-1" style={{ marginBottom: 44 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px 6px 8px',
            border: '1px solid #E4E1D9',
            borderRadius: 100,
            marginBottom: 28,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: '#2A5F4F',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L4 7V13C4 17.4 7.4 21.5 12 22.5C16.6 21.5 20 17.4 20 13V7L12 3Z"
                  fill="white" fillOpacity="0.9"/>
                <path d="M9 12L11 14L15 10" stroke="#2A5F4F"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#57534E' }}>Iceberg Edu</span>
          </div>

          <h2 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 36,
            fontWeight: 800,
            color: '#1C1917',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 8,
          }}>
            Xush kelibsiz
          </h2>
          <p style={{ fontSize: 15, color: '#A8A29E', lineHeight: 1.5 }}>
            Davom etish uchun hisobingizga kiring
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="anim" style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
            </svg>
            <span style={{ color: '#DC2626', fontSize: 14, lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Phone field */}
          <div className="anim anim-2">
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 13, fontWeight: 500, color: '#57534E', marginBottom: 8,
            }}>
              Telefon raqam
              <span style={{ fontSize: 11, color: '#A8A29E', fontWeight: 400 }}>O'zbekiston (+998)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 16, top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex', alignItems: 'center', gap: 8,
                pointerEvents: 'none',
              }}>
                {/* UZ flag */}
                <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
                  <rect width="18" height="4.33" fill="#1EB4FF"/>
                  <rect y="4.33" width="18" height="4.33" fill="#FFFFFF"/>
                  <rect y="8.66" width="18" height="4.34" fill="#3BBF3B"/>
                  <rect y="4.1" width="18" height="0.5" fill="#E0E0E0"/>
                  <rect y="8.4" width="18" height="0.5" fill="#E0E0E0"/>
                </svg>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#78716C' }}>+998</span>
                <div style={{ width: 1, height: 16, background: '#E4E1D9' }} />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="(90) 123-45-67"
                className="edu-input"
                style={{ paddingLeft: 88 }}
                value={phoneDisplay}
                onChange={handlePhoneChange}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                required
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="anim anim-3">
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 13, fontWeight: 500, color: '#57534E', marginBottom: 8,
            }}>
              Parol
              <a href="#" style={{ fontSize: 12, fontWeight: 500, color: '#2A5F4F' }}>
                Unutdingizmi?
              </a>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Parolingizni kiriting"
                className="edu-input"
                style={{ paddingRight: 52 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('pass')}
                onBlur={() => setFocusedField(null)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: 4,
                  color: '#A8A29E', display: 'flex',
                  borderRadius: 6,
                  transition: 'color 0.15s',
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="anim anim-4" style={{ marginTop: 4 }}>
            <button type="submit" className="edu-btn" disabled={loading}>
              {loading ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2.5" className="spin">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Kirish...
                </>
              ) : (
                <>
                  Tizimga kirish
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Role info */}
        <div className="anim anim-5" style={{
          marginTop: 32,
          padding: '16px 18px',
          background: '#F8F7F4',
          borderRadius: 12,
          border: '1px solid #EEEBE4',
        }}>
          <p style={{ fontSize: 12, color: '#A8A29E', marginBottom: 10, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Kirish imkoniyati
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Admin', icon: '⚙', color: '#2A5F4F', bg: '#E8F4F1' },
              { label: "O'qituvchi", icon: '📚', color: '#1D4ED8', bg: '#EFF6FF' },
              { label: "O'quvchi", icon: '🎓', color: '#B45309', bg: '#FFFBEB' },
              { label: 'Xodim', icon: '👤', color: '#6D28D9', bg: '#F5F3FF' },
            ].map(({ label, icon, color, bg }) => (
              <span key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px',
                borderRadius: 100,
                fontSize: 12, fontWeight: 500,
                color, background: bg,
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: 40 }}>
          <p style={{ fontSize: 12, color: '#D6D3CE', textAlign: 'center' }}>
            © 2025 Iceberg Edu · Barcha huquqlar himoyalangan
          </p>
        </div>
      </div>
    </div>
  );
}