import { useState, useEffect, useCallback } from 'react'

export function useFetch(apiFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const run = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiFn()
      .then(({ data: res }) => { if (!cancelled) setData(res) })
      .catch((err)          => { if (!cancelled) setError(err.response?.data?.error ?? 'Failed to load') })
      .finally(()           => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => run(), [run])

  return { data, loading, error, refetch: run }
}
