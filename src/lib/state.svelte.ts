import type { GameState, Tile, Layer, Coordinate } from '../types/game'
import { SeededRandom } from './daily-puzzle'


// Generate tile bag with Scrabble distribution
const TILE_BAG = "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ**".split('')

// Get Scrabble letter point value
export function getScrabbleLetterValue(letter: string): number {
  const upperLetter = letter.toUpperCase()
  if (upperLetter === '*') return 0 // Wildcard cannot be bonus
  
  // 1 point: A, E, I, O, U, L, N, S, T, R
  if ('AEIOULNSTR'.includes(upperLetter)) return 1
  // 2 points: D, G
  if ('DG'.includes(upperLetter)) return 2
  // 3 points: B, C, M, P
  if ('BCMP'.includes(upperLetter)) return 3
  // 4 points: F, H, V, W, Y
  if ('FHVWY'.includes(upperLetter)) return 4
  // 5 points: K
  if (upperLetter === 'K') return 5
  // 8 points: J, X
  if ('JX'.includes(upperLetter)) return 8
  // 10 points: Q, Z
  if ('QZ'.includes(upperLetter)) return 10
  
  return 0
}

export const game = $state<GameState>({
  currentWord: '',
  selectedTiles: [],
  usedWords: [],
  totalScore: 0,
  wordList: new Set(),
  layers: [],
  feedback: '',
  feedbackColor: 'black',
  swapsRemaining: 3,
  swapMode: false,
  gameOver: false,
  finalScore: 0,
  penaltyScore: 0,
  showEndGameConfirmation: false,
  isDailyPuzzle: false,
  gameMode: 'main'
})

// Store the original tile bag and swap pool
let originalTileBag: string[] = []
let swapPool: string[] = []

// Undo history for daily puzzle
type UndoAction = 
  | { type: 'word'; tiles: Tile[]; score: number; word: string; tilePositions: Array<{ layer: number; index: number }> }
  | { type: 'swap'; tileId: string; oldLetter: string; newLetter: string; swapPoolIndex: number; swapPoolLetter: string; wasBonus: boolean }

let undoHistory: UndoAction[] = []

// Store timeout reference for clearing feedback
let feedbackTimeout: number | null = null

// Function to set feedback with auto-clear after 3 seconds
export function setFeedback(message: string, color: string = 'black') {
  // Clear any existing timeout
  if (feedbackTimeout) {
    clearTimeout(feedbackTimeout)
  }
  
  // Set the feedback
  game.feedback = message
  game.feedbackColor = color
  
  // Set timeout to clear feedback after 3 seconds (unless it's a permanent message)
  if (message && !message.includes('Game Over!') && !message.includes('Final Score:')) {
    feedbackTimeout = setTimeout(() => {
      game.feedback = ''
      game.feedbackColor = 'black'
      feedbackTimeout = null
    }, 3000)
  }
}

// Helper function to count remaining tiles
function countRemainingTiles(): number {
  let count = 0
  for (const layer of game.layers) {
    count += layer.tiles.length
  }
  return count
}

// Set Daily Puzzle mode
export function setDailyPuzzleMode(isDaily: boolean) {
  game.isDailyPuzzle = isDaily
}

// Set game mode
export function setGameMode(mode: 'main' | 'mini' | 'pyramid') {
  game.gameMode = mode
}

// Callback for Daily Puzzle end game
let dailyPuzzleEndGameCallback: (() => void) | null = null

// Set callback for Daily Puzzle end game
export function setDailyPuzzleEndGameCallback(callback: (() => void) | null) {
  dailyPuzzleEndGameCallback = callback
}

// Get callback for Daily Puzzle end game
export function getDailyPuzzleEndGameCallback(): (() => void) | null {
  return dailyPuzzleEndGameCallback
}

// Initialize game
export function initializeGame() {
  // Clear any existing feedback timeout
  if (feedbackTimeout) {
    clearTimeout(feedbackTimeout)
    feedbackTimeout = null
  }
  
  // Reset all game state
  game.currentWord = ''
  game.selectedTiles = []
  game.usedWords = []
  game.totalScore = 0
  game.feedback = ''
  game.feedbackColor = 'black'
  game.swapsRemaining = 3
  game.swapMode = false
  game.gameOver = false
  game.finalScore = 0
  game.penaltyScore = 0
  game.showEndGameConfirmation = false
  game.isDailyPuzzle = false

  // Load word list
  fetch('./wordlist.txt')
    .then(response => response.text())
    .then(data => {
      game.wordList = new Set(data.split('\n').map(word => word.trim().toUpperCase()))
      console.log('Wordlist loaded:', game.wordList.size, 'words')
    })
    .catch(err => console.error('Error loading wordlist:', err))

  // Generate layers and tiles
  game.layers = generateLayers()
}

