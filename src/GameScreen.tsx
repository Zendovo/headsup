import { useCallback, useEffect, useRef, useState } from 'react'
import { categories, shuffle } from './data'
import { GenericGyroReader, useDeviceOrientation } from './useGyro'
import type { SensorBackend } from './useGyro'

interface GameScreenProps {
  categoryIds: string[]
  onBack: () => void
}

type Gesture = 'correct' | 'pass' | null

const genericSensorAvailable = typeof Gyroscope !== 'undefined'

export function GameScreen({ categoryIds, onBack }: GameScreenProps) {
  const doe = useDeviceOrientation()

  const [sensorBackend, setSensorBackend] = useState<SensorBackend>(null)
  const [sensorValues, setSensorValues] = useState<Record<string, string>>({})
  const [perm, setPerm] = useState<'unknown' | 'granted' | 'denied'>(() =>
    genericSensorAvailable || typeof DeviceOrientationEvent !== 'undefined' ? 'unknown' : 'denied',
  )

  // Generic Sensor (Android Chrome) via react-hook-gyroscope
  const handleGenericReading = useCallback(
    (v: { x: number | null; y: number | null; z: number | null }) => {
      setSensorBackend('GenericSensor')
      setSensorValues({
        x: v.x?.toFixed(4) ?? '—',
        y: v.y?.toFixed(4) ?? '—',
        z: v.z?.toFixed(4) ?? '—',
      })
      if (v.x !== null) setPerm('granted')
    },
    [],
  )

  // DeviceOrientation (iOS)
  useEffect(() => {
    if (genericSensorAvailable) return
    if (doe.beta !== null) {
      setSensorBackend('DeviceOrientation')
      setSensorValues({
        beta: `${doe.beta.toFixed(1)}°`,
        gamma: doe.gamma?.toFixed(1) != null ? `${doe.gamma.toFixed(1)}°` : '—',
        alpha: doe.alpha?.toFixed(1) != null ? `${doe.alpha.toFixed(1)}°` : '—',
      })
    }
  }, [doe.beta, doe.gamma, doe.alpha, genericSensorAvailable])

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

  const advance = useCallback((gesture: Gesture) => {
    if (gesture === 'correct') setCorrect((c) => c + 1)
    else setPass((p) => p + 1)

    setLastGesture(gesture)
    locked.current = true

    setTimeout(() => {
      setLastGesture(null)
      setIndex((i) => i + 1)
      locked.current = false
    }, 400)
  }, [])

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

  if (phase === 'ready') {
    return (
      <div className="game-screen ready">
        {genericSensorAvailable && <GenericGyroReader onReading={handleGenericReading} />}
        <h2>Get Ready</h2>
        <p className="instructions">
          Hold the phone to your forehead so others can see the screen.
          <br />
          Use the buttons to score.
        </p>
        <SensorPanel backend={sensorBackend} values={sensorValues} perm={perm} />
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
      </div>

      <div className="word-display">
        <span className="word">{currentWord}</span>
      </div>

      <SensorPanel backend={sensorBackend} values={sensorValues} perm={perm} />

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

function SensorPanel({
  backend,
  values,
  perm,
}: {
  backend: SensorBackend
  values: Record<string, string>
  perm: string
}) {
  return (
    <div className="sensor-panel">
      <div className="sensor-backend">
        Backend: <strong>{backend ?? '—'}</strong> {perm === 'denied' && '(denied)'}
      </div>
      <div className="sensor-values">
        {Object.entries(values).map(([k, v]) => (
          <span key={k} className="sensor-entry">
            {k}: {v}
          </span>
        ))}
      </div>
    </div>
  )
}
