export type Coordinate = [number, number, number]

export type Tile = {
  id: string
  letter: string
  coords: Coordinate[]
  parentCoords?: Coordinate[]
  selected: boolean
  visible: boolean
  selectable: boolean
  layer: number
  position: { x: number; y: number }
  completelyCovered: boolean
}

export type Layer = {
  size: number
  offset: number
  tiles: Tile[]
}

export type GameState = {
  currentWord: string
  selectedTiles: Tile[]
  usedWords: Array<{ word: string; score: number }>
  totalScore: number
  wordList: Set<string>
  layers: Layer[]
  feedback: string
  feedbackColor: string
  swapsRemaining: number
  swapMode: boolean
  gameOver: boolean
  finalScore: number
  penaltyScore: number
  showEndGameConfirmation: boolean
  isDailyPuzzle: boolean
  gameMode: 'main' | 'mini' | 'pyramid'
}

export type TileState = 'available' | 'selected' | 'unavailable' | 'temp-selectable' | 'hidden'
