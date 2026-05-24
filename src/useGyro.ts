import { useCallback, useEffect, useRef, useState } from 'react'
import useGyroscope from 'react-hook-gyroscope'

// Wraps react-hook-gyroscope (Generic Sensor API, Android Chrome).
// Only render this when typeof Gyroscope !== 'undefined' — it throws otherwise.
export function GenericGyroReader({ onTilt }: { onTilt: (v: number | null) => void }) {
  const g = useGyroscope({ frequency: 30 })
  useEffect(() => { onTilt(g.x) }, [g.x, onTilt])
  return null
}

export type PermState = 'unknown' | 'granted' | 'denied'

export interface UseDOEReturn {
  tilt: number | null
  perm: PermState
  requestAndListen: () => Promise<void>
}

export function normalizeDelta(current: number, initial: number): number {
  let d = current - initial
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

const doeAvailable = typeof DeviceOrientationEvent !== 'undefined'

// DeviceOrientationEvent fallback (iOS)
export function useDeviceOrientation(): UseDOEReturn {
  const [tilt, setTilt] = useState<number | null>(null)
  const [perm, setPerm] = useState<PermState>(doeAvailable ? 'unknown' : 'denied')
  const listenerRef = useRef<((e: Event) => void) | null>(null)

  const removeListener = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener('deviceorientation', listenerRef.current)
      listenerRef.current = null
    }
  }, [])

  const addListener = useCallback(() => {
    removeListener()
    const handler = (e: Event) => {
      const ev = e as DeviceOrientationEvent
      if (ev.beta !== null) setTilt(ev.beta)
    }
    listenerRef.current = handler
    window.addEventListener('deviceorientation', handler)
  }, [removeListener])

  useEffect(() => () => removeListener(), [removeListener])

  const requestAndListen = useCallback(async () => {
    if (!doeAvailable) { setPerm('denied'); return }

    const D = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    if (typeof D.requestPermission === 'function') {
      try {
        const result = await D.requestPermission()
        if (result === 'granted') { setPerm('granted'); addListener() }
        else { setPerm('denied') }
      } catch { setPerm('denied') }
    } else {
      setPerm('granted'); addListener()
    }
  }, [addListener])

  return { tilt, perm, requestAndListen }
}
