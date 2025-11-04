// Daily puzzle generation and management

import type { Tile, Layer, Coordinate } from '../types/game'

export interface DailyPuzzleData {
  date: string;           // YYYY-MM-DD format
  seed: number;          // Generated from date
  isCompleted: boolean;  // Completion status
  firstScore: number;    // Score from first attempt
  bestScore: number;     // Player's best score
  attempts: number;      // Number of attempts
  longestWordLength: number; // Length of longest word submitted
  longestWord: string;   // Actual longest word submitted
  allWordsFound: string[]; // All unique words found across all attempts
}

// Generate a consistent seed based on date
export function generateDailySeed(date: string): number {
  let hash = 0
  for (let i = 0; i < date.length; i++) {
    const char = date.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Get today's date in YYYY-MM-DD format (local time)
export function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Get daily puzzle data for a specific date
export function getDailyPuzzleDataForDate(date: string): DailyPuzzleData | null {
  const seed = generateDailySeed(date)
  
  // Check if we have saved data for this date
  const savedData = localStorage.getItem(`daily-${date}`)
  
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      return {
        date: date,
        seed: seed,
        isCompleted: parsed.isCompleted || false,
        firstScore: parsed.firstScore || 0,
        bestScore: parsed.bestScore || 0,
        attempts: parsed.attempts || 0,
        longestWordLength: parsed.longestWordLength || 0,
        longestWord: parsed.longestWord || '',
        allWordsFound: parsed.allWordsFound || []
      }
    } catch (e) {
      console.error('Error parsing saved daily data:', e)
    }
  }
  
  // Return null if no data found for this date
  return null
}

// Get daily puzzle data for today
export function getDailyPuzzleData(): DailyPuzzleData {
  const today = getTodayDate()
  const seed = generateDailySeed(today)
  
  // Check if we have saved data for today
  const savedData = localStorage.getItem(`daily-${today}`)
  
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      return {
        date: today,
        seed: seed,
        isCompleted: parsed.isCompleted || false,
        firstScore: parsed.firstScore || 0,
        bestScore: parsed.bestScore || 0,
        attempts: parsed.attempts || 0,
        longestWordLength: parsed.longestWordLength || 0,
        longestWord: parsed.longestWord || '',
        allWordsFound: parsed.allWordsFound || []
      }
    } catch (error) {
      console.error('Error parsing saved daily puzzle data:', error)
    }
  }
  
  // Return new puzzle data for today
  return {
    date: today,
    seed: seed,
    isCompleted: false,
    firstScore: 0,
    bestScore: 0,
    attempts: 0,
    longestWordLength: 0,
    longestWord: '',
    allWordsFound: []
  }
}

// Save daily puzzle progress
export function saveDailyProgress(data: DailyPuzzleData): void {
  const saveData = {
    isCompleted: data.isCompleted,
    firstScore: data.firstScore,
    bestScore: data.bestScore,
    attempts: data.attempts,
    longestWordLength: data.longestWordLength,
    longestWord: data.longestWord,
    allWordsFound: data.allWordsFound
  }
  localStorage.setItem(`daily-${data.date}`, JSON.stringify(saveData))
}

// Save daily puzzle completion data (for banner display)
export function saveDailyCompletionData(data: DailyPuzzleData, gameState: any): void {
  const completionData = {
    isCompleted: data.isCompleted,
    firstScore: data.firstScore,
    bestScore: data.bestScore,
    attempts: data.attempts,
    longestWordLength: data.longestWordLength,
    longestWord: data.longestWord,
    // Save completion-specific game state for banner display
    usedWords: gameState.usedWords,
    finalScore: gameState.finalScore,
    penaltyScore: gameState.penaltyScore,
    gameOver: gameState.gameOver
  }
  localStorage.setItem(`daily-completion-${data.date}`, JSON.stringify(completionData))
}

// Load daily puzzle completion data
export function loadDailyCompletionData(date: string): any | null {
  try {
    const savedData = localStorage.getItem(`daily-completion-${date}`)
    if (savedData) {
      return JSON.parse(savedData)
    }
  } catch (error) {
    console.error('Error loading daily completion data:', error)
  }
  return null
}

// Save daily puzzle game state
export function saveDailyGameState(gameState: any): void {
  const today = getTodayDate()
  const stateData = {
    currentWord: gameState.currentWord,
    selectedTiles: gameState.selectedTiles,
    usedWords: gameState.usedWords,
    totalScore: gameState.totalScore,
    layers: gameState.layers.map((layer: any) => ({
      ...layer,
      tiles: layer.tiles.map((tile: any) => ({
        ...tile,
        selected: tile.selected,
        visible: tile.visible,
        selectable: tile.selectable
      }))
    })),
    feedback: gameState.feedback,
    feedbackColor: gameState.feedbackColor,
    swapsRemaining: gameState.swapsRemaining,
    swapMode: gameState.swapMode,
    gameOver: gameState.gameOver,
    finalScore: gameState.finalScore,
    penaltyScore: gameState.penaltyScore,
    showEndGameConfirmation: gameState.showEndGameConfirmation,
    timestamp: Date.now()
  }
  localStorage.setItem(`daily-game-${today}`, JSON.stringify(stateData))
}

