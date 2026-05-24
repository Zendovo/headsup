import { useEffect, useRef, useState } from 'react'
import { useDeviceOrientation, getOrientationAngle, getLogicalTilt } from './useGyro'
import { useGame } from './useGame'

interface GameScreenProps {
  categoryIds: string[]
  onBack: () => void
}

export function GameScreen({ categoryIds, onBack }: GameScreenProps) {
  const { alpha, gamma, perm, request } = useDeviceOrientation()
  const { phase, current, correct, pass, feedback, record, start } = useGame(categoryIds)

  const [landscape, setLandscape] = useState(false)
  const [orientationAngle, setOrientationAngle] = useState(getOrientationAngle)

  const triggered = useRef(false)

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

  // Tilt gesture detection
  useEffect(() => {
    if (phase !== 'playing' || gamma == null) return

    const lt = getLogicalTilt(gamma, orientationAngle)
    if (lt == null) return

    // Rearm once back in neutral zone
    if (Math.abs(lt) < 15) {
      triggered.current = false
      return
    }

    if (triggered.current) return

    if (lt > 40) { triggered.current = true; record('correct') }
    else if (lt < -40) { triggered.current = true; record('pass') }
  }, [gamma, orientationAngle, phase, record])

  if (phase === 'start') {
    return (
      <div className="game-screen start">
        <h2>Heads Up!</h2>
        <p className="instructions">
          Rotate your phone to landscape and hold it to your forehead.
        </p>
        <SensorInfo alpha={alpha} gamma={gamma} angle={orientationAngle} landscape={landscape} perm={perm} />
        <button className="start-btn" onClick={async () => {
          if (perm === 'unknown') await request()
          start()
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
        <p>{correct} correct out of {total}</p>
        <p className="pass-count">Passed: {pass}</p>
        <button className="start-btn" onClick={onBack}>Play Again</button>
      </div>
    )
  }

  const lt = gamma != null ? getLogicalTilt(gamma, orientationAngle) : null

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
        <span className="word" key={current}>{current}</span>
      </div>

      <SensorInfo alpha={alpha} gamma={gamma} angle={orientationAngle} landscape={landscape} perm={perm} />

      {feedback && (
        <div className={`gesture-feedback ${feedback}`}>
          {feedback === 'correct' ? '✓' : '✗'}
        </div>
      )}

      <div className="action-bar">
        <button className="action-btn pass-btn" onClick={() => record('pass')}>Pass</button>
        <button className="action-btn correct-btn" onClick={() => record('correct')}>Correct</button>
      </div>
    </div>
  )
}

function SensorInfo({
  alpha, gamma, perm, landscape, angle,
}: {
  alpha: number | null; gamma: number | null; perm: string; landscape: boolean; angle: number
}) {
  const lt = gamma != null ? getLogicalTilt(gamma, angle) : null
  return (
    <div className="sensor-panel">
      <div className="sensor-backend">
        DeviceOrientation{perm === 'denied' ? ' (denied)' : ''}
        {!landscape && <span className="warn"> — rotate to landscape</span>}
      </div>
      <div className="sensor-values">
        <span>α: {alpha?.toFixed(1) ?? '—'}°</span>
        <span>γ: {gamma?.toFixed(1) ?? '—'}°</span>
        <span>∠: {angle}°</span>
        <span>tilt: {lt?.toFixed(1) ?? '—'}</span>
      </div>
    </div>
  )
}
