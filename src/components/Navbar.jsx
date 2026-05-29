import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { lang, t, toggleLang } = useLang()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <header className="h-14 bg-base-100 border-b border-base-200 px-4 flex items-center justify-between">
      {/* Page title slot — filled by child routes via document.title or a portal */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-base-content/50">{t('welcome')}</span>
        <span className="text-sm font-semibold text-base-content">{user?.name ?? 'User'}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Language toggle */}
        <button onClick={toggleLang} className="btn btn-ghost btn-sm gap-1 font-bold text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          {lang === 'uz' ? 'EN' : 'UZ'}
        </button>

        {/* Notification bell */}
        <button className="btn btn-ghost btn-sm btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* User avatar dropdown */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="avatar placeholder cursor-pointer">
            <div className="bg-primary text-primary-content rounded-full w-8">
              <span className="text-xs font-bold">{initials}</span>
            </div>
          </div>
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-44 p-2 shadow-lg border border-base-200 mt-1">
            <li className="menu-title px-2 pt-1 pb-0">
              <span className="text-xs text-base-content/60 capitalize">{user?.role}</span>
            </li>
            <li><a className="text-sm">{t('profile')}</a></li>
            <li><a className="text-sm">{t('account_settings')}</a></li>
            <div className="divider my-0" />
            <li>
              <button onClick={handleLogout} className="text-sm text-error">
                {t('sign_out')}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  )
}
