import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { getMe, updateMe } from "../../api/auth";
import { getMyStudentData } from "../../api/students";
import { getMyGroups } from "../../api/groups";
import { LoadingState, ErrorState } from "../../components/PageShell";

import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LangContext";
import { formatPhone } from "../../utils/permissions";

const fmt = (n) => Number(n ?? 0).toLocaleString("ru-RU");

const STATUS_STYLE = {
  active: { dot: "bg-success", text: "text-success", label: "Active" },
  inactive: { dot: "bg-warning", text: "text-warning", label: "Inactive" },
  suspended: { dot: "bg-error", text: "text-error", label: "Suspended" },
  graduated: { dot: "bg-info", text: "text-info", label: "Graduated" },
};

// ─── Edit modal ──────────────────────────────────────────────────────────────

function EditModal({ user, onClose, onSaved }) {
  const { t } = useLang();
  const [form, setForm] = useState({
    name: user.name ?? "",
    phone: user.phone ?? "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

 const handleSubmit = async (e) => {
  e.preventDefault()
  if (form.phone && form.phone.replace(/\D/g, '').length < 9) {
    setError("Telefon raqamni to'liq kiriting"); return
  }
  if (form.password && form.password.length < 8) {
    setError("Parol kamida 8 ta belgi bo'lishi kerak"); return
  }
  setLoading(true)
  setError(null)
  try {
    const payload = {}
    if (form.name && form.name !== user.name) payload.name = form.name
    if (form.phone && form.phone !== user.phone) payload.phone = form.phone
    if (form.password) payload.password = form.password

    if (Object.keys(payload).length === 0) {
      onClose()
      return
    }

    const { data } = await updateMe(payload)
    onSaved(data)
    onClose()
  } catch (err) {
    setError(err.response?.data?.message ?? 'Failed to update profile')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm p-6">
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
        >
          ✕
        </button>
        <h3 className="font-semibold text-base mb-5 text-base-content">Edit Profile</h3>
        {error && (
          <div className="alert alert-error py-2 text-sm mb-4">
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            {
              label: t('prof_full_name'),
              key: "name",
              type: "text",
              placeholder: "Ali Karimov",
            },
            {
              label: t('phone'),
              key: "phone",
              type: "tel",
              placeholder: "+998901234567",
            },
            {
              label: t('prof_new_password'),
              key: "password",
              type: "password",
              placeholder: t('prof_blank_pass'),
            },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <p className="text-xs text-base-content/70 font-medium uppercase tracking-wider mb-1.5">
                {label}
              </p>
              <input
                type={type}
                className="input input-bordered w-full input-sm h-10"
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary btn-sm px-5 ${loading ? "loading" : ""}`}
            >
              Save
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-base-300/50" onClick={onClose} />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function MyProfile() {
  const { data: profile, loading: pLoading, error: pError } = useFetch(getMe);
  const { data: studentData, loading: sLoading } = useFetch(getMyStudentData);
  const { data: groupsData, loading: gLoading } = useFetch(getMyGroups);

  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  const [editOpen, setEditOpen] = useState(false);
  const [localUser, setLocalUser] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (pLoading || sLoading) return <LoadingState />;
  const groups = Array.isArray(groupsData)
    ? groupsData
    : (groupsData?.groups ?? []);
  const enrolledGroups = groups.filter((g) => g.isEnrolled);

  if (pLoading || sLoading || gLoading) return <LoadingState />;
  if (pError) return <ErrorState message={pError} />;

  const user = localUser ?? profile;
  const bal = studentData ?? {};
  const balance = Number(bal.balance ?? user?.balance?.balance ?? 0);
  const expected = Number(
    bal.expectedPayments ?? user?.balance?.expectedPayments ?? 0,
  );
  const actual = Number(
    bal.actualPayments ?? user?.balance?.actualPayments ?? 0,
  );
  const unpaid = bal.unpaidMonths ?? user?.balance?.unpaidMonths ?? [];

  const status = studentData?.status ?? "active";
  const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.active;
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "??";

  return (
    <div className="flex flex-col gap-6">
      {/* ── Hero banner ───────────────────────────────────── */}
      <div className="rounded-2xl bg-base-100 border border-base-200 shadow-sm overflow-hidden">
        {/* Top colour strip */}
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

        {/* Content row — overlaps strip */}
        <div className="px-8 pb-6 -mt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          {/* Avatar + name */}
          <div className="flex items-end gap-4">
            <div className="avatar placeholder shrink-0">
              <div className="bg-primary text-primary-content rounded-2xl w-16 h-16 ring-4 ring-base-100 shadow-md">
                <span className="text-xl font-bold">{initials}</span>
              </div>
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-base-content leading-tight">
                {user?.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${statusStyle.text}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                  />
                  {statusStyle.label}
                </span>
                <span className="text-base-content/20">·</span>
                <span className="text-xs text-base-content/40 capitalize">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setEditOpen(true)}
              className="btn btn-outline btn-sm gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              {t('prof_edit')}
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {t('prof_sign_out')}
            </button>
          </div>
        </div>

        {/* Info strip */}
        <div className="border-t border-base-200 px-8 py-3 flex flex-wrap gap-x-8 gap-y-1">
          <InfoChip label={t('phone')} value={formatPhone(user?.phone)} />
          {user?.centerId && (
            <InfoChip label={t('prof_center_id')} value={user.centerId} mono />
          )}
        </div>
      </div>

      {/* ── My Groups Section ──────────────────────────────── */}
      {enrolledGroups.length > 0 && (
        <div className="rounded-2xl bg-base-100 border border-base-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-base-content/40 uppercase tracking-widest">
              {t('prof_my_groups')}
            </p>
            <span className="text-xs text-base-content/50">
              {enrolledGroups.length} group
              {enrolledGroups.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {enrolledGroups.map((group) => {
              const status =
                group.status === "active" ? "bg-success" : "bg-base-content/30";
              return (
                <div
                  key={group._id || group.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-base-50 border border-base-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-base-content truncate">
                        {group.name}
                      </p>
                      <span className={`w-1.5 h-1.5 rounded-full ${status}`} />
                    </div>

                    {group.course && (
                      <p className="text-xs text-base-content/50 truncate">
                        {group.course.title}
                      </p>
                    )}

                    {group.teacher && (
                      <p className="text-xs text-base-content/50 truncate">
                        👨‍🏫 {group.teacher.name}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Two-column row ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance card — wider */}
        <div className="lg:col-span-2 rounded-2xl bg-base-100 border border-base-200 shadow-sm p-6 flex flex-col gap-5">
          <p className="text-xs font-semibold text-base-content/40 uppercase tracking-widest">
            {t('prof_payment_balance')}
          </p>

          {/* Big number */}
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-4xl font-bold tabular-nums ${balance < 0 ? "text-error" : "text-success"}`}
            >
              {balance < 0 ? "−" : "+"}
              {fmt(Math.abs(balance))}
            </span>
            <span className="text-sm text-base-content/30 font-medium">
              UZS
            </span>
          </div>

          {/* 2-stat grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 pt-4 border-t border-base-200">
            {[
              {
                label: t('prof_expected'),
                value: expected,
                color: "text-base-content",
              },
              { label: t('prof_paid'), value: actual, color: "text-success" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <p className="text-xs text-base-content/40">{label}</p>
                <p className={`text-base font-semibold tabular-nums ${color}`}>
                  {fmt(value)}
                  <span className="text-xs font-normal text-base-content/30 ml-0.5">
                    UZS
                  </span>
                </p>
              </div>
            ))}
          </div>

          {/* Unpaid months */}
          {unpaid.length > 0 && (
            <div className="flex items-start gap-3 pt-4 border-t border-base-200">
              <div className="w-5 h-5 rounded-full bg-error/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-error" />
              </div>
              <div>
                <p className="text-xs font-semibold text-error mb-2">
                  {t('prof_unpaid_months')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unpaid.map((m) => (
                    <span
                      key={m}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-error/10 text-error font-mono font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>


      </div>

      {editOpen && (
        <EditModal
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={(u) => {
            setLocalUser(u);
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}

function InfoChip({ label, value, mono }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-base-content/40">{label}:</span>
      <span
        className={`text-base-content/70 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