// Load daily puzzle game state
export function loadDailyGameState(): any | null {
  const today = getTodayDate()
  try {
    const savedData = localStorage.getItem(`daily-game-${today}`)
    if (savedData) {
      const stateData = JSON.parse(savedData)
      // Check if the saved state is from today (not older than 24 hours)
      const now = Date.now()
      const savedTime = stateData.timestamp || 0
      const hoursDiff = (now - savedTime) / (1000 * 60 * 60)
      
      if (hoursDiff < 24) {
        return stateData
      } else {
        // Clear old state
        localStorage.removeItem(`daily-game-${today}`)
      }
    }
  } catch (error) {
    console.error('Error loading daily game state:', error)
  }
  return null
}

// Clear daily puzzle game state
export function clearDailyGameState(): void {
  const today = getTodayDate()
  localStorage.removeItem(`daily-game-${today}`)
}

// Reset daily puzzle for replay (keeps first score and best score)
export function resetDailyPuzzleForReplay(): void {
  const today = getTodayDate()
  // Clear the current game state but keep the progress data
  localStorage.removeItem(`daily-game-${today}`)
}

// Check if today's puzzle is completed
export function isTodayPuzzleCompleted(): boolean {
  const data = getDailyPuzzleData()
  return data.isCompleted
}

// Mark today's puzzle as completed
export function markTodayPuzzleCompleted(score: number): void {
  const data = getDailyPuzzleData()
  data.isCompleted = true
  
  // If this is the first attempt, record it as first score
  if (data.attempts === 0) {
    data.firstScore = score
  }
  
  data.bestScore = Math.max(data.bestScore, score)
  data.attempts += 1
  saveDailyProgress(data)
}

// Update best score for today's puzzle
export function updateTodayBestScore(score: number): void {
  const data = getDailyPuzzleData()
  data.bestScore = Math.max(data.bestScore, score)
  data.attempts += 1
  saveDailyProgress(data)
}

// Get daily puzzle statistics
export function getDailyPuzzleStats(): {
  today: DailyPuzzleData;
  isCompleted: boolean;
  bestScore: number;
  attempts: number;
} {
  const data = getDailyPuzzleData()
  return {
    today: data,
    isCompleted: data.isCompleted,
    bestScore: data.bestScore,
    attempts: data.attempts
  }
}

// Seeded random number generator for consistent daily puzzles
export class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  // Generate next random number (0-1)
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  // Generate random integer between min and max (inclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  // Shuffle array using seeded random
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

// Generate daily puzzle using the same algorithm as regular game but with seeded random
export function generateDailyPuzzle(seed: number): { layers: Layer[]; swapPool: string[]; rng: SeededRandom } {
  const rng = new SeededRandom(seed)
  
  // Use the same tile bag as regular game
  const TILE_BAG = "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ**".split('')
  
  // Create layers
  const layers: Layer[] = [
    { size: 4, offset: 0, tiles: [] },
    { size: 3, offset: 1, tiles: [] },
    { size: 2, offset: 2, tiles: [] }
  ]

  const tileMap = new Map<string, string>()
  const remainingTiles = [...TILE_BAG]
  rng.shuffle(remainingTiles) // Shuffle using the seeded random

  // Generate tiles for each layer
  layers.forEach((layer, z) => {
    for (let y = layer.offset; y < (layer.size * 2) + layer.offset; y += 2) {
      for (let x = layer.offset; x < (layer.size * 2) + layer.offset; x += 2) {
        const letter = remainingTiles.length > 0
          ? remainingTiles.splice(Math.floor(rng.next() * remainingTiles.length), 1)[0]
          : '*'

        const coords: Coordinate[] = [
          [x, y, z],
          [x + 1, y, z],
          [x, y + 1, z],
          [x + 1, y + 1, z]
        ]

        // Store letter for all coordinates
        for (const coord of coords) {
          tileMap.set(JSON.stringify(coord), letter)
        }

        // Create tile (only for top-left coordinate)
        const tile: Tile = {
          id: `${x}-${y}-${z}`,
          letter,
          coords,
          parentCoords: z > 0 ? [
            [x, y, z - 1],
            [x + 1, y, z - 1],
            [x, y + 1, z - 1],
            [x + 1, y + 1, z - 1]
          ] : undefined,
          selected: false,
          visible: z === 0,
          selectable: z === 0,
          layer: z,
          position: { x, y },
          completelyCovered: z > 0 // Middle and bottom layers start completely covered
        }

        layer.tiles.push(tile)
      }
    }
  })

  // Create swap pool from remaining tiles (tiles not used in the puzzle)
  const swapPool = [...remainingTiles]
  
  // If we don't have enough tiles in the swap pool, add some from the original bag
  // This ensures we always have tiles available for swapping
  if (swapPool.length < 20) {
    const additionalTiles = TILE_BAG.slice(0, 20 - swapPool.length)
    swapPool.push(...additionalTiles)
  }

  console.log('Daily puzzle swap pool created with', swapPool.length, 'tiles:', swapPool.slice(0, 10), '...')
  
  return {
    layers,
    swapPool,
    rng
  }
}
