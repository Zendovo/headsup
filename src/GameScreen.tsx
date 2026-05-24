import { useCallback, useEffect, useRef, useState } from 'react'
import { categories, shuffle } from './data'
import { useDeviceOrientation } from './useGyro'

interface GameScreenProps {
  categoryIds: string[]
  onBack: () => void
}

function getOrientationAngle(): number {
  const s = screen.orientation
  if (!s) return 0
  return s.angle ?? 0
}

// logicalTilt: positive = phone tilted downward (correct)
//              negative = phone tilted upward (pass)
function computeLogicalTilt(
  beta: number,
  gamma: number,
  angle: number,
): number {
  switch (angle) {
    case 0:   return -beta
    case 180: return beta
    case 90:  return -gamma
    case -90:
    case 270: return gamma
    default:  return -gamma
  }
}

export function GameScreen({ categoryIds, onBack }: GameScreenProps) {
  const { alpha, beta, gamma, perm, request } = useDeviceOrientation()

  const [phase, setPhase] = useState<'start' | 'playing' | 'done'>('start')
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [pass, setPass] = useState(0)
  const [lastGesture, setLastGesture] = useState<'correct' | 'pass' | null>(null)
  const [landscape, setLandscape] = useState(false)
  const [gyroResp, setGyroResp] = useState<string>('—')
  const [orientationAngle, setOrientationAngle] = useState(getOrientationAngle)

  const locked = useRef(false)
  const triggered = useRef(false)
  const restTilt = useRef<number | null>(null)
  const hasRest = useRef(false)
  const prevLT = useRef<number | null>(null)

  const selectedCategories = categories.filter((c) => categoryIds.includes(c.id))
  const allWords = shuffle(selectedCategories.flatMap((c) => c.words))
  const currentWord = allWords[index]
  const isDone = index >= allWords.length

  useEffect(() => {
    if (isDone && phase === 'playing') setPhase('done')
  }, [isDone, phase])

  useEffect(() => {
    const check = () => {
      setLandscape(window.screen.width > window.screen.height)
      setOrientationAngle(getOrientationAngle())
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  const advance = useCallback((gesture: 'correct' | 'pass') => {
    if (locked.current) return
    locked.current = true
    if (gesture === 'correct') setCorrect((c) => c + 1)
    else setPass((p) => p + 1)
    setLastGesture(gesture)
    setTimeout(() => {
      setLastGesture(null)
      setIndex((i) => i + 1)
      locked.current = false
      hasRest.current = false
      restTilt.current = null
      triggered.current = false
      prevLT.current = null
    }, 500)
  }, [])

  // Gesture detection via logicalTilt
  useEffect(() => {
    if (phase !== 'playing' || beta === null || gamma === null) return
    if (locked.current || triggered.current) return

    const lt = computeLogicalTilt(beta, gamma, orientationAngle)
    const prev = prevLT.current
    prevLT.current = lt

    // Wait for rest (|logicalTilt| near its expected rest value, ~90)
    const absLT = Math.abs(lt)
    if (!hasRest.current) {
      if (absLT > 50) {
        hasRest.current = true
        restTilt.current = lt
      }
      return
    }
    if (prev === null) return

    const deviation = lt - restTilt.current!

    // Trigger when deviation crosses threshold in either direction
    if (deviation > 25) {
      triggered.current = true
      setGyroResp('correct')
      advance('correct')
    } else if (deviation < -25) {
      triggered.current = true
      setGyroResp('pass')
      advance('pass')
    }
  }, [beta, gamma, orientationAngle, phase, advance])

  if (phase === 'start') {
    return (
      <div className="game-screen start">
        <h2>Heads Up!</h2>
        <p className="instructions">
          <strong>Rotate your phone to landscape</strong> and hold it to your forehead.
        </p>

        <SensorInfo
          alpha={alpha}
          gamma={gamma}
          beta={beta}
          perm={perm}
          landscape={landscape}
          angle={orientationAngle}
        />

        <button className="start-btn" onClick={async () => {
          if (perm === 'unknown') await request()
          setPhase('playing')
        }}>
          {perm === 'unknown' ? 'Enable Gyro & Start' : 'Start'}
        </button>
      </div>
    )
  }

  if (phase === 'done') {
    const total = correct + pass
    return (
      <div className="game-screen done">
        <h2>Game Over!</h2>
        <div className="score-big">{correct} / {total}</div>
        <p>correct out of {total} words</p>
        <p className="pass-count">Passed: {pass}</p>
        <button className="start-btn" onClick={onBack}>Play Again</button>
      </div>
    )
  }

  const lt = (beta !== null && gamma !== null)
    ? computeLogicalTilt(beta, gamma, orientationAngle)
    : null

  return (
    <div className="game-screen playing">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>✕</button>
        <span className="score">{correct}/{correct + pass}</span>
        <span className="sensor-entry" style={{ fontSize: '0.7rem' }}>
          tilt: {lt?.toFixed(1) ?? '—'}
        </span>
      </div>

      <div className="word-display">
        <span className="word">{currentWord}</span>
      </div>

      <SensorInfo
        alpha={alpha}
        gamma={gamma}
        beta={beta}
        perm={perm}
        landscape={landscape}
        angle={orientationAngle}
      />

      {lastGesture && (
        <div className={`gesture-feedback ${lastGesture}`}>
          {lastGesture === 'correct' ? '✓' : '✗'}
        </div>
      )}

      {gyroResp !== '—' && <div className="gyro-hint">gyro: {gyroResp}</div>}

      <div className="action-bar">
        <button className="action-btn pass-btn" onClick={() => advance('pass')}>Pass</button>
        <button className="action-btn correct-btn" onClick={() => advance('correct')}>Correct</button>
      </div>
    </div>
  )
}

function SensorInfo({
  alpha, beta, gamma, perm, landscape, angle,
}: {
  alpha: number | null
  beta: number | null
  gamma: number | null
  perm: string
  landscape: boolean
  angle: number
}) {
  const lt = beta !== null && gamma !== null ? computeLogicalTilt(beta, gamma, angle) : null
  return (
    <div className="sensor-panel">
      <div className="sensor-backend">
        DeviceOrientation {perm === 'denied' ? '(denied)' : ''}
        {!landscape && <span className="warn"> — rotate to landscape</span>}
      </div>
      <div className="sensor-values">
        <span>α: {alpha?.toFixed(1) ?? '—'}°</span>
        <span>β: {beta?.toFixed(1) ?? '—'}°</span>
        <span>γ: {gamma?.toFixed(1) ?? '—'}°</span>
        <span>∠: {angle}°</span>
        <span>tilt: {lt?.toFixed(1) ?? '—'}</span>
      </div>
    </div>
  )
}