function generateLayers(): Layer[] {
  const layers: Layer[] = game.gameMode === 'mini' 
    ? [
        { size: 3, offset: 0, tiles: [] },  // Top: 3x3
        { size: 2, offset: 1, tiles: [] },  // Middle: 2x2 (centered)
        { size: 3, offset: 0, tiles: [] }   // Bottom: 3x3
      ]
    : game.gameMode === 'pyramid'
    ? [
        { size: 2, offset: 2, tiles: [] },  // Top: 2x2 (centered)
        { size: 3, offset: 1, tiles: [] },  // Middle: 3x3 (centered)
        { size: 4, offset: 0, tiles: [] }   // Bottom: 4x4
      ]
    : [
        { size: 4, offset: 0, tiles: [] },
        { size: 3, offset: 1, tiles: [] },
        { size: 2, offset: 2, tiles: [] }
      ]

  const tileMap = new Map<string, string>()
  const remainingTiles = [...TILE_BAG]
  
  // Store the original tile bag for reference
  originalTileBag = [...TILE_BAG]

  // Generate tiles for each layer
  layers.forEach((layer, z) => {
    for (let y = layer.offset; y < (layer.size * 2) + layer.offset; y += 2) {
      for (let x = layer.offset; x < (layer.size * 2) + layer.offset; x += 2) {
        const letter = remainingTiles.length > 0
          ? remainingTiles.splice(Math.floor(Math.random() * remainingTiles.length), 1)[0]
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
          visible: z === 0 || (game.gameMode === 'pyramid' && z > 0), // Top layer always visible, or all layers visible in pyramid mode
          selectable: z === 0, // Only top layer is initially selectable
          layer: z,
          position: { x, y },
          completelyCovered: z > 0 && !(z === 0 || (game.gameMode === 'pyramid' && z > 0)), // Completely covered if not visible
          isBonus: false
        }

        layer.tiles.push(tile)
      }
    }
  })

  // Create swap pool from remaining tiles (tiles not used in the puzzle)
  swapPool = [...remainingTiles]
  
  // If we don't have enough tiles in the swap pool, add some from the original bag
  // This ensures we always have tiles available for swapping
  if (swapPool.length < 20) {
    const additionalTiles = originalTileBag.slice(0, 20 - swapPool.length)
    swapPool.push(...additionalTiles)
  }

  console.log('Swap pool created with', swapPool.length, 'tiles:', swapPool.slice(0, 10), '...')
  
  // Assign bonus tiles to layers
  assignBonusTiles(layers)
  
  return layers
}

// Assign bonus tiles to layers using weighted selection based on Scrabble values
export function assignBonusTiles(layers: Layer[], rng?: SeededRandom): void {
  layers.forEach((layer) => {
    // Flip a coin (50/50 chance) to decide if this layer has a bonus tile
    const hasBonus = rng ? rng.next() < 0.5 : Math.random() < 0.5
    
    if (!hasBonus) return
    
    // Create weighted bag: for each non-wildcard tile, add (Scrabble value) copies
    const weightedBag: Tile[] = []
    layer.tiles.forEach((tile) => {
      if (tile.letter !== '*') {
        const value = getScrabbleLetterValue(tile.letter)
        // Add this tile to the bag 'value' times
        for (let i = 0; i < value; i++) {
          weightedBag.push(tile)
        }
      }
    })
    
    // If no valid tiles (all wildcards), skip this layer
    if (weightedBag.length === 0) return
    
    // Randomly select one tile from weighted bag
    const randomIndex = rng 
      ? Math.floor(rng.next() * weightedBag.length)
      : Math.floor(Math.random() * weightedBag.length)
    const selectedTile = weightedBag[randomIndex]
    
    // Mark selected tile as bonus
    selectedTile.isBonus = true
  })
}

