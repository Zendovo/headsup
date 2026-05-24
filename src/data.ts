export interface Category {
  id: string
  name: string
  emoji: string
  words: string[]
}

export const categories: Category[] = [
  {
    id: 'animals',
    name: 'Animals',
    emoji: '🐾',
    words: [
      'Elephant', 'Giraffe', 'Penguin', 'Dolphin', 'Kangaroo',
      'Panda', 'Tiger', 'Octopus', 'Chimpanzee', 'Flamingo',
      'Koala', 'Cheetah', 'Hippopotamus', 'Chameleon', 'Platypus',
      'Sloth', 'Peacock', 'Walrus', 'Meerkat', 'Jellyfish',
      'Scorpion', 'Hamster', 'Raccoon', 'Parrot', 'Otter',
    ],
  },
  {
    id: 'cartoon',
    name: 'Cartoon Characters',
    emoji: '📺',
    words: [
      'SpongeBob SquarePants', 'Mickey Mouse', 'Pikachu', 'Scooby-Doo', 'Bart Simpson',
      'Bugs Bunny', 'Shrek', 'Hello Kitty', 'Winnie the Pooh', 'Tom and Jerry',
      'Elsa', 'Woody', 'Snoopy', 'Garfield', 'Patrick Star',
      'Dora the Explorer', 'Popeye', 'Donald Duck', 'Goku', 'Totoro',
    ],
  },
  {
    id: 'sports',
    name: 'Sports',
    emoji: '⚽',
    words: [
      'Football', 'Basketball', 'Tennis', 'Swimming', 'Baseball',
      'Surfing', 'Skiing', 'Boxing', 'Cricket', 'Rugby',
      'Gymnastics', 'Fencing', 'Archery', 'Volleyball', 'Snowboarding',
      'Weightlifting', 'Karate', 'Diving', 'Skateboarding', 'Marathon',
    ],
  },
]

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
