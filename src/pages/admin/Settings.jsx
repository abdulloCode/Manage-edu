import { useState, useEffect } from 'react'
import { User, Mail, Phone, Save, Palette, Loader2, Check, Monitor } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

// ─── API Helper ───────────────────────────────────────────────────────────────

const parseJSON = async (res, label) => {
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    const text = await res.text()
    throw new Error(`${label}: expected JSON but got "${text.slice(0, 80)}"`)
  }
  return res.json()
}

const api = {

  get: async (path) => {
    const res = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    const data = await parseJSON(res, `GET ${path}`)
    if (!res.ok) throw new Error(data.message || `GET ${path} failed: ${res.status}`)
    return data
  },
  put: async (path, body) => {
    const res = await fetch(`/api${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    const data = await parseJSON(res, `PUT ${path}`)
    if (!res.ok) throw new Error(data.message || `PUT ${path} failed: ${res.status}`)
    return data
  },
}

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [message, setMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3500)
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-base-content">Settings</h1>
        <p className="text-sm text-base-content/50 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {message && (
        <div className={`alert py-2 text-sm flex-shrink-0 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-100 border border-base-200 flex-shrink-0">
        <button
          className={`tab gap-2 ${activeTab === 'profile' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          className={`tab gap-2 ${activeTab === 'appearance' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <Palette className="w-4 h-4" />
          Appearance
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'profile' && <ProfileTab onMessage={showMessage} />}
        {activeTab === 'appearance' && <AppearanceTab onMessage={showMessage} />}
      </div>
    </div>
  )
}

// ─── Appearance Tab ────────────────────────────────────────────────────────────

function AppearanceTab({ onMessage }) {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="bg-base-100 rounded-xl border border-base-200 p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6 pb-6 border-b border-base-200 flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Palette className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-base-content">Appearance</h2>
          <p className="text-sm text-base-content/50">Customize your interface colors</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mb-6 flex-shrink-0">
          <h3 className="text-sm font-medium text-base-content mb-3 flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Color Themes
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {themes.map((colorTheme) => (
              <button
                key={colorTheme.id}
                onClick={() => {
                  setTheme(colorTheme.id)
                  onMessage('success', `Theme changed to ${colorTheme.name}`)
                }}
                className={`
                  relative flex items-center gap-4 p-4 rounded-lg border-2 transition-all
                  ${theme === colorTheme.id
                    ? 'border-primary bg-primary/5'
                    : 'border-base-200 hover:border-primary/50 hover:bg-base-50'
                  }
                `}
              >
                {/* Color preview */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-full shadow-inner"
                    style={{ backgroundColor: colorTheme.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded-full shadow-inner"
                    style={{ backgroundColor: colorTheme.secondary }
                    }
                  />
                </div>

                {/* Theme info */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-base-content truncate">
                      {colorTheme.name}
                    </span>
                    {theme === colorTheme.id && (
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {[
                      colorTheme.primary,
                      colorTheme.secondary,
                      colorTheme.background,
                      colorTheme.surface,
                      colorTheme.text
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border border-base-200"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ onMessage }) {
  const [formData, setFormData] = useState({ name: '', phone: '' })
  const [fetchLoading, setFetchLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.get('/me')
      .then((data) => {
        if (cancelled) return
        setFormData({
          name: data.name ?? '',
          phone: data.phone ?? '',
        })
      })
      .catch((err) => {
        if (cancelled) return
        onMessage('error', 'Failed to load profile.')
      })
      .finally(() => {
        if (!cancelled) setFetchLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleChange = (key) => (e) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSave = async () => {
    setSaveLoading(true)
    try {
      const payload = {}
      if (formData.name)  payload.name  = formData.name
      if (formData.email) payload.email = formData.email
      if (formData.phone) payload.phone = formData.phone
      await api.put('/me', payload)
      onMessage('success', 'Profile updated successfully!')
    } catch (err) {
      onMessage('error', err.message || 'Failed to save profile.')
    } finally {
      setSaveLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="bg-base-100 rounded-xl border border-base-200 p-6 flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="bg-base-100 rounded-xl border border-base-200 p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6 pb-6 border-b border-base-200 flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-base-content">Profile Settings</h2>
          <p className="text-sm text-base-content/50">Update your personal information</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-base-200 flex-shrink-0">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-10 h-10 text-primary" />
        </div>
        <button className="btn btn-outline btn-sm gap-2">
          <Palette className="w-4 h-4" />
          Change Avatar
        </button>
      </div>

      {/* Form */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        <FormField
          label="Full Name"
          value={formData.name}
          onChange={handleChange('name')}
          placeholder="John Doe"
          icon={<User className="w-4 h-4" />}
        />
        <FormField
          label="Phone"
          value={formData.phone}
          onChange={handleChange('phone')}
          placeholder="+998901234567"
          type="tel"
          icon={<Phone className="w-4 h-4" />}
        />
      </div>

      <div className="flex justify-end pt-6 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={saveLoading}
          className="btn btn-primary gap-2"
        >
          {saveLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
          Save Changes
        </button>
      </div>
    </div>
  )
}

// ─── FormField ────────────────────────────────────────────────────────────────

function FormField({ label, value, onChange, placeholder, type = 'text', icon }) {
  return (
    <div className="form-control">
      <label className="label pb-1">
        <span className="label-text font-medium text-base-content">{label}</span>
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input input-bordered w-full ${icon ? 'pl-10' : ''}`}
        />
      </div>
    </div>
  )
}