// Check if a tile is selectable (all parent tiles must be removed)
export function isTileSelectable(tile: Tile): boolean {
  if (!tile.parentCoords || tile.parentCoords.length === 0) {
    return tile.visible
  }

  // Check if any parent tiles still exist
  for (const parentCoord of tile.parentCoords) {
    const parentExists = game.layers.some(layer => 
      layer.tiles.some(t => 
        t.coords.some(coord => 
          coord[0] === parentCoord[0] && 
          coord[1] === parentCoord[1] && 
          coord[2] === parentCoord[2]
        )
      )
    )
    if (parentExists) return false
  }

  return tile.visible
}

// Check if a tile is temp-selectable (all covering tiles are selected)
export function isTileTempSelectable(tile: Tile): boolean {
  // Must be visible but not normally selectable
  if (!tile.visible || isTileSelectable(tile)) {
    return false
  }

  // Must have parent coordinates (covering tiles)
  if (!tile.parentCoords || tile.parentCoords.length === 0) {
    return false
  }

  // All covering tiles must be currently selected
  for (const parentCoord of tile.parentCoords) {
    const coveringTile = game.layers.find(layer => 
      layer.tiles.find(t => 
        t.coords.some(coord => 
          coord[0] === parentCoord[0] && 
          coord[1] === parentCoord[1] && 
          coord[2] === parentCoord[2]
        )
      )
    )?.tiles.find(t => 
      t.coords.some(coord => 
        coord[0] === parentCoord[0] && 
        coord[1] === parentCoord[1] && 
        coord[2] === parentCoord[2]
      )
    )

    // If covering tile exists but is not selected, this tile is not temp-selectable
    if (coveringTile && !coveringTile.selected) {
      return false
    }
  }

  return true
}

// Update tile visibility and selectability
export function updateTileStates() {
  game.layers.forEach(layer => {
    layer.tiles.forEach(tile => {
      // Update visibility - tile becomes visible when any parent is removed
      if (tile.layer > 0) {
        const hasVisibleParent = !tile.parentCoords || tile.parentCoords.some(parentCoord => {
          return !game.layers.some(layer => 
            layer.tiles.some(t => 
              t.coords.some(coord => 
                coord[0] === parentCoord[0] && 
                coord[1] === parentCoord[1] && 
                coord[2] === parentCoord[2]
              )
            )
          )
        })
        tile.visible = hasVisibleParent
        tile.completelyCovered = !hasVisibleParent
      }

      // Update selectability
      tile.selectable = isTileSelectable(tile)
    })
  })
  
  // No need to recreate the array - we only modified tile properties
  // Svelte's reactivity will handle the updates automatically
}

// Select/deselect a tile
export function toggleTileSelection(tile: Tile) {
  // Handle swap mode - only allow swapping of available tiles
  if (game.swapMode) {
    if (!tile.selectable) {
    setFeedback("Can only swap available tiles, not temp-selectable ones", 'red')
      return
    }
    swapTile(tile)
    return
  }

  // Allow selection of selectable tiles or temp-selectable tiles
  if (!tile.selectable && !isTileTempSelectable(tile)) return

  if (tile.selected) {
    // Deselect tile
    tile.selected = false
    const index = game.selectedTiles.findIndex(t => t.id === tile.id)
    if (index !== -1) {
      game.selectedTiles.splice(index, 1)
      game.currentWord = game.currentWord.slice(0, index) + game.currentWord.slice(index + 1)
    }
    
    // After deselection, check if any temp-selectable tiles should lose their status
    updateTempSelectableStates()
  } else {
    // Select tile
    tile.selected = true
    game.selectedTiles.push(tile)
    game.currentWord += tile.letter
  }
}

// Update temp-selectable states after tile deselection
function updateTempSelectableStates() {
  // Find all currently selected tiles that are temp-selectable
  const selectedTempSelectableTiles = game.selectedTiles.filter(tile => 
    !tile.selectable && tile.selected
  )

  // Check each temp-selectable tile to see if it should still be selectable
  for (const tile of selectedTempSelectableTiles) {
    if (!isTileTempSelectable(tile)) {
      // This tile is no longer temp-selectable, so deselect it
      tile.selected = false
      const index = game.selectedTiles.findIndex(t => t.id === tile.id)
      if (index !== -1) {
        game.selectedTiles.splice(index, 1)
        game.currentWord = game.currentWord.slice(0, index) + game.currentWord.slice(index + 1)
      }
    }
  }
  
  // No need to recreate the array - we only modified tile properties
  // Svelte's reactivity will handle the updates automatically
}

