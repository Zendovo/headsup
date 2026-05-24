declare module 'react-hook-gyroscope' {
  import type { DependencyList } from 'react'
  interface GyroscopeData {
    x: number | null
    y: number | null
    z: number | null
  }
  export default function useGyroscope(
    options?: { frequency?: number },
    callback?: (data: GyroscopeData) => void,
  ): GyroscopeData
}

interface Gyroscope {
  new (options?: { frequency?: number }): Gyroscope
  start(): void
  stop(): void
  x: number | null
  y: number | null
  z: number | null
  onreading: (() => void) | null
  onerror: ((event: { error: Error }) => void) | null
}

declare var Gyroscope: Gyroscope | undefined
