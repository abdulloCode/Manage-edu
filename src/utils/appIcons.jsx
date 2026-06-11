import { Send, Play, Camera, MessageCircle, Music2, Globe, GraduationCap, Gamepad2, Tv, BookOpen, ShoppingBag, Smartphone } from 'lucide-react'

// Ma'lum ilovalar uchun ikonka + brend rangi.
// Kalit so'zlar appName / packageName ichida qidiriladi (kichik harflarda).
const APP_BRANDS = [
  { match: ['telegram'],                    icon: Send,          bg: 'bg-sky-500',     text: 'text-white' },
  { match: ['youtube'],                     icon: Play,          bg: 'bg-red-500',     text: 'text-white' },
  { match: ['instagram'],                   icon: Camera,        bg: 'bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400', text: 'text-white' },
  { match: ['whatsapp'],                    icon: MessageCircle, bg: 'bg-emerald-500', text: 'text-white' },
  { match: ['tiktok'],                      icon: Music2,        bg: 'bg-black',       text: 'text-white' },
  { match: ['chrome', 'browser'],           icon: Globe,         bg: 'bg-blue-500',    text: 'text-white' },
  { match: ['manage edu', 'manageedu', 'manage_edu'], icon: GraduationCap, bg: 'bg-violet-600', text: 'text-white' },
  { match: ['game', "o'yin", 'oyin'],       icon: Gamepad2,      bg: 'bg-amber-500',   text: 'text-white' },
  { match: ['netflix', 'tv', 'video'],      icon: Tv,            bg: 'bg-rose-600',    text: 'text-white' },
  { match: ['kitob', 'book', 'pdf', 'reader'], icon: BookOpen,   bg: 'bg-emerald-600', text: 'text-white' },
  { match: ['market', 'shop', 'olx'],       icon: ShoppingBag,   bg: 'bg-orange-500',  text: 'text-white' },
]

export function getAppBrand(app) {
  const key = `${app?.appName ?? ''} ${app?.packageName ?? ''}`.toLowerCase()
  const found = APP_BRANDS.find(b => b.match.some(m => key.includes(m)))
  if (found) return found
  return { icon: Smartphone, bg: 'bg-base-300', text: 'text-base-content/50' }
}

export function AppIcon({ app, className = 'w-9 h-9', iconClassName = 'w-4 h-4' }) {
  const { icon: Icon, bg, text } = getAppBrand(app)
  return (
    <div className={`${className} rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      <Icon className={`${iconClassName} ${text}`} />
    </div>
  )
}