// Validate that all covering tiles are used when temp-selectable tiles are used
function validateTempSelectableTiles(): { valid: boolean; error: string } {
  // Find all temp-selectable tiles that are currently selected
  const selectedTempSelectableTiles = game.selectedTiles.filter(tile => 
    !tile.selectable && isTileTempSelectable(tile)
  )

  for (const tempTile of selectedTempSelectableTiles) {
    if (!tempTile.parentCoords || tempTile.parentCoords.length === 0) {
      continue
    }

    // Check if all covering tiles are also selected
    for (const parentCoord of tempTile.parentCoords) {
      const coveringTile = game.layers.find(layer => 
        layer.tiles.find(t => 
          t.coords.some(coord => 
            coord[0] === parentCoord[0] && 
            coord[1] === parentCoord[1] && 
            coord[2] === parentCoord[2]
          )
        )
      )?.tiles.find(t => 
        t.coords.some(coord => 
          coord[0] === parentCoord[0] && 
          coord[1] === parentCoord[1] && 
          coord[2] === parentCoord[2]
        )
      )

      // If covering tile exists but is not selected, validation fails
      if (coveringTile && !game.selectedTiles.includes(coveringTile)) {
        return {
          valid: false,
          error: `Cannot use ${tempTile.letter} - all covering tiles must be used in the same word`
        }
      }
    }
  }

  return { valid: true, error: '' }
}

// Submit current word
export function submitWord() {
  if (game.selectedTiles.length === 0) return
  if (game.gameOver) return

  // Build word from current tile order (after any reordering)
  const currentWord = game.selectedTiles.map(tile => tile.letter).join('')
  
  if (currentWord.length === 0) return

  // Validate temp-selectable tiles
  const tempSelectableValidation = validateTempSelectableTiles()
  if (!tempSelectableValidation.valid) {
    setFeedback(tempSelectableValidation.error, 'red')
    return
  }

  const upperWord = currentWord.toUpperCase()
  const possibleWords = generateWildcardPermutations(upperWord)
  const isValidWord = possibleWords.some(word => game.wordList.has(word))

  if (isValidWord) {
    const scoreResult = calculateWordScore(game.selectedTiles)
    const wordScore = scoreResult.totalScore
    game.totalScore += wordScore
    game.usedWords.push({ word: currentWord.toUpperCase(), score: wordScore })
    setFeedback(`"${currentWord}" is a valid word!`, 'green')

    // Record undo action for daily puzzle (before removing tiles)
    if (game.isDailyPuzzle && (window as any).dailyPuzzleCompleted) {
      // Store tile positions before removal
      const tilePositions: Array<{ layer: number; index: number }> = []
      const tilesToRemove = [...game.selectedTiles] // Copy array
      
      tilesToRemove.forEach(tile => {
        const layer = game.layers[tile.layer]
        const index = layer.tiles.findIndex(t => t.id === tile.id)
        if (index !== -1) {
          tilePositions.push({ layer: tile.layer, index })
        }
      })
      
      undoHistory.push({
        type: 'word',
        tiles: tilesToRemove.map(t => ({ ...t })), // Deep copy tiles
        score: wordScore,
        word: currentWord.toUpperCase(),
        tilePositions
      })
    }

    // Remove selected tiles
    game.selectedTiles.forEach(tile => {
      const layer = game.layers[tile.layer]
      const index = layer.tiles.findIndex(t => t.id === tile.id)
      if (index !== -1) {
        layer.tiles.splice(index, 1)
      }
    })

    // Trigger reactivity for layer changes
    game.layers = [...game.layers]

    // Update tile states after removal
    updateTileStates()
    
    // Check if all tiles are used - if so, end the game automatically
    if (countRemainingTiles() === 0) {
      // All tiles used! End the game automatically
      setFeedback("All tiles used! Game complete!", 'green')
      
      if (game.isDailyPuzzle && dailyPuzzleEndGameCallback) {
        // Use Daily Puzzle specific end game handler
        dailyPuzzleEndGameCallback()
      } else {
        // Use regular end game handler
        confirmEndGame()
      }
      return
    }
  } else {
    setFeedback(`"${currentWord}" is not a valid word.`, 'red')
  }

  // Clear current selection
  clearSelection()
}

