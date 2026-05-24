import { useCallback, useEffect, useRef, useState } from 'react'
import { categories, shuffle } from './data'
import { useDeviceOrientation } from './useGyro'

interface GameScreenProps {
  categoryIds: string[]
  onBack: () => void
}

export function GameScreen({ categoryIds, onBack }: GameScreenProps) {
  const { alpha, gamma, perm, request } = useDeviceOrientation()

  const [phase, setPhase] = useState<'start' | 'playing' | 'done'>('start')
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [pass, setPass] = useState(0)
  const [lastGesture, setLastGesture] = useState<'correct' | 'pass' | null>(null)
  const [landscape, setLandscape] = useState(false)
  const [gyroResp, setGyroResp] = useState<string>('—')

  const locked = useRef(false)
  const prevGamma = useRef<number | null>(null)
  const gammaDir = useRef<string | null>(null)

  const selectedCategories = categories.filter((c) => categoryIds.includes(c.id))
  const allWords = shuffle(selectedCategories.flatMap((c) => c.words))
  const currentWord = allWords[index]
  const isDone = index >= allWords.length

  useEffect(() => {
    if (isDone && phase === 'playing') setPhase('done')
  }, [isDone, phase])

  useEffect(() => {
    const check = () => setLandscape(window.screen.width > window.screen.height)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
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
      prevGamma.current = null
      gammaDir.current = null
    }, 500)
  }, [])

  // Gesture detection via gamma
  useEffect(() => {
    if (phase !== 'playing' || gamma === null || alpha === null) return
    if (locked.current) return

    const prev = prevGamma.current
    prevGamma.current = gamma

    if (prev === null) return

    // At rest gamma ≈ ±90 in landscape on forehead.
    // Tilt forward → gamma goes from ±90 toward 0.
    // Tilt backward → gamma goes from ±90 toward 0 (from the other side).
    // alpha 0-180: gamma +90→0 = pass, gamma -90→0 = correct
    // alpha 180-360: gamma -90→0 = pass, gamma +90→0 = correct

    const abs = Math.abs(gamma)
    const prevAbs = Math.abs(prev)
    const direction = prevAbs > abs ? 'shrinking' : prevAbs < abs ? 'growing' : 'same'

    // Wait for |gamma| to start near ±90 (rest position)
    if (gammaDir.current === null) {
      if (abs > 60) gammaDir.current = 'rest'
      return
    }

    // Detect |gamma| shrinking from ±90 toward 0 past threshold
    if (direction === 'shrinking' && abs < 40 && abs > 5) {
      const alphaRange = alpha < 180 ? 0 : 1
      const gammaPos = gamma > 0
      let gesture: 'pass' | 'correct'

      if (alphaRange === 0) {
        gesture = gammaPos ? 'pass' : 'correct'
      } else {
        gesture = gammaPos ? 'correct' : 'pass'
      }

      setGyroResp(gesture)
      advance(gesture)
    }
  }, [gamma, alpha, phase, advance])

  if (phase === 'start') {
    return (
      <div className="game-screen start">
        <h2>Heads Up!</h2>
        <p className="instructions">
          <strong>Rotate your phone to landscape</strong> and hold it to your forehead.
        </p>

        <SensorInfo alpha={alpha} gamma={gamma} perm={perm} landscape={landscape} />

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

  return (
    <div className="game-screen playing">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>✕</button>
        <span className="score">{correct}/{correct + pass}</span>
        <span className="sensor-entry" style={{ fontSize: '0.7rem' }}>γ: {gamma?.toFixed(1)}°</span>
      </div>

      <div className="word-display">
        <span className="word">{currentWord}</span>
      </div>

      <SensorInfo alpha={alpha} gamma={gamma} perm={perm} landscape={landscape} />

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
  alpha, gamma, perm, landscape,
}: {
  alpha: number | null; gamma: number | null; perm: string; landscape: boolean
}) {
  return (
    <div className="sensor-panel">
      <div className="sensor-backend">
        DeviceOrientation {perm === 'denied' ? '(denied)' : ''}
        {!landscape && <span className="warn"> — rotate to landscape</span>}
      </div>
      <div className="sensor-values">
        {alpha !== null && <span>α: {alpha.toFixed(1)}°</span>}
        {gamma !== null && <span>γ: {gamma.toFixed(1)}°</span>}
      </div>
    </div>
  )
}
