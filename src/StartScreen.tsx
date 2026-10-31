import { useState } from 'react'
import { categories, type Category } from './data'

interface StartScreenProps {
  onStart: (selectedIds: string[], customWords: string[]) => void
}

const categoryGroups = categories.reduce<Array<{ name: string; categories: Category[] }>>(
  (groups, category) => {
    const group = groups.find((g) => g.name === category.group)
    if (group) group.categories.push(category)
    else groups.push({ name: category.group, categories: [category] })
    return groups
  },
  [],
)

export function StartScreen({ onStart }: StartScreenProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [customWords, setCustomWords] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const search = query.trim().toLowerCase()
  const visibleGroups = categoryGroups
    .map((group) => ({
      ...group,
      categories: group.categories.filter((cat) => cat.name.toLowerCase().includes(search)),
    }))
    .filter((group) => group.categories.length > 0)

  const visibleCategories = visibleGroups.flatMap((group) => group.categories)
  const allSelected =
    visibleCategories.length > 0 && visibleCategories.every((cat) => selected.has(cat.id))

  const toggleAll = () => {
    const next = new Set(selected)
    for (const cat of visibleCategories) {
      if (allSelected) next.delete(cat.id)
      else next.add(cat.id)
    }
    setSelected(next)
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
      <p className="subtitle">
        Select categories{selected.size > 0 ? ` · ${selected.size} selected` : ''}
      </p>

      <input
        className="category-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search categories…"
        aria-label="Search categories"
      />

      <div className="category-groups">
        {visibleGroups.map((group) => (
          <section key={group.name} className="category-group">
            <h2 className="category-group-title">{group.name}</h2>
            <div className="categories">
              {group.categories.map((cat) => (
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
          </section>
        ))}
        {visibleGroups.length === 0 && <p className="no-results">No categories found.</p>}
      </div>

      <button className="link-btn" onClick={toggleAll}>
        {allSelected ? 'Deselect All' : search ? 'Select All Results' : 'Select All'}
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