// Clear current selection
export function clearSelection() {
  // Deselect tiles in selectedTiles array
  game.selectedTiles.forEach(tile => {
    tile.selected = false
  })
  
  // Also deselect any tiles in layers that might be selected
  // This is important after restoring from saved state, where tile references might not match
  game.layers.forEach(layer => {
    layer.tiles.forEach(tile => {
      if (tile.selected) {
        tile.selected = false
      }
    })
  })
  
  game.selectedTiles = []
  game.currentWord = ''
  
  // No need to recreate the array - we only modified tile properties
  // Svelte's reactivity will handle the updates automatically
}

// Backspace - remove last selected tile
export function backspace() {
  if (game.selectedTiles.length > 0) {
    const lastTile = game.selectedTiles.pop()!
    lastTile.selected = false
    
    // Also deselect the tile in layers if it exists (important after restoring from saved state)
    // Find the tile in layers by ID to ensure we're updating the correct object
    game.layers.forEach(layer => {
      const tileInLayer = layer.tiles.find(t => t.id === lastTile.id)
      if (tileInLayer) {
        tileInLayer.selected = false
      }
    })
    
    game.currentWord = game.currentWord.slice(0, -1)
    
    // After removal, check if any temp-selectable tiles should lose their status
    updateTempSelectableStates()
  }
}

// Generate all possible wildcard permutations
function generateWildcardPermutations(word: string): string[] {
  const wildcards: number[] = []
  for (let i = 0; i < word.length; i++) {
    if (word[i] === '*') wildcards.push(i)
  }

  if (wildcards.length === 0) {
    return [word]
  }

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const permutations: string[] = []

  function substitute(current: string[], index: number) {
    if (index === wildcards.length) {
      permutations.push(current.join(''))
      return
    }

    const pos = wildcards[index]
    for (const letter of letters) {
      current[pos] = letter
      substitute(current, index + 1)
    }
    current[pos] = '*'
  }

  substitute(word.split(''), 0)
  return permutations
}

// Calculate word score using custom scoring values with bonus multipliers
function calculateWordScore(tiles: Tile[]): { baseScore: number; bonusCount: number; totalScore: number } {
  // Build word from tiles
  const word = tiles.map(tile => tile.letter).join('')
  
  // Exclude wildcard tiles (*) from word length for scoring
  const length = word.replace(/\*/g, '').length
  
  // Custom scoring values based on word length
  const scores: { [key: number]: number } = {
    1: 0,
    2: 1,
    3: 3,
    4: 5,
    5: 8,
    6: 12,
    7: 17,
    8: 23,
    9: 30,
    10: 38,
    11: 47,
    12: 57,
    13: 68,
    14: 80,
    15: 93,
    16: 107,
    17: 122,
    18: 138,
    19: 155,
    20: 173,
    21: 192,
    22: 212,
    23: 233,
    24: 255
  }
  
  const baseScore = scores[length] || 0
  
  // Count bonus tiles in the word
  const bonusCount = tiles.filter(tile => tile.isBonus).length
  
  // Apply multiplier: baseScore * (1 + bonusCount)
  const totalScore = baseScore * (1 + bonusCount)
  
  return { baseScore, bonusCount, totalScore }
}

// Reorder tiles in the current word
export function reorderTiles(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
      fromIndex >= game.selectedTiles.length || toIndex >= game.selectedTiles.length) {
    return
  }

  // Create a copy of the array to avoid mutation issues
  const tiles = [...game.selectedTiles]
  
  // Remove tile from original position
  const [movedTile] = tiles.splice(fromIndex, 1)
  
  // Insert at target position (no adjustment needed since we're working with a copy)
  tiles.splice(toIndex, 0, movedTile)
  
  // Update the selected tiles array
  game.selectedTiles = tiles
  
  // Update current word to match new order
  game.currentWord = game.selectedTiles.map(tile => tile.letter).join('')
  
  // No need to recreate the array - we only modified selectedTiles
  // Svelte's reactivity will handle the updates automatically
}

