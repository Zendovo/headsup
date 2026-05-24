import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { categories, shuffle } from './data'

export type Gesture = 'correct' | 'pass'
export type Phase = 'start' | 'countdown' | 'playing' | 'done'

const GAME_DURATION = 60

let audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(freq: number, duration: number) {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.value = 0.2
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Audio not available
  }
}

export function playFeedback(gesture: Gesture) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (gesture === 'correct') navigator.vibrate([60, 40, 60])
    else navigator.vibrate(180)
  } else {
    if (gesture === 'correct') playTone(880, 0.15)
    else playTone(350, 0.25)
  }
}

export function playCountdownBeep() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(30)
  } else {
    playTone(660, 0.1)
  }
}

export function useGame(categoryIds: string[]) {
  const words = useMemo(
    () => shuffle(categories.filter((c) => categoryIds.includes(c.id)).flatMap((c) => c.words)),
    [categoryIds],
  )

  const [phase, setPhase] = useState<Phase>('start')
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [pass, setPass] = useState(0)
  const [feedback, setFeedback] = useState<Gesture | null>(null)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [countdown, setCountdown] = useState(3)
  const locked = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = words[index]
  const isDone = index >= words.length

  // Game timer
  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      return
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setPhase('done'); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [phase])

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown < 0) { setPhase('playing'); return }
    const t = setTimeout(() => {
      if (countdown > 0) playCountdownBeep()
      setCountdown((c) => c - 1)
    }, 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  useEffect(() => {
    if (isDone && phase === 'playing') setPhase('done')
  }, [isDone, phase])

  const start = useCallback(() => {
    setTimeLeft(GAME_DURATION)
    setCountdown(3)
    setPhase('countdown')
  }, [])

  const record = useCallback((gesture: Gesture) => {
    if (locked.current) return
    locked.current = true

    playFeedback(gesture)

    if (gesture === 'correct') setCorrect((c) => c + 1)
    else setPass((p) => p + 1)

    setFeedback(gesture)

    if (index + 1 >= words.length) {
      setPhase('done')
    } else {
      setIndex((i) => i + 1)
    }

    setTimeout(() => {
      setFeedback(null)
      locked.current = false
    }, 400)
  }, [index, words.length])

  return { phase, current, correct, pass, feedback, timeLeft, countdown, record, start }
}
