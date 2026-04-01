import { useState, useEffect, useRef } from 'react'

/**
 * Animates a number from 0 to `target` over `duration` ms.
 * Returns the current display value.
 */
export function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const prevTarget = useRef(null)

  useEffect(() => {
    if (target == null || isNaN(Number(target))) {
      setValue(target)
      return
    }

    const numTarget = Number(target)
    // Reset on new target
    if (prevTarget.current !== numTarget) {
      prevTarget.current = numTarget
      startRef.current = null
      setValue(0)
    }

    function tick(ts) {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out quart
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(Math.round(eased * numTarget))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}
