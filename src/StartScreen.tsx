import { useState } from 'react'
import { categories } from './data'

interface StartScreenProps {
  onStart: (selectedIds: string[], customWords: string[]) => void
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [customWords, setCustomWords] = useState<string[]>([])
  const [input, setInput] = useState('')

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const allSelected = categories.every((c) => selected.has(c.id))

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(categories.map((c) => c.id)))
  }

  const addWord = () => {
    const w = input.trim()
    if (w && !customWords.includes(w)) setCustomWords([...customWords, w])
    setInput('')
  }

  const removeWord = (w: string) => setCustomWords(customWords.filter((x) => x !== w))

  const canStart = selected.size > 0 || customWords.length > 0

  return (
    <div className="start-screen">
      <h1>Heads Up!</h1>
      <p className="subtitle">Select categories</p>
      <div className="categories">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn${selected.has(cat.id) ? ' selected' : ''}`}
            onClick={() => toggle(cat.id)}
          >
            <span className="cat-check">{selected.has(cat.id) ? '✓' : ''}</span>
            <span className="cat-emoji">{cat.emoji}</span>
            <span className="cat-name">{cat.name}</span>
          </button>
        ))}
      </div>

      <button className="link-btn" onClick={toggleAll}>
        {allSelected ? 'Deselect All' : 'Select All'}
      </button>

      <div className="custom-section">
        <p className="subtitle">Custom words</p>
        <div className="custom-input-row">
          <input
            className="custom-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addWord()}
            placeholder="Add a word…"
          />
          <button className="add-btn" onClick={addWord}>Add</button>
        </div>
        {customWords.length > 0 && (
          <div className="custom-tags">
            {customWords.map((w) => (
              <span key={w} className="custom-tag">
                {w}
                <button className="tag-remove" onClick={() => removeWord(w)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="install-note">
        <strong>Install</strong> · iOS: Share → Add to Home Screen · Android: ⋮ → Install app
      </div>

      <button
        className={`start-btn${!canStart ? ' disabled' : ''}`}
        disabled={!canStart}
        onClick={() => onStart([...selected], customWords)}
      >
        Start Game
      </button>
    </div>
  )
}
