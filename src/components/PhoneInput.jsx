import { useState, useEffect } from 'react'

// digits = 9 ta raqam → "+998 90 123-45-67"
function formatPhone(digits) {
  const d = digits.slice(0, 9)
  if (d.length === 0) return ''
  let out = '+998'
  if (d.length >= 1) out += ' ' + d.slice(0, 2)
  if (d.length >= 3) out += ' ' + d.slice(2, 5)
  if (d.length >= 6) out += '-' + d.slice(5, 7)
  if (d.length >= 8) out += '-' + d.slice(7, 9)
  return out
}

// input qiymatidan faqat 9 ta raqam olish (+998 ni olib tashlagan holda)
function extractDigits(raw) {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('998')) digits = digits.slice(3)
  return digits.slice(0, 9)
}

export default function PhoneInput({
  value,
  onChange,
  className = '',
  placeholder = '+998 90 123-45-67',
  required = false,
  disabled = false,
}) {
  const initDigits = extractDigits(value || '')
  const [display, setDisplay] = useState(formatPhone(initDigits))

  useEffect(() => {
    const d = extractDigits(value || '')
    setDisplay(formatPhone(d))
  }, [value])

  const handleChange = (e) => {
    const digits = extractDigits(e.target.value)
    setDisplay(formatPhone(digits))
    // parentga faqat 9 ta raqam (hozirgi ko'rinish)
    onChange({ target: { value: digits } })
  }

  return (
    <input
      type="tel"
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
      required={required}
      disabled={disabled}
      minLength={17}
      maxLength={17}
      title="Telefon raqamni to'liq kiriting: +998 90 123-45-67"
      autoComplete="tel"
      className={`w-full px-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-medium outline-none focus:bg-white transition-all disabled:opacity-50 ${className}`}
    />
  )
}