// Remove a specific tile from the current word
export function removeTileFromWord(index: number) {
  if (index < 0 || index >= game.selectedTiles.length) return
  
  const removedTile = game.selectedTiles[index]
  removedTile.selected = false
  
  // Also deselect the tile in layers if it exists (important after restoring from saved state)
  // Find the tile in layers by ID to ensure we're updating the correct object
  game.layers.forEach(layer => {
    const tileInLayer = layer.tiles.find(t => t.id === removedTile.id)
    if (tileInLayer) {
      tileInLayer.selected = false
    }
  })
  
  // Remove from selected tiles
  game.selectedTiles.splice(index, 1)
  
  // Update current word
  game.currentWord = game.selectedTiles.map(tile => tile.letter).join('')
  
  // After removal, check if any temp-selectable tiles should lose their status
  updateTempSelectableStates()
}

// Get potential score for current word
export function getCurrentWordScore(): { baseScore: number; bonusCount: number; totalScore: number } {
  if (game.selectedTiles.length === 0) return { baseScore: 0, bonusCount: 0, totalScore: 0 }
  return calculateWordScore(game.selectedTiles)
}

// Check if the current word is valid
export function isCurrentWordValid(): boolean {
  if (game.selectedTiles.length === 0) return false
  
  // Build word from current tile order
  const currentWord = game.selectedTiles.map(tile => tile.letter).join('')
  if (currentWord.length === 0) return false
  
  // Validate temp-selectable tiles
  const tempSelectableValidation = validateTempSelectableTiles()
  if (!tempSelectableValidation.valid) {
    return false
  }
  
  // Check if word is in word list (with wildcard permutations)
  const upperWord = currentWord.toUpperCase()
  const possibleWords = generateWildcardPermutations(upperWord)
  return possibleWords.some(word => game.wordList.has(word))
}

// Toggle swap mode
export function toggleSwapMode() {
  if (game.swapsRemaining <= 0) {
    setFeedback("No swaps remaining!", 'red')
    return
  }
  
  game.swapMode = !game.swapMode
  if (game.swapMode) {
    // Show upcoming letters for daily puzzle mode only if it's been completed before
    if (game.isDailyPuzzle && (window as any).dailyPuzzleCompleted) {
      const upcomingLetters = getUpcomingSwapLetters(game.swapsRemaining)
      if (upcomingLetters.length > 0) {
        setFeedback(`Click a tile to swap it for a new one. Upcoming letters: ${upcomingLetters.join(', ')}`, 'blue')
      } else {
        setFeedback("Click a tile to swap it for a new one", 'blue')
      }
    } else {
      setFeedback("Click a tile to swap it for a new one", 'blue')
    }
  } else {
    setFeedback("Swap mode cancelled", 'black')
  }
}

// Swap a tile for a new one
export function swapTile(tile: Tile) {
  if (!game.swapMode || game.swapsRemaining <= 0) return
  
  // Use daily swap pool if available (for daily puzzle mode)
  const currentSwapPool = (window as any).dailySwapPool || swapPool
  const dailyRng = (window as any).dailyRng // Seeded random for daily puzzle
  
  // Check if we have tiles available in the swap pool
  if (currentSwapPool.length === 0) {
    setFeedback("No more tiles available for swapping!", 'red')
    return
  }
  
  // Get a tile from the swap pool using seeded random for daily puzzle, or regular random for free play
  let randomIndex: number
  if (dailyRng) {
    // Use seeded random for deterministic daily puzzle swaps
    randomIndex = Math.floor(dailyRng.next() * currentSwapPool.length)
  } else {
    // Use regular random for free play
    randomIndex = Math.floor(Math.random() * currentSwapPool.length)
  }
  
  const newLetter = currentSwapPool.splice(randomIndex, 1)[0]
  const oldLetter = tile.letter
  const wasBonus = tile.isBonus
  
  // Record undo action for daily puzzle (before swapping)
  if (game.isDailyPuzzle && (window as any).dailyPuzzleCompleted) {
    undoHistory.push({
      type: 'swap',
      tileId: tile.id,
      oldLetter,
      newLetter,
      swapPoolIndex: randomIndex,
      swapPoolLetter: newLetter,
      wasBonus
    })
  }
  
  // Remove bonus if tile had one (bonus leaves with the old tile)
  tile.isBonus = false
  
  // Update the tile's letter
  tile.letter = newLetter
  
  // Decrease swap count
  game.swapsRemaining--
  
  // Exit swap mode
  game.swapMode = false
  
  // Update feedback with upcoming letters for daily puzzle mode only if it's been completed before
  if (game.isDailyPuzzle && game.swapsRemaining > 0 && (window as any).dailyPuzzleCompleted) {
    const upcomingLetters = getUpcomingSwapLetters(game.swapsRemaining)
    if (upcomingLetters.length > 0) {
      setFeedback(`Swapped to ${newLetter}! ${game.swapsRemaining} swaps remaining. Upcoming letters: ${upcomingLetters.join(', ')}`, 'green')
    } else {
      setFeedback(`Swapped to ${newLetter}! ${game.swapsRemaining} swaps remaining (${currentSwapPool.length} tiles left)`, 'green')
    }
  } else {
    setFeedback(`Swapped to ${newLetter}! ${game.swapsRemaining} swaps remaining (${currentSwapPool.length} tiles left)`, 'green')
  }
  
  // No need to trigger full re-render since we only changed one tile's letter
  // The tile component will automatically update due to the letter change
}

