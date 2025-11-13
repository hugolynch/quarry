<script lang="ts">
  import { onMount } from 'svelte'
  import { game, initializeGame, confirmEndGame, showEndGameConfirmation, cancelEndGame, setDailyPuzzleMode, setGameMode, getDailyPuzzleEndGameCallback } from './lib/state.svelte'
  import { initializeFullscreen, onFullscreenChange, getFullscreenState, enterFullscreenIfPWA } from './lib/fullscreen'
  import Board from './components/Board.svelte'
  import MiniBoard from './components/MiniBoard.svelte'
  import PyramidBoard from './components/PyramidBoard.svelte'
  import FreePlayDropdown from './components/FreePlayDropdown.svelte'
  import WordArea from './components/WordArea.svelte'
  import Score from './components/Score.svelte'
  import DailyPuzzle from './components/DailyPuzzle.svelte'
  import Instructions from './components/Instructions.svelte'
  import Archive from './components/Archive.svelte'
  import InstallPrompt from './components/InstallPrompt.svelte'
  const logo = './logo.svg'

  // Navigation state
  let currentPage = $state<'main' | 'mini' | 'pyramid' | 'daily' | 'instructions' | 'archive'>('main')
  
  // Fullscreen state
  let fullscreenState = $state(getFullscreenState())

  onMount(() => {
    // Initialize fullscreen support
    initializeFullscreen()
    
    // Subscribe to fullscreen changes
    const unsubscribe = onFullscreenChange((state) => {
      fullscreenState = state
    })
    
    // Auto-enter fullscreen if running as installed PWA
    enterFullscreenIfPWA()
    
    // Cleanup on unmount
    return unsubscribe
  })
  
  onMount(() => {
    // Restore page state from localStorage
    const savedPage = localStorage.getItem('quarry-current-page')
    if (savedPage && ['main', 'mini', 'pyramid', 'daily', 'instructions', 'archive'].includes(savedPage)) {
      currentPage = savedPage as 'main' | 'mini' | 'pyramid' | 'daily' | 'instructions' | 'archive'
    }

    // Set to regular game mode (not Daily Puzzle) unless on daily page
    setDailyPuzzleMode(currentPage === 'daily')
    
    // Set game mode based on current page
    if (currentPage === 'mini') {
      setGameMode('mini')
    } else if (currentPage === 'pyramid') {
      setGameMode('pyramid')
    } else if (currentPage === 'main') {
      setGameMode('main')
    }
    
    // Only initialize game if on main, mini, or pyramid page
    if (currentPage === 'main' || currentPage === 'mini' || currentPage === 'pyramid') {
      initializeGame()
    }
  })

  function goToMainGame() {
    currentPage = 'main'
    localStorage.setItem('quarry-current-page', 'main')
    // Set to regular game mode (not Daily Puzzle)
    setDailyPuzzleMode(false)
    setGameMode('main')
    // Reset game state and generate new puzzle for free play
    initializeGame()
  }

  function goToMini() {
    currentPage = 'mini'
    localStorage.setItem('quarry-current-page', 'mini')
    // Set to regular game mode (not Daily Puzzle)
    setDailyPuzzleMode(false)
    setGameMode('mini')
    // Reset game state and generate new puzzle for mini mode
    initializeGame()
  }

  function goToPyramid() {
    currentPage = 'pyramid'
    localStorage.setItem('quarry-current-page', 'pyramid')
    // Set to regular game mode (not Daily Puzzle)
    setDailyPuzzleMode(false)
    setGameMode('pyramid')
    // Reset game state and generate new puzzle for pyramid mode
    initializeGame()
  }

  function handleFreePlayModeSelect(event: CustomEvent<'main' | 'mini' | 'pyramid'>) {
    const mode = event.detail
    currentPage = mode
    localStorage.setItem('quarry-current-page', mode)
    // Set to regular game mode (not Daily Puzzle)
    setDailyPuzzleMode(false)
    setGameMode(mode)
    // Reset game state and generate new puzzle for selected mode
    initializeGame()
  }

  function goToDailyPuzzle() {
    currentPage = 'daily'
    localStorage.setItem('quarry-current-page', 'daily')
  }

  function goToInstructions() {
    currentPage = 'instructions'
    localStorage.setItem('quarry-current-page', 'instructions')
  }

  function goToArchive() {
    currentPage = 'archive'
    localStorage.setItem('quarry-current-page', 'archive')
  }

</script>

