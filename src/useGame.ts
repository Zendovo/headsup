import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { categories, shuffle } from './data'

export type Gesture = 'correct' | 'pass'
export type Phase = 'start' | 'playing' | 'done'

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
  const locked = useRef(false)

  const current = words[index]
  const isDone = index >= words.length

  useEffect(() => {
    if (isDone && phase === 'playing') setPhase('done')
  }, [isDone, phase])

  const start = useCallback(() => {
    setPhase('playing')
  }, [])

  const record = useCallback((gesture: Gesture) => {
    if (locked.current) return
    locked.current = true

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

  return { phase, current, correct, pass, feedback, record, start }
}
