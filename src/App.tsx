import { useState } from 'react'
import { StartScreen } from './StartScreen'
import { GameScreen } from './GameScreen'

type Screen = { kind: 'start' } | { kind: 'game'; categories: string[]; custom: string[] }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'start' })

  switch (screen.kind) {
    case 'start':
      return (
        <StartScreen
          onStart={(ids, custom) => setScreen({ kind: 'game', categories: ids, custom })}
        />
      )
    case 'game':
      return (
        <GameScreen
          categoryIds={screen.categories}
          customWords={screen.custom}
          onBack={() => setScreen({ kind: 'start' })}
        />
      )
  }
}
