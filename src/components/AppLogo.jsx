// Hexagon + graduation cap + book — matches the brand logo
export default function AppLogo({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* ── Outer hexagon (dark navy border) ── */}
      <polygon
        points="50,2 93,26 93,74 50,98 7,74 7,26"
        fill="#0f172a"
        stroke="#1e3a8a"
        strokeWidth="4"
      />

      {/* ── Inner hex tint ── */}
      <polygon
        points="50,13 83,31 83,69 50,87 17,69 17,31"
        fill="#1e1b4b"
      />

      {/* ── Open book — left page ── */}
      <path
        d="M18 69 Q34 61 50 64 L50 77 Q34 74 18 82 Z"
        fill="#7c3aed"
      />
      {/* ── Open book — right page ── */}
      <path
        d="M82 69 Q66 61 50 64 L50 77 Q66 74 82 82 Z"
        fill="#6d28d9"
      />
      {/* Book spine highlight */}
      <rect x="48" y="64" width="4" height="13" rx="1" fill="#a78bfa" />

      {/* ── Graduation cap brim (diamond) ── */}
      <polygon
        points="50,30 78,43 50,56 22,43"
        fill="#7c3aed"
      />
      {/* Cap top (square hat) */}
      <rect x="41" y="20" width="18" height="14" rx="2" fill="#6d28d9" />
      {/* Cap top highlight */}
      <rect x="43" y="22" width="14" height="4" rx="1" fill="#8b5cf6" opacity="0.6" />

      {/* Tassel string */}
      <line x1="78" y1="43" x2="78" y2="57" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
      {/* Tassel bob */}
      <circle cx="78" cy="60" r="4" fill="#a78bfa" />
    </svg>
  )
}
