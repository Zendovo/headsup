import { useCallback, useEffect, useRef, useState } from 'react'
import { categories, shuffle } from './data'
import { GenericGyroReader, normalizeDelta, useDeviceOrientation } from './useGyro'

interface GameScreenProps {
  categoryIds: string[]
  onBack: () => void
}

type Gesture = 'correct' | 'pass' | null

const genericSensorAvailable = typeof Gyroscope !== 'undefined'

export function GameScreen({ categoryIds, onBack }: GameScreenProps) {
  const doe = useDeviceOrientation()

  const [tilt, setTilt] = useState<number | null>(null)
  const [perm, setPerm] = useState<'unknown' | 'granted' | 'denied'>(
    genericSensorAvailable || typeof DeviceOrientationEvent !== 'undefined' ? 'unknown' : 'denied'
  )

  const isGranted = perm === 'granted'

  // Generic Sensor (Android) — library handles perm automatically on mount
  const handleGenericTilt = useCallback((v: number | null) => {
    setTilt(v)
    if (v !== null) setPerm('granted')
  }, [])

  // DeviceOrientation (iOS)
  useEffect(() => {
    if (genericSensorAvailable) return
    setTilt(doe.tilt)
  }, [doe.tilt, genericSensorAvailable])

  useEffect(() => {
    if (genericSensorAvailable) return
    if (doe.perm !== 'unknown') setPerm(doe.perm)
  }, [doe.perm, genericSensorAvailable])

  const requestAndListen = doe.requestAndListen

  const selectedCategories = categories.filter((c) => categoryIds.includes(c.id))
  const allWords = shuffle(selectedCategories.flatMap((c) => c.words))

  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [pass, setPass] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [lastGesture, setLastGesture] = useState<Gesture>(null)

  const locked = useRef(false)
  const initialTilt = useRef<number | null>(null)

  const advance = useCallback((gesture: Gesture) => {
    if (gesture === 'correct') setCorrect((c) => c + 1)
    else setPass((p) => p + 1)

    setLastGesture(gesture)
    locked.current = true

    setTimeout(() => {
      setLastGesture(null)
      setIndex((i) => i + 1)
      initialTilt.current = null
      locked.current = false
    }, 400)
  }, [])

  useEffect(() => {
    if (phase !== 'playing' || tilt === null || !isGranted) return
    if (locked.current) return

    // Generic Sensor: x is angular velocity (rad/s)
    // Positive x = tilt backward (pass), negative x = tilt forward (correct)
    if (genericSensorAvailable) {
      if (tilt > 1.5) { advance('pass'); return }
      if (tilt < -1.5) { advance('correct'); return }
      return
    }

    // DeviceOrientation: beta is absolute angle (°)
    if (initialTilt.current === null) {
      initialTilt.current = tilt
      return
    }

    const delta = normalizeDelta(tilt, initialTilt.current)
    if (delta < -20) advance('correct')
    else if (delta > 20) advance('pass')
  }, [tilt, phase, isGranted, advance])

  const currentWord = allWords[index]
  const isDone = index >= allWords.length

  useEffect(() => {
    if (isDone && phase === 'playing') setPhase('done')
  }, [isDone, phase])

  const handleStart = async () => {
    if (!genericSensorAvailable && perm === 'unknown') await requestAndListen()
    setPhase('playing')
  }

  const handleCorrect = () => { if (!locked.current) advance('correct') }
  const handlePass = () => { if (!locked.current) advance('pass') }

  const tiltLabel = genericSensorAvailable
    ? `${tilt?.toFixed(2)} rad/s`
    : `${tilt?.toFixed(1)}°`

  if (phase === 'ready') {
    return (
      <div className="game-screen ready">
        {genericSensorAvailable && <GenericGyroReader onTilt={handleGenericTilt} />}
        <h2>Get Ready</h2>
        <p className="instructions">
          Hold the phone to your forehead so others can see the screen.
          <br />
          {isGranted
            ? 'Tilt forward for ✓ Correct · Tilt backward for ✗ Pass'
            : perm === 'denied'
              ? 'Gyro unavailable · Use the buttons below'
              : 'Tap start, then tilt to play'}
        </p>
        {tilt !== null && (
          <div className="debug-beta">{tiltLabel}</div>
        )}
        <div className="word-preview">
          <span className="word">{allWords[0]}</span>
        </div>
        <button className="start-btn" onClick={handleStart}>
          {!genericSensorAvailable && perm === 'unknown' ? 'Enable Gyro & Start' : 'Start Round'}
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
        <span className="debug-beta">{tiltLabel}</span>
      </div>

      <div className="word-display">
        <span className="word">{currentWord}</span>
      </div>

      {lastGesture && (
        <div className={`gesture-feedback ${lastGesture}`}>
          {lastGesture === 'correct' ? '✓' : '✗'}
        </div>
      )}

      <div className="action-bar">
        <button className="action-btn pass-btn" onClick={handlePass}>Pass</button>
        <button className="action-btn correct-btn" onClick={handleCorrect}>Correct</button>
      </div>
    </div>
  )
}
