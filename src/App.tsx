import { useState } from 'react'
import { StartScreen } from './StartScreen'
import { GameScreen } from './GameScreen'

type Screen = { kind: 'start' } | { kind: 'game'; categories: string[] }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'start' })

  switch (screen.kind) {
    case 'start':
      return (
        <StartScreen
          onStart={(ids) => setScreen({ kind: 'game', categories: ids })}
        />
      )
    case 'game':
      return (
        <GameScreen
          categoryIds={screen.categories}
          onBack={() => setScreen({ kind: 'start' })}
        />
      )
  }
}
