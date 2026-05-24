import { useCallback, useEffect, useRef, useState } from 'react'
import useGyroscope from 'react-hook-gyroscope'

export type SensorBackend = 'GenericSensor' | 'DeviceOrientation' | null

export type PermState = 'unknown' | 'granted' | 'denied'

// Generic Sensor API (Android Chrome) via react-hook-gyroscope
export function GenericGyroReader({
  onReading,
}: {
  onReading: (v: { x: number | null; y: number | null; z: number | null }) => void
}) {
  const g = useGyroscope({ frequency: 30 })
  useEffect(() => { onReading(g) }, [g.x, g.y, g.z, onReading])
  return null
}

// DeviceOrientationEvent (iOS)
const doeAvailable = typeof DeviceOrientationEvent !== 'undefined'

export function useDeviceOrientation() {
  const [beta, setBeta] = useState<number | null>(null)
  const [gamma, setGamma] = useState<number | null>(null)
  const [alpha, setAlpha] = useState<number | null>(null)
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
      if (ev.beta !== null) setBeta(ev.beta)
      if (ev.gamma !== null) setGamma(ev.gamma)
      if (ev.alpha !== null) setAlpha(ev.alpha)
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

  return { beta, gamma, alpha, perm, requestAndListen }
}