// Show end game confirmation dialog
export function showEndGameConfirmation() {
  if (game.gameOver) return
  
  // Check if there are remaining tiles
  const remainingTiles = countRemainingTiles()
  
  // If no tiles remain, end the game directly
  if (remainingTiles === 0) {
    confirmEndGame()
    return
  }
  
  // Otherwise, show confirmation modal
  game.showEndGameConfirmation = true
}

// Cancel end game confirmation
export function cancelEndGame() {
  game.showEndGameConfirmation = false
}

// Confirm and end the game
export function confirmEndGame() {
  if (game.gameOver) return
  
  // Count all remaining tiles (visible and hidden)
  const remainingTiles: Tile[] = []
  for (const layer of game.layers) {
    for (const tile of layer.tiles) {
      remainingTiles.push(tile)
    }
  }
  
  // Calculate penalty (3 points per remaining tile)
  game.penaltyScore = remainingTiles.length * 3
  
  // Calculate final score
  game.finalScore = game.totalScore - game.penaltyScore
  
  // Set game over
  game.gameOver = true
  game.showEndGameConfirmation = false
  
  // Clear current selection
  clearSelection()
  
  // Update feedback
  // Game over feedback should be permanent, so set it directly
  game.feedback = `Game Over! Final Score: ${game.finalScore} (${game.totalScore} - ${game.penaltyScore} penalty)`
  game.feedbackColor = game.finalScore >= 0 ? 'green' : 'red'
}

// Get tile state for styling
export function getTileState(tile: Tile): 'available' | 'selected' | 'unavailable' | 'temp-selectable' | 'hidden' {
  if (tile.completelyCovered) return 'hidden'
  if (tile.selected) return 'selected'
  if (isTileTempSelectable(tile)) return 'temp-selectable'
  if (!tile.selectable) return 'unavailable'
  return 'available'
}

// Get swap pool status for debugging
export function getSwapPoolStatus() {
  return {
    remainingTiles: swapPool.length,
    tiles: swapPool.slice(0, 10), // Show first 10 tiles
    totalOriginal: originalTileBag.length
  }
}

// Get upcoming swap letters for daily puzzle
export function getUpcomingSwapLetters(count: number = 3): string[] {
  // Use daily swap pool if available (for daily puzzle mode)
  const currentSwapPool = (window as any).dailySwapPool || swapPool
  const dailyRng = (window as any).dailyRng // Seeded random for daily puzzle
  
  if (!currentSwapPool || currentSwapPool.length === 0) {
    return []
  }
  
  // For daily puzzle mode with seeded random, we need to simulate the RNG state
  if (dailyRng && game.isDailyPuzzle) {
    // Create a copy of the swap pool to avoid modifying the original
    const poolCopy = [...currentSwapPool]
    const upcomingLetters: string[] = []
    
    // Use the current RNG state directly by cloning it
    // This ensures we use the exact same RNG state that will be used for actual swaps
    const tempRng = dailyRng.clone()
    
    // Now get the next few letters that would come up
    // Use the same logic as swapTile: tempRng.next() * poolCopy.length
    for (let i = 0; i < Math.min(count, poolCopy.length); i++) {
      const randomIndex = Math.floor(tempRng.next() * poolCopy.length)
      upcomingLetters.push(poolCopy[randomIndex])
      poolCopy.splice(randomIndex, 1)
    }
    
    return upcomingLetters
  } else {
    // For free play mode, just return random letters from the pool
    const poolCopy = [...currentSwapPool]
    const upcomingLetters: string[] = []
    
    for (let i = 0; i < Math.min(count, poolCopy.length); i++) {
      const randomIndex = Math.floor(Math.random() * poolCopy.length)
      upcomingLetters.push(poolCopy[randomIndex])
      poolCopy.splice(randomIndex, 1)
    }
    
    return upcomingLetters
  }
}

