import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { categories, shuffle } from './data'

export type Gesture = 'correct' | 'pass'
export type Phase = 'start' | 'playing' | 'done'

const GAME_DURATION = 60

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
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
  const locked = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = words[index]
  const isDone = index >= words.length

  // Timer
  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      return
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [phase])

  useEffect(() => {
    if (isDone && phase === 'playing') setPhase('done')
  }, [isDone, phase])

  const start = useCallback(() => {
    setTimeLeft(GAME_DURATION)
    setPhase('playing')
  }, [])

  const record = useCallback((gesture: Gesture) => {
    if (locked.current) return
    locked.current = true

    vibrate(gesture === 'correct' ? [30] : [15, 30, 15])

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

  return { phase, current, correct, pass, feedback, timeLeft, record, start }
}
