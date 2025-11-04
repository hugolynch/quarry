<script lang="ts">
  import { onMount } from 'svelte'
  import { 
    getDailyPuzzleData, 
    getTodayDate, 
    generateDailySeed, 
    generateDailyPuzzle,
    markTodayPuzzleCompleted,
    updateTodayBestScore,
    isTodayPuzzleCompleted,
    saveDailyGameState,
    loadDailyGameState,
    clearDailyGameState,
    resetDailyPuzzleForReplay,
    saveDailyProgress,
    saveDailyCompletionData,
    loadDailyCompletionData
  } from '../lib/daily-puzzle'
  import { game, initializeGame, showEndGameConfirmation, cancelEndGame, confirmEndGame, setFeedback, setDailyPuzzleMode, setDailyPuzzleEndGameCallback } from '../lib/state.svelte'
  import Board from './Board.svelte'
  import WordArea from './WordArea.svelte'
  import Score from './Score.svelte'
  import type { Tile, Layer, Coordinate } from '../types/game'

  // Daily puzzle data
  let dailyData = $state({
    date: '',
    seed: 0,
    isCompleted: false,
    firstScore: 0,
    bestScore: 0,
    attempts: 0,
    longestWordLength: 0,
    longestWord: '',
    allWordsFound: [] as string[]
  })

  // Share button state
  let shareButtonText = $state('Share')

  onMount(() => {
    // Set Daily Puzzle mode
    setDailyPuzzleMode(true)
    
    // Register the Daily Puzzle end game callback
    setDailyPuzzleEndGameCallback(handleDailyEndGame)
    
    // Set the completion flag for upcoming letters display
    ;(window as any).dailyPuzzleCompleted = dailyData.isCompleted
    
    initializeDailyPuzzle()
  })

  // Auto-save game state whenever it changes
  $effect(() => {
    if (game.layers.length > 0) {
      // Only save if we have a puzzle loaded
      saveDailyGameState(game)
    }
  })

  // Update best score when total score changes
  $effect(() => {
    if (game.totalScore > 0) {
      updateBestScore()
    }
  })

  // Update all words found in real-time during gameplay
  $effect(() => {
    if (game.usedWords.length > 0) {
      updateAllWordsFound()
    }
  })

  function initializeDailyPuzzle() {
    // Get today's puzzle data
    dailyData = getDailyPuzzleData()
    
    // Load word list if not already loaded
    if (game.wordList.size === 0) {
      fetch('./wordlist.txt')
        .then(response => response.text())
        .then(data => {
          game.wordList = new Set(data.split('\n').map(word => word.trim().toUpperCase()))
        })
        .catch(err => console.error('Error loading wordlist:', err))
    }

    // Check if puzzle is completed and load completion data
    if (dailyData.isCompleted) {
      const completionData = loadDailyCompletionData(dailyData.date)
      if (completionData) {
        // Restore completion-specific game state for banner display
        game.usedWords = completionData.usedWords || []
        game.finalScore = completionData.finalScore || 0
        game.penaltyScore = completionData.penaltyScore || 0
        game.gameOver = completionData.gameOver || true
        dailyData.longestWordLength = completionData.longestWordLength || 0
        dailyData.longestWord = completionData.longestWord || ''
        
        // Generate the puzzle layout for display (but don't make it playable)
        const puzzle = generateDailyPuzzle(dailyData.seed)
        game.layers = puzzle.layers
        
        // Ensure all tiles have the completelyCovered property
        game.layers.forEach(layer => {
          layer.tiles.forEach(tile => {
            if (tile.completelyCovered === undefined) {
              tile.completelyCovered = !tile.visible
            }
          })
        })
        
        ;(window as any).dailySwapPool = puzzle.swapPool
        ;(window as any).dailyRng = puzzle.rng
        ;(window as any).dailyPuzzleSeed = dailyData.seed
        return
      } else {
        // If completion data is missing, reset the completion status
        dailyData.isCompleted = false
        saveDailyProgress(dailyData)
      }
    }

    // Try to load saved game state (for in-progress puzzles)
    const savedState = loadDailyGameState()
    
    if (savedState) {
      // Restore saved state
      game.currentWord = savedState.currentWord
      game.selectedTiles = savedState.selectedTiles
      game.usedWords = savedState.usedWords
      game.totalScore = savedState.totalScore
      game.layers = savedState.layers
      
      // Ensure all tiles have the completelyCovered property
      game.layers.forEach(layer => {
        layer.tiles.forEach(tile => {
          if (tile.completelyCovered === undefined) {
            tile.completelyCovered = !tile.visible
          }
        })
      })
      
      game.feedback = savedState.feedback
      game.feedbackColor = savedState.feedbackColor
      game.swapsRemaining = savedState.swapsRemaining
      game.swapMode = savedState.swapMode
      game.gameOver = savedState.gameOver
      game.finalScore = savedState.finalScore
      game.penaltyScore = savedState.penaltyScore
      game.showEndGameConfirmation = savedState.showEndGameConfirmation
      
      // Restore swap pool and RNG (we need to regenerate them)
      const puzzle = generateDailyPuzzle(dailyData.seed)
      ;(window as any).dailySwapPool = puzzle.swapPool
      ;(window as any).dailyRng = puzzle.rng
      ;(window as any).dailyPuzzleSeed = dailyData.seed
    } else {
      // No saved state, start fresh
      game.currentWord = ''
      game.selectedTiles = []
      game.usedWords = []
      game.totalScore = 0
      game.feedback = ''
      game.feedbackColor = 'black'
      game.swapsRemaining = 3 // Allow 3 swaps in daily puzzle
      game.swapMode = false
      game.gameOver = false
      game.finalScore = 0
      game.penaltyScore = 0
      game.showEndGameConfirmation = false

      // Generate daily puzzle layout and swap pool
      const puzzle = generateDailyPuzzle(dailyData.seed)
      game.layers = puzzle.layers
      
      // Set up the swap pool and seeded random for daily puzzle
      ;(window as any).dailySwapPool = puzzle.swapPool
      ;(window as any).dailyRng = puzzle.rng
      ;(window as any).dailyPuzzleSeed = dailyData.seed
    }
  }


  // Update best score when words are submitted
  function updateBestScore() {
    // Calculate current penalty based on remaining tiles
    const remainingTiles = game.layers.reduce((acc: any[], layer: any) => acc.concat(layer.tiles), [])
    const currentPenalty = remainingTiles.length * 3
    
    // Calculate current final score (words score - penalty for unused tiles)
    const currentFinalScore = game.totalScore - currentPenalty
    dailyData.bestScore = Math.max(dailyData.bestScore, currentFinalScore)
    
    // Note: We don't update longest word here - only at game completion
    // to ensure we keep the longest word across all attempts
    
    // Save to localStorage without calling updateTodayBestScore to avoid overwriting firstScore
    saveDailyProgress(dailyData)
  }

  // Update longest word length and word based on current used words
  function updateLongestWordLength() {
    if (game.usedWords.length > 0) {
      const longestWordData = game.usedWords.reduce((longest, current) => 
        current.word.length > longest.word.length ? current : longest
      )
      
      if (longestWordData.word.length > dailyData.longestWordLength) {
        dailyData.longestWordLength = longestWordData.word.length
        dailyData.longestWord = longestWordData.word
      }
    }
  }

  // Update all words found across all attempts (no duplicates)
  function updateAllWordsFound() {
    if (game.usedWords.length > 0) {
      const currentWords = game.usedWords.map(w => w.word)
      const existingWords = new Set(dailyData.allWordsFound)
      
      // Add new words that aren't already in the list
      currentWords.forEach(word => {
        if (!existingWords.has(word)) {
          dailyData.allWordsFound.push(word)
        }
      })
    }
  }

  // Handle daily puzzle end game
  function handleDailyEndGame() {
    // Call the regular confirmEndGame function
    confirmEndGame()
    
    // Update local data first
    dailyData.isCompleted = true
    if (dailyData.attempts === 0) {
      dailyData.firstScore = game.finalScore
    }
    dailyData.bestScore = Math.max(dailyData.bestScore, game.finalScore)
    dailyData.attempts += 1
    
    // Update all words found across all attempts
    updateAllWordsFound()
    
    // Update longest word if current attempt has a longer word
    if (game.usedWords.length > 0) {
      const longestWordData = game.usedWords.reduce((longest, current) => 
        current.word.length > longest.word.length ? current : longest
      )
      
      if (longestWordData.word.length > dailyData.longestWordLength) {
        dailyData.longestWordLength = longestWordData.word.length
        dailyData.longestWord = longestWordData.word
      }
    }
    
    // Set the completion flag for upcoming letters display
    ;(window as any).dailyPuzzleCompleted = true
    
    // Save the updated data to localStorage
    saveDailyProgress(dailyData)
    
    // Save completion data for banner display
    saveDailyCompletionData(dailyData, game)
    
    // Clear the saved game state since puzzle is completed
    clearDailyGameState()
  }

  // Reset daily puzzle for replay
  function resetDailyPuzzle() {
    // Clear the current game state
    resetDailyPuzzleForReplay()
    
    // Clear completion data
    localStorage.removeItem(`daily-completion-${dailyData.date}`)
    
    // Reset completion status to hide banner
    dailyData.isCompleted = false
    // Note: We don't reset longestWordLength, longestWord, or allWordsFound
    // as these should persist across replays to maintain cumulative stats
    
    // Keep the completion flag set to true for upcoming letters display
    ;(window as any).dailyPuzzleCompleted = true
    
    // Reset game state to fresh puzzle
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

    // Generate fresh puzzle
    const puzzle = generateDailyPuzzle(dailyData.seed)
    game.layers = puzzle.layers
    
    // Set up the swap pool and seeded random
    ;(window as any).dailySwapPool = puzzle.swapPool
    ;(window as any).dailyRng = puzzle.rng
    ;(window as any).dailyPuzzleSeed = dailyData.seed
  }

  // Format date for display
  function formatDate(dateString: string): string {
    // Parse the date string and create a local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month is 0-indexed
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Share daily puzzle stats
  async function shareStats() {
    const statsText =
`Quarry Daily Puzzle
${formatDate(dailyData.date)}
    
First Score: ${dailyData.firstScore}
Best Score: ${dailyData.bestScore}
Attempts: ${dailyData.attempts}
Longest Word: ${dailyData.longestWordLength} letters`

    try {
      await navigator.clipboard.writeText(statsText)
      setFeedback('Stats copied to clipboard!', 'green')
      
      // Change button text to "Copied" for 3 seconds
      shareButtonText = 'Copied'
      setTimeout(() => {
        shareButtonText = 'Share'
      }, 3000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      setFeedback('Failed to copy to clipboard', 'red')
    }
  }
</script>

<main class="daily-puzzle">
  <header class="daily-header">
    <div class="daily-info">
      <div class="date">{formatDate(dailyData.date)}</div>
    </div>
  </header>

  <!-- Completion Status -->
  {#if dailyData.isCompleted}
    <div class="completion-banner success">
      <div class="completion-content">
        <div class="completion-title">Daily puzzle completed!</div>
        <div class="score-breakdown">
          <div class="words-found">
            <div class="words-title">Words found this attempt</div>
            <div class="words-list">
              {#each game.usedWords as wordData (wordData.word)}
                <span class="word-pill">
                  {#if wordData.word === dailyData.longestWord}
                    {wordData.word} ({wordData.score}) ★
                  {:else}
                    {wordData.word} ({wordData.score})
                  {/if}
                </span>
              {/each}
              {#if game.penaltyScore > 0}
                <span class="penalty-pill">
                  UNUSED TILES (-{game.penaltyScore})
                </span>
              {/if}
            </div>
          </div>
          <div class="final-score">
            Final score: {game.finalScore}
            {#if game.finalScore === dailyData.bestScore && game.finalScore > 0}
              <span class="best-pill">best</span>
            {/if}
          </div>
        </div>
        <div class="score-stats-panel">
          <div class="stat-line">
            <span class="stat-label">First Score</span>
            <span class="stat-value">{dailyData.firstScore}</span>
          </div>
          <div class="stat-line">
            <span class="stat-label">Best Score</span>
            <span class="stat-value">{dailyData.bestScore}</span>
          </div>
          <div class="stat-line">
            <span class="stat-label">Longest Word</span>
            <span class="stat-value">
              {#if dailyData.longestWord}
                {dailyData.longestWord}
              {:else}
                <span class="no-word">No words yet</span>
              {/if}
            </span>
          </div>
          <div class="stat-line">
            <span class="stat-label">Attempts</span>
            <span class="stat-value">{dailyData.attempts}</span>
          </div>
        </div>
        <div class="completion-actions">
          <button onclick={shareStats} class="share-button">
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            {shareButtonText}
          </button>
          <button onclick={resetDailyPuzzle} class="reset-button">
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            Play Again
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Game Board -->
  {#if !game.gameOver}
    <div class="game-page">
      <Board />
      <WordArea />
      <Score />

      <div class="bottom-controls">
        <button
          onclick={handleDailyEndGame}
          disabled={game.gameOver}
          class="done-button"
        >
          <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
          Done
        </button>
      </div>
    </div>
  {/if}


  <!-- Confirmation Dialog -->
  {#if game.showEndGameConfirmation}
    <div
      class="confirmation-overlay"
      onclick={cancelEndGame}
      onkeydown={(e) => e.key === 'Escape' && cancelEndGame()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      tabindex="-1"
    >
      <div
        class="confirmation-dialog"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.key === 'Escape' && cancelEndGame()}
        role="alertdialog"
        tabindex="0"
      >
        <h3 id="dialog-title">End Daily Puzzle?</h3>
        <p>Are you sure you want to end the daily puzzle? You'll receive a penalty for any remaining letters.</p>

        <div class="confirmation-buttons">
          <button onclick={cancelEndGame} class="cancel-button">
            Cancel
          </button>
          <button onclick={handleDailyEndGame} class="confirm-button">
            End Puzzle
          </button>
        </div>
      </div>
    </div>
  {/if}

</main>

<style>
  .daily-puzzle {
    font-family: 'JetBrains Mono', monospace;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .daily-header {
    text-align: center;
    margin-bottom: 10px;
  }


  .daily-info {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .date {
    font-size: 1.2em;
    font-weight: bold;
  }


  .completion-banner {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 4px;
    border: 1px solid #dee2e6;
    text-align: center;
    max-width: 400px;
    margin: 0 auto;
  }

  .completion-banner.success {
    background-color: #f8f9fa;
    color: #333;
    border: 1px solid #dee2e6;
  }

  .completion-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .completion-title {
    font-size: 1.1em;
    font-weight: 600;
    color: #333;
  }

  .score-stats-panel {
    background-color: white;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 8px 16px;
    width: 100%;
  }

  .stat-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .stat-line:last-child {
    border-bottom: none;
  }

  .stat-label {
    font-size: 0.9em;
    color: #666;
    font-weight: 400;
  }

  .stat-value {
    font-size: 0.9em;
    font-weight: 600;
    color: #333;
  }

  .stat-value .no-word {
    color: #999;
    font-style: italic;
    font-weight: 400;
  }

  .score-breakdown {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    width: 100%;
    background-color: white;
  }

  .words-title {
    font-size: 0.9em;
    color: #666;
    margin-bottom: 8px;
    white-space: nowrap;
    text-align: center;
  }

  .words-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: flex-start;
  }

  .word-pill {
    background-color: #f0f0f0;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
  }

  .penalty-pill {
    background-color: #f8d7da;
    color: #dc3545;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
  }

  .final-score {
    font-weight: bold;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .best-pill {
    background-color: #d4edda;
    color: #155724;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .completion-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .share-button {
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    color: #333;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.1s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .share-button:hover {
    background-color: #f0f0f0;
  }

  .reset-button {
    padding: 8px 16px;
    border: 1px solid #007bff;
    border-radius: 4px;
    background-color: #007bff;
    color: white;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.1s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .reset-button:hover {
    background-color: #0056b3;
  }

  .game-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
  }

  .bottom-controls {
    margin-top: auto;
  }

  .done-button {
    padding: 8px 16px;
    border: 1px solid #dc3545;
    border-radius: 4px;
    background-color: #dc3545;
    color: white;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    transition: background-color 0.1s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .done-button:hover:not(:disabled) {
    background-color: #c82333;
  }

  /* Confirmation Dialog Styles */
  .confirmation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .confirmation-dialog {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    width: 90%;
    text-align: center;
  }

  .confirmation-dialog h3 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 1.3em;
  }

  .confirmation-dialog p {
    margin: 0 0 25px 0;
    color: #666;
    line-height: 1.4;
  }

  .confirmation-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
  }

  .cancel-button,
  .confirm-button {
    padding: 10px 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    color: #333;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    transition: background-color 0.1s ease;
  }

  .cancel-button:hover {
    background-color: #f0f0f0;
  }

  .confirm-button {
    background-color: #dc3545;
    color: white;
    border-color: #dc3545;
  }

  .confirm-button:hover {
    background-color: #c82333;
  }

  .button-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  /* Mobile responsive styles */
  @media (max-width: 480px) {
    .score-stats-panel {
      padding: 12px;
    }

    .stat-line {
      padding: 6px 0;
    }

    .stat-label {
      font-size: 0.85em;
    }

    .stat-value {
      font-size: 0.85em;
    }
  }
</style>