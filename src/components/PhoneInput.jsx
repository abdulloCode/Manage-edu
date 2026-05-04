import { useState, useEffect } from 'react'

function formatPhone(digits) {
  const d = digits.slice(0, 9)
  let out = ''
  if (d.length > 0) out += '(' + d.slice(0, 2)
  if (d.length > 2) out += ') ' + d.slice(2, 5)
  if (d.length > 5) out += '-' + d.slice(5, 7)
  if (d.length > 7) out += '-' + d.slice(7, 9)
  return out
}

export default function PhoneInput({ value, onChange, className = '', placeholder = '(90) 123-45-67', required = false, disabled = false }) {
  const digits = value?.replace(/\D/g, '') || ''
  const [displayValue, setDisplayValue] = useState(formatPhone(digits))

  useEffect(() => {
    const d = value?.replace(/\D/g, '') || ''
    setDisplayValue(formatPhone(d))
  }, [value])

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '')
    const formatted = formatPhone(digits)
    setDisplayValue(formatted)
    onChange({ target: { value: '+998' + digits } })
  }

  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium select-none">
        +998
      </span>
      <input
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        className={`w-full pl-14 pr-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-medium outline-none focus:bg-white transition-all disabled:opacity-50 ${className}`}
        value={displayValue}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        autoComplete="tel"
      />
    </div>
  )
}