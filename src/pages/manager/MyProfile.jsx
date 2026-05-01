import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { getMe, updateMe } from '../../api/auth'
import { getMyTeacherData } from '../../api/teachers'
import { LoadingState, ErrorState } from '../../components/PageShell'

import { useAuth } from '../../context/AuthContext'

const fmt = (n) => Number(n ?? 0).toLocaleString('ru-RU')

const STATUS_STYLE = {
  active:   { dot: 'bg-success', text: 'text-success', label: 'Active' },
  inactive: { dot: 'bg-warning', text: 'text-warning', label: 'Inactive' },
  suspended:{ dot: 'bg-error',   text: 'text-error',   label: 'Suspended' },
}

function EditModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user.name ?? '',
    phone: user.phone ?? '',
    email: user.email ?? '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = { name: form.name, phone: form.phone, email: form.email || undefined }
      if (form.password) payload.password = form.password
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
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">✕</button>
        <h3 className="font-semibold text-base mb-5 text-base-content">Edit Profile</h3>
        {error && <div className="alert alert-error py-2 text-sm mb-4"><span>{error}</span></div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: 'Full name',    key: 'name',     type: 'text',     placeholder: 'Sardor Karimov' },
            { label: 'Phone',        key: 'phone',    type: 'tel',      placeholder: '+998901234567' },
            { label: 'Email',        key: 'email',    type: 'email',    placeholder: 'sardor@gmail.com' },
            { label: 'New password', key: 'password', type: 'password', placeholder: 'Leave blank to keep current' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <p className="text-xs text-base-content/70 font-medium uppercase tracking-wider mb-1.5">{label}</p>
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
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading} className={`btn btn-primary btn-sm px-5 ${loading ? 'loading' : ''}`}>Save</button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-base-300/50" onClick={onClose} />
    </div>
  )
}

export default function TeacherProfile() {
  const { data: profile, loading: pLoading, error: pError } = useFetch(getMe)
  const { data: teacherData, loading: tLoading } = useFetch(getMyTeacherData)

  const { logout } = useAuth()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [localUser, setLocalUser] = useState(null)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  if (pLoading || tLoading) return <LoadingState />
  if (pError) return <ErrorState message={pError} />

  const user   = localUser ?? profile
  const bal    = (localUser ?? profile)?.balance ?? teacherData ?? {}
  const salary = Number(bal.expectedSalary ?? teacherData?.salary ?? 0)
  const balance= Number(bal.balance ?? teacherData?.balance ?? 0)
  const credit = Number(bal.credit  ?? bal.actualPayments ?? teacherData?.credit ?? 0)
  const debit  = Number(bal.debit   ?? teacherData?.debit  ?? 0)
  const groupBreakdown = bal.groupBreakdown ?? []

  const status      = teacherData?.status ?? 'active'
  const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.active
  const initials    = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '??'

  return (
    <div className="flex flex-col gap-6">

      {/* ── Hero banner ── */}
      <div className="rounded-2xl bg-base-100 border border-base-200 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

        <div className="px-8 pb-6 -mt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          {/* Avatar + name */}
          <div className="flex items-end gap-4">
            <div className="avatar placeholder shrink-0">
              <div className="bg-primary text-primary-content rounded-2xl w-16 h-16 ring-4 ring-base-100 shadow-md">
                <span className="text-xl font-bold">{initials}</span>
              </div>
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-base-content leading-tight">{user?.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`flex items-center gap-1 text-xs font-medium ${statusStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                  {statusStyle.label}
                </span>
                <span className="text-base-content/20">·</span>
                <span className="text-xs text-base-content/40 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button onClick={() => setEditOpen(true)} className="btn btn-outline btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>

        {/* Info strip */}
        <div className="border-t border-base-200 px-8 py-3 flex flex-wrap gap-x-8 gap-y-1">
          <InfoChip label="Phone" value={user?.phone} />
          {user?.email && <InfoChip label="Email" value={user.email} />}
          {user?.centerId && <InfoChip label="Center ID" value={user.centerId} mono />}
        </div>
      </div>

      {/* ── Two-column row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Salary balance card */}
        <div className="lg:col-span-2 rounded-2xl bg-base-100 border border-base-200 shadow-sm p-6 flex flex-col gap-5">
          <p className="text-xs font-semibold text-base-content/40 uppercase tracking-widest">Salary Balance</p>

          {/* Big number */}
          <div className="flex items-baseline gap-1.5">
            <span className={`text-4xl font-bold tabular-nums ${balance >= 0 ? 'text-success' : 'text-error'}`}>
              {balance >= 0 ? '+' : '−'}{fmt(Math.abs(balance))}
            </span>
            <span className="text-sm text-base-content/30 font-medium">UZS</span>
          </div>

          {/* 3-stat grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-base-200">
            {[
              { label: 'Monthly Salary', value: salary, color: 'text-base-content' },
              { label: 'Paid (Credit)',  value: credit, color: 'text-success' },
              { label: 'Debit',          value: debit,  color: 'text-error' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <p className="text-xs text-base-content/40">{label}</p>
                <p className={`text-base font-semibold tabular-nums ${color}`}>
                  {fmt(value)}<span className="text-xs font-normal text-base-content/30 ml-0.5">UZS</span>
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {editOpen && (
        <EditModal
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={(u) => { setLocalUser(u); setEditOpen(false) }}
        />
      )}
    </div>
  )
}

function InfoChip({ label, value, mono }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-base-content/40">{label}:</span>
      <span className={`text-base-content/70 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
