<script lang="ts">
  import { onMount } from 'svelte'
  import { game, initializeGame, setDailyPuzzleMode, confirmEndGame } from '../lib/state.svelte'
  import { getDailyPuzzleData, getDailyPuzzleDataForDate, loadDailyCompletionData, generateDailyPuzzle, generateDailySeed, getTodayDate, saveDailyProgress, saveDailyCompletionData } from '../lib/daily-puzzle'
  import Board from './Board.svelte'
  import WordArea from './WordArea.svelte'
  import Score from './Score.svelte'

  let selectedDate = $state('')
  let availableDates = $state<string[]>([])
  let selectedPuzzleData = $state<any>(null)
  let selectedCompletionData = $state<any>(null)
  let isReplaying = $state(false)

  onMount(() => {
    loadAvailableDates()
    loadWordList()
  })

  // Track all words found when playing archive puzzles (for real-time unique word count)
  $effect(() => {
    if (isReplaying && game.usedWords.length > 0 && selectedPuzzleData) {
      // Update all words found (no duplicates) - only add new words
      const currentWords = game.usedWords.map(w => w.word)
      const existingWords = new Set(selectedPuzzleData.allWordsFound)
      
      let hasNewWords = false
      currentWords.forEach(word => {
        if (!existingWords.has(word)) {
          selectedPuzzleData.allWordsFound.push(word)
          hasNewWords = true
        }
      })

      // Save the updated data to localStorage if we added new words
      if (hasNewWords) {
        saveDailyProgress(selectedPuzzleData)
      }
    }
  })


  function loadWordList() {
    // Load word list if not already loaded
    if (game.wordList.size === 0) {
      fetch('./wordlist.txt')
        .then(response => response.text())
        .then(data => {
          game.wordList = new Set(data.split('\n').map(word => word.trim().toUpperCase()))
          console.log('Wordlist loaded for archive:', game.wordList.size, 'words')
        })
        .catch(err => console.error('Error loading wordlist:', err))
    }
  }

  // Helper function to get a date string in YYYY-MM-DD format (local time)
  function getLocalDateString(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function loadAvailableDates() {
    const dates: string[] = []
    const today = new Date()
    
    // Generate dates for the last 30 days using local time, starting from yesterday
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = getLocalDateString(date)
      dates.push(dateString)
    }
    
    availableDates = dates
    if (dates.length > 0) {
      selectedDate = dates[0] // Default to most recent (yesterday)
      loadSelectedPuzzle()
    }
  }

  function loadSelectedPuzzle() {
    if (!selectedDate) return
    
    // Always generate the same seed for this date (consistent with daily puzzle)
    const seed = generateDailySeed(selectedDate)
    
    // Get saved data for this historical puzzle
    const dailyData = getDailyPuzzleDataForDate(selectedDate)
    
    if (dailyData) {
      // Use existing saved data (but ensure seed is correct)
      selectedPuzzleData = {
        ...dailyData,
        seed: seed // Ensure we use the correct seed
      }
      
      // Try to load completion data if available
      try {
        const completionData = loadDailyCompletionData(selectedDate)
        selectedCompletionData = completionData
      } catch (e) {
        selectedCompletionData = null
      }
    } else {
      // Create fresh puzzle data for this date (but with consistent seed)
      selectedPuzzleData = {
        date: selectedDate,
        seed: seed,
        isCompleted: false,
        firstScore: 0,
        bestScore: 0,
        attempts: 0,
        longestWordLength: 0,
        longestWord: '',
        allWordsFound: []
      }
      selectedCompletionData = null
    }
  }

  function replayPuzzle() {
    if (!selectedPuzzleData) return
    
    isReplaying = true
    setDailyPuzzleMode(true)
    
    // Ensure wordlist is loaded
    loadWordList()
    
    // Reset game state first
    game.currentWord = ''
    game.selectedTiles = []
    game.usedWords = []
    game.totalScore = 0
    game.finalScore = 0
    game.penaltyScore = 0
    game.gameOver = false
    game.showEndGameConfirmation = false
    game.feedback = ''
    game.feedbackColor = 'black'
    game.swapsRemaining = 3
    game.swapMode = false
    
    // Generate the puzzle with the selected seed
    const puzzle = generateDailyPuzzle(selectedPuzzleData.seed)
    game.layers = puzzle.layers
    ;(window as any).dailySwapPool = puzzle.swapPool
    ;(window as any).dailyRng = puzzle.rng
  }

  function stopReplay() {
    isReplaying = false
    setDailyPuzzleMode(false)
    initializeGame()
  }

  function endArchiveGame() {
    // Call the regular confirmEndGame function
    confirmEndGame()
    
    // Update archive puzzle data with current progress
    if (selectedPuzzleData) {
      // Mark as completed
      selectedPuzzleData.isCompleted = true
      
      // Set first score if this is the first attempt
      if (selectedPuzzleData.attempts === 0) {
        selectedPuzzleData.firstScore = game.finalScore
      }
      
      // Update best score if current score is higher
      selectedPuzzleData.bestScore = Math.max(selectedPuzzleData.bestScore, game.finalScore)
      
      // Increment attempts
      selectedPuzzleData.attempts += 1
      
      // Update longest word if current attempt has a longer word
      if (game.usedWords.length > 0) {
        const longestWordData = game.usedWords.reduce((longest, current) => 
          current.word.length > longest.word.length ? current : longest
        )
        
        if (longestWordData.word.length > selectedPuzzleData.longestWordLength) {
          selectedPuzzleData.longestWordLength = longestWordData.word.length
          selectedPuzzleData.longestWord = longestWordData.word
        }
      }
      
      // Update all words found (no duplicates)
      if (game.usedWords.length > 0) {
        const currentWords = game.usedWords.map(w => w.word)
        const existingWords = new Set(selectedPuzzleData.allWordsFound)
        
        currentWords.forEach(word => {
          if (!existingWords.has(word)) {
            selectedPuzzleData.allWordsFound.push(word)
          }
        })
      }
      
      // Save the updated data
      saveDailyProgress(selectedPuzzleData)
      
      // Save completion data for banner display
      saveDailyCompletionData(selectedPuzzleData, game)
    }
  }

  function formatDate(dateString: string) {
    // Parse YYYY-MM-DD as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month is 0-indexed
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  function getCompletionStatus(dateString: string) {
    const dailyData = getDailyPuzzleDataForDate(dateString)
    return dailyData?.isCompleted || false
  }
</script>

<div class="archive-page">
  {#if !isReplaying}

    <div class="date-selector">
      <label for="date-select">Select a date:</label>
        <select id="date-select" bind:value={selectedDate} onchange={loadSelectedPuzzle}>
        {#each availableDates as date}
          <option value={date}>
            {formatDate(date)} {getCompletionStatus(date) ? '✓' : ''}
          </option>
        {/each}
      </select>
    </div>

    {#if selectedPuzzleData}
      <div class="puzzle-info">
        <div class="puzzle-stats">
          <div class="stat-item">
            <span class="stat-label">Date</span>
            <span class="stat-value">{formatDate(selectedDate)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Status</span>
            <span class="stat-value">
              {selectedPuzzleData.isCompleted ? 'Completed ✓' : 'Not completed'}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">First Score</span>
            <span class="stat-value">{selectedPuzzleData.firstScore || 0}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Best Score</span>
            <span class="stat-value">{selectedPuzzleData.bestScore || 0}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Attempts</span>
            <span class="stat-value">{selectedPuzzleData.attempts || 0}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Unique Words</span>
            <span class="stat-value">{selectedPuzzleData.allWordsFound?.length || 0}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Longest Word</span>
            <span class="stat-value">
              {#if selectedPuzzleData.longestWord}
                {selectedPuzzleData.longestWord}
              {:else}
                <span class="no-word">No words yet</span>
              {/if}
            </span>
          </div>
        </div>
        
        <button class="replay-button" onclick={replayPuzzle}>
          <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M3 21v-5h5"></path>
          </svg>
          {selectedPuzzleData.isCompleted ? 'Play Again' : 'Play Puzzle'}
        </button>
      </div>
    {/if}
  {:else}
    <div class="replay-mode">
      <div class="replay-header">
        <div class="date">{formatDate(selectedDate)}</div>
      </div>
      
      <!-- Completion Banner -->
      {#if selectedPuzzleData.isCompleted && game.gameOver}
        <div class="completion-banner success">
          <div class="completion-content">
            <div class="completion-title">Puzzle completed!</div>
            <div class="score-breakdown">
              <div class="words-found">
                <div class="words-title">Words found this attempt</div>
                <div class="words-list">
                  {#each game.usedWords as wordData (wordData.word)}
                    <span class="word-pill">
                      {#if wordData.word === selectedPuzzleData.longestWord}
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
                {#if game.finalScore === selectedPuzzleData.bestScore && game.finalScore > 0}
                  <span class="best-pill">best</span>
                {/if}
              </div>
            </div>
            <div class="score-stats-panel">
              <div class="stat-line">
                <span class="stat-label">First Score</span>
                <span class="stat-value">{selectedPuzzleData.firstScore}</span>
              </div>
              <div class="stat-line">
                <span class="stat-label">Best Score</span>
                <span class="stat-value">{selectedPuzzleData.bestScore}</span>
              </div>
              <div class="stat-line">
                <span class="stat-label">Longest Word</span>
                <span class="stat-value">
                  {#if selectedPuzzleData.longestWord}
                    {selectedPuzzleData.longestWord}
                  {:else}
                    <span class="no-word">No words yet</span>
                  {/if}
                </span>
              </div>
              <div class="stat-line">
                <span class="stat-label">Attempts</span>
                <span class="stat-value">{selectedPuzzleData.attempts}</span>
              </div>
            </div>
            <div class="completion-actions">
              <button onclick={stopReplay} class="back-button">
                <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 12H5"></path>
                  <path d="M12 19l-7-7 7-7"></path>
                </svg>
                Back to Archive
              </button>
              <button onclick={replayPuzzle} class="reset-button">
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
      {:else}
        <div class="game-container">
          <Board />
          <div class="game-controls">
            <WordArea />
            <Score />
            <button class="end-game-button" onclick={endArchiveGame}>
              End Game
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .archive-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }


  .date-selector {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .date-selector label {
    font-weight: bold;
    color: #333;
  }

  .date-selector select {
    padding: 10px 15px;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    background: white;
    cursor: pointer;
    min-width: 250px;
    text-align: center;
  }

  .date-selector select:focus {
    outline: none;
    border-color: #007bff;
  }

  .puzzle-info {
    width: 100%;
    background: white;
    border-radius: 4px;
    padding: 20px;
    border: 1px solid #e9ecef;
    box-sizing: border-box;
  }


  .puzzle-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .stat-item:last-child {
    border-bottom: none;
  }

  .stat-label {
    color: #555;
  }

  .stat-value {
    color: #333;
  }

  .replay-button {
    width: 100%;
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
    justify-content: center;
    gap: 8px;
  }

  .replay-button:hover {
    background-color: #0056b3;
  }

  .button-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
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
    font-weight: 500;
    text-transform: uppercase;
  }

  .completion-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
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
    justify-content: center;
    gap: 8px;
  }

  .reset-button:hover {
    background-color: #0056b3;
  }

  .back-button {
    padding: 8px 16px;
    border: 1px solid #ddd;
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
    justify-content: center;
    gap: 8px;
  }

  .back-button:hover {
    background-color: #f8f9fa;
  }

  .stat-value .no-word {
    color: #999;
    font-style: italic;
    font-weight: 400;
  }

  .replay-mode {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .replay-header {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 600px;
  }


  .date {
    font-size: 1.2em;
    font-weight: bold;
    text-align: center;
  }


  .game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
  }

  .game-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    width: 100%;
  }

  .end-game-button {
    padding: 10px 20px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .end-game-button:hover {
    background: #c82333;
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

  .score-breakdown {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background-color: white;
    width: 100%;
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
  }

  .stat-value {
    font-size: 0.9em;
    font-weight: 600;
    color: #333;
  }

  @media (max-width: 768px) {
    .archive-page {
      padding: 0 16px;
    }

    .puzzle-info {
      padding: 16px;
    }

    .date-selector select {
      min-width: 200px;
      font-size: 14px;
    }

    .replay-header {
      flex-direction: column;
      gap: 10px;
      text-align: center;
    }

    .replay-header .date {
      font-size: 1.1rem;
    }
  }

  @media (max-width: 480px) {
    .archive-page {
      padding: 0 8px;
    }

    .puzzle-info {
      padding: 12px;
    }

    .date-selector select {
      min-width: 180px;
      font-size: 13px;
    }

    .stat-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

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
