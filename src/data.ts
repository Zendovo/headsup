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
  {
    id: 'games',
    name: 'Games',
    emoji: '🎮',
    words: [
      'Minecraft', 'Fortnite', 'Tetris', 'Super Mario', 'The Legend of Zelda',
      'Among Us', 'Grand Theft Auto', 'Pac-Man', 'Sonic the Hedgehog', 'Call of Duty',
      'Pokémon', 'Animal Crossing', 'Street Fighter', 'Portal', 'Skyrim',
      'Mario Kart', 'Undertale', 'Roblox', 'God of War', 'Halo',
    ],
  },
  {
    id: 'artists',
    name: 'Artists',
    emoji: '🎨',
    words: [
      'Taylor Swift', 'Beyoncé', 'Ed Sheeran', 'Drake', 'Adele',
      'Kanye West', 'Billie Eilish', 'Bruno Mars', 'Rihanna', 'The Weeknd',
      'Ariana Grande', 'Eminem', 'Lady Gaga', 'Harry Styles', 'Dua Lipa',
      'Post Malone', 'SZA', 'Bad Bunny', 'Olivia Rodrigo', 'Kendrick Lamar',
    ],
  },
  {
    id: 'actors',
    name: 'Actors',
    emoji: '🎬',
    words: [
      'Tom Cruise', 'Scarlett Johansson', 'Dwayne Johnson', 'Leonardo DiCaprio', 'Jennifer Lawrence',
      'Robert Downey Jr.', 'Margot Robbie', 'Denzel Washington', 'Zendaya', 'Chris Hemsworth',
      'Emma Stone', 'Morgan Freeman', 'Cillian Murphy', 'Tom Hanks', 'Zoe Saldaña',
      'Jake Gyllenhaal', 'Viola Davis', 'Ryan Gosling', 'Florence Pugh', 'Pedro Pascal',
    ],
  },
  {
    id: 'programming',
    name: 'Programming',
    emoji: '💻',
    words: [
      'React', 'Python', 'JavaScript', 'TypeScript', 'GitHub',
      'SQL', 'Docker', 'Kubernetes', 'HTML', 'CSS',
      'Node.js', 'Rust', 'Go', 'Linux', 'API',
      'Machine Learning', 'Cloud Computing', 'Blockchain', 'Algorithm', 'Debugging',
    ],
  },
  {
    id: 'science',
    name: 'Science',
    emoji: '🔬',
    words: [
      'Gravity', 'Evolution', 'Black Hole', 'DNA', 'Photosynthesis',
      'Periodic Table', 'Climate Change', 'Relativity', 'CRISPR', 'Volcano',
      'Quantum Mechanics', 'Fossil', 'Solar System', 'Mitosis', 'Glacier',
      'Radiation', 'Ecosystem', 'Neutron Star', 'Antibiotic', 'Particle Accelerator',
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