// Undo last action (only for daily puzzle after completion)
export function undoLastAction(): boolean {
  if (!game.isDailyPuzzle || !(window as any).dailyPuzzleCompleted) {
    return false
  }
  
  if (undoHistory.length === 0) {
    setFeedback("Nothing to undo", 'black')
    return false
  }
  
  const lastAction = undoHistory.pop()!
  
  if (lastAction.type === 'word') {
    // Undo word submission: restore tiles to their original positions
    const { tiles, score, word, tilePositions } = lastAction
    
    // Remove from used words
    const wordIndex = game.usedWords.findIndex(w => w.word === word && w.score === score)
    if (wordIndex !== -1) {
      game.usedWords.splice(wordIndex, 1)
    }
    
    // Restore score
    game.totalScore -= score
    
    // Restore tiles to their original positions
    // Insert in reverse order (highest index first) to maintain correct positions
    const sortedPositions = tilePositions.map((pos, i) => ({ pos, tile: tiles[i], index: i }))
      .sort((a, b) => {
        // Sort by layer first, then by index (descending)
        if (a.pos.layer !== b.pos.layer) {
          return b.pos.layer - a.pos.layer
        }
        return b.pos.index - a.pos.index
      })
    
    sortedPositions.forEach(({ pos, tile }) => {
      const targetLayer = game.layers[pos.layer]
      // Insert tile back at its original position
      targetLayer.tiles.splice(pos.index, 0, tile)
    })
    
    // Trigger reactivity for layer changes
    game.layers = [...game.layers]
    
    // Update tile states after restoration
    updateTileStates()
    
    // Clear current selection
    clearSelection()
    
    setFeedback(`Undid word "${word}"`, 'blue')
    return true
  } else if (lastAction.type === 'swap') {
    // Undo tile swap: restore original letter
    const { tileId, oldLetter, newLetter, swapPoolIndex, swapPoolLetter, wasBonus } = lastAction
    
    // Find the tile
    let tile: Tile | null = null
    for (const layer of game.layers) {
      const foundTile = layer.tiles.find(t => t.id === tileId)
      if (foundTile) {
        tile = foundTile
        break
      }
    }
    
    if (tile) {
      // Restore original letter and bonus status
      tile.letter = oldLetter
      tile.isBonus = wasBonus
      
      // Restore swap pool (put the letter back at the original position)
      const currentSwapPool = (window as any).dailySwapPool || swapPool
      currentSwapPool.splice(swapPoolIndex, 0, swapPoolLetter)
      
      // Restore swap count
      game.swapsRemaining++
      
      // For daily puzzle, regenerate RNG to correct state after undo
      // The RNG state should be: puzzle generation + (3 - game.swapsRemaining) swaps
      if (game.isDailyPuzzle && (window as any).dailyPuzzleSeed !== undefined) {
        const originalSeed = (window as any).dailyPuzzleSeed
        const newRng = new SeededRandom(originalSeed)
        
        // Calculate how many RNG calls were made during puzzle generation
        const puzzleGenerationCalls = 99 + 29 // shuffle calls + tile placement calls
        
        // Advance through puzzle generation
        for (let i = 0; i < puzzleGenerationCalls; i++) {
          newRng.next()
        }
        
        // Advance through swaps that have been made (current swapsRemaining tells us how many are left)
        // After undo, swapsRemaining has been incremented, so we need to calculate swaps made before the undo
        const swapsMade = 3 - game.swapsRemaining
        for (let i = 0; i < swapsMade; i++) {
          newRng.next()
        }
        
        // Replace the RNG with the regenerated one
        ;(window as any).dailyRng = newRng
      }
      
      setFeedback(`Undid swap: restored ${oldLetter}`, 'blue')
      return true
    } else {
      setFeedback("Could not find tile to undo swap", 'red')
      return false
    }
  }
  
  return false
}

// Get undo history (for persistence)
export function getUndoHistory(): UndoAction[] {
  return undoHistory
}

// Set undo history (for restoration)
export function setUndoHistory(history: UndoAction[]): void {
  undoHistory = history
}

// Clear undo history
export function clearUndoHistory(): void {
  undoHistory = []
}
