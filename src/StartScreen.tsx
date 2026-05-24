import { categories } from './data'

interface StartScreenProps {
  onStart: (selectedIds: string[]) => void
}

export function StartScreen({ onStart }: StartScreenProps) {
  const handleSelect = (id: string) => {
    onStart([id])
  }

  return (
    <div className="start-screen">
      <h1>Heads Up!</h1>
      <p className="subtitle">Choose a category to play</p>
      <div className="categories">
        {categories.map((cat) => (
          <button key={cat.id} className="category-btn" onClick={() => handleSelect(cat.id)}>
            <span className="cat-emoji">{cat.emoji}</span>
            <span className="cat-name">{cat.name}</span>
          </button>
        ))}
      </div>
      <button className="all-btn" onClick={() => onStart(categories.map((c) => c.id))}>
        All Categories
      </button>
    </div>
  )
}