<main>
  <img src={logo} alt="Quarry Logo" />
  
  <!-- Navigation -->
  <nav class="page-nav">
    <FreePlayDropdown 
      currentMode={currentPage === 'main' ? 'main' : currentPage === 'mini' ? 'mini' : currentPage === 'pyramid' ? 'pyramid' : 'main'}
      isActive={currentPage === 'main' || currentPage === 'mini' || currentPage === 'pyramid'}
      on:modeSelect={handleFreePlayModeSelect}
    />
    <button 
      class="nav-button" 
      class:active={currentPage === 'daily'}
      onclick={goToDailyPuzzle}
    >
      Daily Puzzle
    </button>
    <button 
      class="nav-button" 
      class:active={currentPage === 'archive'}
      onclick={goToArchive}
    >
      Archive
    </button>
    <button 
      class="nav-button" 
      class:active={currentPage === 'instructions'}
      onclick={goToInstructions}
    >
      ?
    </button>
  </nav>

  <!-- Main Game Page -->
  {#if currentPage === 'main'}
    <div class="game-page">
      <Board />
      <WordArea />
      <Score />
      
      <div class="bottom-controls">
        {#if game.gameOver}
          <button 
            onclick={goToMainGame} 
            class="new-game-button"
          >
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            New Game
          </button>
        {:else}
          <button 
            onclick={showEndGameConfirmation} 
            class="done-button"
          >
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
            End Game
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Mini Game Page -->
  {#if currentPage === 'mini'}
    <div class="game-page">
      <MiniBoard />
      <WordArea />
      <Score />
      
      <div class="bottom-controls">
        {#if game.gameOver}
          <button 
            onclick={goToMini} 
            class="new-game-button"
          >
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            New Game
          </button>
        {:else}
          <button 
            onclick={showEndGameConfirmation} 
            class="done-button"
          >
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
            End Game
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Pyramid Game Page -->
  {#if currentPage === 'pyramid'}
    <div class="game-page">
      <PyramidBoard />
      <WordArea />
      <Score />
      
      <div class="bottom-controls">
        {#if game.gameOver}
          <button 
            onclick={goToPyramid} 
            class="new-game-button"
          >
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            New Game
          </button>
        {:else}
          <button 
            onclick={showEndGameConfirmation} 
            class="done-button"
          >
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
            End Game
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Daily Puzzle Page -->
  {#if currentPage === 'daily'}
    <DailyPuzzle />
  {/if}

  <!-- Instructions Page -->
  {#if currentPage === 'instructions'}
    <Instructions />
  {/if}

  <!-- Archive Page -->
  {#if currentPage === 'archive'}
    <Archive />
  {/if}

  <!-- Install Prompt -->
  <InstallPrompt />

  <!-- Confirmation Dialog (only show for non-daily puzzle pages) -->
  {#if game.showEndGameConfirmation && currentPage !== 'daily'}
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
        <h3 id="dialog-title">End Game?</h3>
        <p>Are you sure you want to end the game? You'll receive a penalty for any remaining tiles.</p>

        <div class="confirmation-buttons">
          <button onclick={cancelEndGame} class="cancel-button">
            Cancel
          </button>
          <button onclick={() => {
            // Use Daily Puzzle callback if in daily puzzle mode, otherwise use regular confirmEndGame
            const dailyCallback = getDailyPuzzleEndGameCallback()
            if (game.isDailyPuzzle && dailyCallback) {
              dailyCallback()
            } else {
              confirmEndGame()
            }
          }} class="confirm-button">
            End Game
          </button>
        </div>
      </div>
    </div>
  {/if}

</main>

<style>
  main {
    font-family: 'JetBrains Mono', monospace;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 20px;
    box-sizing: border-box;
  }

  img {
    height: 60px;
    max-width: 100%;
    width: auto;
    display: block;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    main {
      padding: 16px;
    }
    
    img {
      height: 55px;
    }
  }

  @media (max-width: 480px) {
    main {
      padding: 12px;
    }
    
    img {
      height: 50px;
    }
  }

  @media (max-width: 360px) {
    main {
      padding: 8px;
    }
    
    img {
      height: 45px;
    }
  }

  @media (max-width: 320px) {
    main {
      padding: 6px;
    }
    
    img {
      height: 40px;
    }
  }

  .page-nav {
    display: flex;
    gap: 10px;
  }

  .nav-button {
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    transition: background-color 0.1s ease;
  }

  .nav-button:hover:not(:disabled) {
    background-color: #f0f0f0;
  }

  .nav-button.active {
    background-color: #007bff;
    color: white;
    border-color: #0056b3;
  }

  .nav-button.active:hover {
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

  .done-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .new-game-button {
    padding: 8px 16px;
    border: 1px solid #007bff;
    border-radius: 4px;
    background-color: #007bff;
    color: white;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    transition: background-color 0.1s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .new-game-button:hover {
    background-color: #0056b3;
  }

  .button-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
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

</style>
