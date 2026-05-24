import { useCallback, useEffect, useRef, useState } from 'react'

export type PermState = 'unknown' | 'granted' | 'denied'

export interface DOEData {
  alpha: number | null
  beta: number | null
  gamma: number | null
}

const available = typeof DeviceOrientationEvent !== 'undefined'

export function getOrientationAngle(): number {
  return screen.orientation?.angle ?? 0
}

export function getLogicalTilt(gamma: number, angle: number): number | null {
  if (angle === 90) return gamma
  if (angle === -90 || angle === 270) return -gamma
  return null
}

export function useDeviceOrientation() {
  const [data, setData] = useState<DOEData>({ alpha: null, beta: null, gamma: null })
  const [perm, setPerm] = useState<PermState>(available ? 'unknown' : 'denied')
  const ref = useRef<((e: Event) => void) | null>(null)

  const remove = useCallback(() => {
    if (ref.current) { window.removeEventListener('deviceorientation', ref.current); ref.current = null }
  }, [])

  const add = useCallback(() => {
    remove()
    const h = (e: Event) => {
      const ev = e as DeviceOrientationEvent
      setData({ alpha: ev.alpha, beta: ev.beta, gamma: ev.gamma })
    }
    ref.current = h
    window.addEventListener('deviceorientation', h)
  }, [remove])

  useEffect(() => () => remove(), [remove])

  const request = useCallback(async () => {
    if (!available) { setPerm('denied'); return }
    const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> }
    if (typeof D.requestPermission === 'function') {
      try {
        const r = await D.requestPermission()
        if (r === 'granted') { setPerm('granted'); add() }
        else { setPerm('denied') }
      } catch { setPerm('denied') }
    } else {
      setPerm('granted'); add()
    }
  }, [add])

  return { ...data, perm, request }
}
