import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Telegram-uslubida infinite scroll hook.
 * @param {Array}  data       - to'liq filtered array
 * @param {number} batchSize  - bir marta ko'rsatiladigan qator soni (default 40)
 */
export function useInfiniteScroll(data, batchSize = 20) {
  const [limit, setLimit] = useState(batchSize)
  const sentinelRef       = useRef(null)

  // Data yoki batchSize o'zgarganda limitni reset qil
  useEffect(() => {
    setLimit(batchSize)
  }, [data, batchSize])

  const loadMore = useCallback(() => {
    setLimit(prev => {
      if (prev >= data.length) return prev
      return prev + batchSize
    })
  }, [data.length, batchSize])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '120px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  return {
    visible:     data.slice(0, limit),
    sentinelRef,
    hasMore:     limit < data.length,
    shown:       Math.min(limit, data.length),
    total:       data.length,
  }
}
