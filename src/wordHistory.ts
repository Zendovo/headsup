import { shuffle } from './data'

export type WordHistory = Record<string, number>

const STORAGE_KEY = 'headsup:word-history:v1'

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function loadWordHistory(): WordHistory {
  try {
    if (typeof localStorage === 'undefined') return {}
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    const history: WordHistory = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value)) history[key] = value
    }
    return history
  } catch {
    return {}
  }
}

export function saveWordHistory(history: WordHistory): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // Storage can be unavailable (private mode, quota). The game still works.
  }
}

export function markWordSeen(history: WordHistory, word: string, now = Date.now()): void {
  history[normalizeWord(word)] = now
  saveWordHistory(history)
}

/**
 * Builds the word order for a round.
 *
 * 1. Duplicate words (including the same word in two selected categories) are
 *    removed, so a round never shows the same answer twice.
 * 2. Words that have never been seen are shuffled and placed first, which means
 *    every word gets its turn before anything repeats.
 * 3. Words that have been seen are grouped by the round they appeared in. Older
 *    rounds come first and each round is reshuffled, so a round only reuses
 *    words after every other available word has had a turn.
 */
export function orderWordsForRound(words: string[], history: WordHistory): string[] {
  const unique: string[] = []
  const seenKeys = new Set<string>()

  for (const raw of words) {
    const word = raw.trim()
    if (!word) continue

    const key = normalizeWord(word)
    if (seenKeys.has(key)) continue

    seenKeys.add(key)
    unique.push(word)
  }

  const fresh: string[] = []
  const byRound = new Map<number, string[]>()

  for (const word of unique) {
    const lastSeen = history[normalizeWord(word)]
    if (lastSeen === undefined) {
      fresh.push(word)
      continue
    }

    const round = byRound.get(lastSeen)
    if (round) round.push(word)
    else byRound.set(lastSeen, [word])
  }

  const used = [...byRound.entries()]
    .sort(([a], [b]) => a - b)
    .flatMap(([, roundWords]) => shuffle(roundWords))

  return [...shuffle(fresh), ...used]
}
