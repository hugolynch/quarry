<script lang="ts">
  import { onMount } from 'svelte'
  import { dndzone } from 'svelte-dnd-action'

  // Tile state examples
  let selectedTiles = $state(['A', 'B', 'C'])
  let wordTiles = $state(['C', 'A', 'T'])
  let isAnimating = $state(false)
  
  // Demo word area state
  let demoSelectedTiles = $state<Array<{id: string, letter: string, selected: boolean, coords: any[], layer: number, position: {x: number, y: number}}>>([
    { id: 'demo-S', letter: 'S', selected: true, coords: [], layer: 0, position: { x: 0, y: 0 } },
    { id: 'demo-T', letter: 'T', selected: true, coords: [], layer: 0, position: { x: 0, y: 0 } },
    { id: 'demo-C', letter: 'C', selected: true, coords: [], layer: 0, position: { x: 0, y: 0 } },
    { id: 'demo-A', letter: 'A', selected: true, coords: [], layer: 0, position: { x: 0, y: 0 } }
  ])
  let demoCurrentWord = $state('STCA')
  let demoFeedback = $state('')
  let demoFeedbackColor = $state('black')

  // Demo state for temp-selectable tiles
  let tempDemoSelectedTiles = $state<string[]>([])
  
  // Functions for temp-selectable demo
  function toggleDemoTile(letter: string) {
    if (tempDemoSelectedTiles.includes(letter)) {
      tempDemoSelectedTiles = tempDemoSelectedTiles.filter(t => t !== letter)
    } else {
      tempDemoSelectedTiles = [...tempDemoSelectedTiles, letter]
    }
  }
  
  function isATempSelectable() {
    // A becomes temp-selectable when S, C, T are all selected
    return tempDemoSelectedTiles.includes('S') && 
           tempDemoSelectedTiles.includes('C') && 
           tempDemoSelectedTiles.includes('T')
  }

  // Animate word rearrangement
  function animateRearrange() {
    isAnimating = true
    setTimeout(() => {
      wordTiles = ['T', 'A', 'C']
      setTimeout(() => {
        wordTiles = ['A', 'C', 'T']
        setTimeout(() => {
          wordTiles = ['C', 'A', 'T']
          isAnimating = false
        }, 1000)
      }, 1000)
    }, 1000)
  }

  // Demo word area functions
  function handleDndConsider(e: CustomEvent) {
    // Update the selected tiles order when drag is considered
    demoSelectedTiles = e.detail.items
    // Update current word to reflect new order
    demoCurrentWord = demoSelectedTiles.map(tile => tile.letter).join('')
    demoFeedback = `Dragging... Current word: ${demoCurrentWord}`
    demoFeedbackColor = 'blue'
  }

  function handleDndFinalize(e: CustomEvent) {
    // Finalize the reorder
    demoSelectedTiles = e.detail.items
    // Update current word to reflect new order
    demoCurrentWord = demoSelectedTiles.map(tile => tile.letter).join('')
    demoFeedback = `Reordered! Current word: ${demoCurrentWord}`
    demoFeedbackColor = 'green'
  }

  function removeLetterFromDemo(index: number) {
    demoSelectedTiles = demoSelectedTiles.filter((_, i) => i !== index)
    demoCurrentWord = demoSelectedTiles.map(tile => tile.letter).join('')
    demoFeedback = demoCurrentWord ? `Removed letter. Current word: ${demoCurrentWord}` : 'Word cleared'
    demoFeedbackColor = 'blue'
  }

  function clearDemoWord() {
    demoSelectedTiles = [
      { id: 'demo-S', letter: 'S', selected: true, coords: [], layer: 0, position: { x: 0, y: 0 } },
      { id: 'demo-T', letter: 'T', selected: true, coords: [], layer: 0, position: { x: 0, y: 0 } },
      { id: 'demo-C', letter: 'C', selected: true, coords: [], layer: 0, position: { x: 0, y: 0 } },
      { id: 'demo-A', letter: 'A', selected: true, coords: [], layer: 0, position: { x: 0, y: 0 } }
    ]
    demoCurrentWord = 'STCA'
    demoFeedback = 'Reset to STCA. Try dragging the letters to rearrange them into a valid word!'
    demoFeedbackColor = 'blue'
  }

  function submitDemoWord() {
    if (demoCurrentWord.length === 0) {
      demoFeedback = 'No word to submit!'
      demoFeedbackColor = 'red'
      return
    }

    // Simple word validation for demo
    const validWords = ['CAT', 'CATS', 'ACT', 'ACTS', 'CAST', 'SAT', 'SAC', 'TAS', 'SCAT', 'AS', 'AT', 'TA']
    const upperWord = demoCurrentWord.toUpperCase()
    
    if (validWords.includes(upperWord)) {
      demoFeedback = `"${upperWord}" is a valid word! Score: ${demoCurrentWord.length} points`
      demoFeedbackColor = 'green'
    } else {
      demoFeedback = `"${upperWord}" is not a valid word. Try ACTS, CAST, CATS, SCAT`
      demoFeedbackColor = 'red'
    }
  }

  onMount(() => {
    // Component mounted
  })
</script>

<div class="instructions-page">
  <div class="instructions-content">
    <h1>How to play Quarry!</h1>
    
    <p>Quarry is a 3D word-building puzzle game where you dig through layers of letter tiles to create words and score points.</p>

    <h2>How to Play</h2>

    <h3>The Goal</h3>
    <p>Form as many valid English words as possible by selecting letter tiles from a stacked board.</p>

    <h3>The Board</h3>
    <p>The game board has three layers stacked on top of each other:</p>
    <ul>
      <li><strong>Top layer (4×4)</strong>: Always visible and ready to use</li>
      <li><strong>Middle layer (3×3)</strong>: Hidden until you remove tiles above them</li>
      <li><strong>Bottom layer (2×2)</strong>: Hidden until you remove tiles above them</li>
    </ul>

    <div class="visual-example">      
      <div class="board-layout-demo">
        <div class="layer-demo">
          <div class="demo-grid top-layer-demo">
            <div class="demo-tile-small">L</div>
            <div class="demo-tile-small">O</div>
            <div class="demo-tile-small">I</div>
            <div class="demo-tile-small">A</div>
            <div class="demo-tile-small">E</div>
            <div class="demo-tile-small">S</div>
            <div class="demo-tile-small">B</div>
            <div class="demo-tile-small">O</div>
            <div class="demo-tile-small">R</div>
            <div class="demo-tile-small">U</div>
            <div class="demo-tile-small">G</div>
            <div class="demo-tile-small">Z</div>
            <div class="demo-tile-small">J</div>
            <div class="demo-tile-small">T</div>
            <div class="demo-tile-small">T</div>
            <div class="demo-tile-small">A</div>
          </div>
        </div>
        
        <div class="layer-demo">
          <div class="demo-grid middle-layer-demo">
            <div class="demo-tile-small">I</div>
            <div class="demo-tile-small">R</div>
            <div class="demo-tile-small">E</div>
            <div class="demo-tile-small">C</div>
            <div class="demo-tile-small">M</div>
            <div class="demo-tile-small">I</div>
            <div class="demo-tile-small">H</div>
            <div class="demo-tile-small">G</div>
            <div class="demo-tile-small">K</div>
          </div>
        </div>
        
        <div class="layer-demo">
          <div class="demo-grid bottom-layer-demo">
            <div class="demo-tile-small">E</div>
            <div class="demo-tile-small">L</div>
            <div class="demo-tile-small">O</div>
            <div class="demo-tile-small">D</div>
          </div>
        </div>
      </div>
    </div>
    
    <h2>Basic Gameplay</h2>

    <h3>1. Building Words</h3>
    <ul>
      <li><strong>Click tiles</strong> to add letters to your current word</li>
      <li><strong>Click selected tiles again</strong> (in the word area) to remove them from your word</li>
      <li><strong>Click "Submit"</strong> when you're ready to submit your word</li>
      <li><strong>Real-time feedback</strong>: As you build your word, you'll see the potential score update in real-time. The score turns <span style="color: #579E47; font-weight: bold;">green</span> for valid words and <span style="color: #dc3545; font-weight: bold;">red</span> for invalid words</li>
    </ul>

    <h3>2. Tile States</h3>
    <div class="tile-demo">
        <div class="tile-pair">
          <div class="tile beige">A</div>
          <span class="tile-label">Selectable</span>
        </div>
        <div class="tile-pair">
          <div class="tile green">B</div>
          <span class="tile-label">Currently selected</span>
        </div>
        <div class="tile-pair">
          <div class="tile orange">C</div>
          <span class="tile-label">Visible but not yet selectable (need to clear covering tiles first)</span>
        </div>
        <div class="tile-pair">
          <div class="tile yellow">D</div>
          <span class="tile-label">Temporarily selectable (see Advanced Rules below)</span>
        </div>
      </div>

    <h2>Advanced Rules</h2>

    <h3>Layer Unlocking</h3>
    <ul>
      <li><strong>Visibility</strong>: Tiles become visible when ANY tile above them is removed</li>
      <li><strong>Selectability</strong>: Tiles become selectable only when ALL 4 tiles covering them are removed</li>
    </ul>

    <h3>Temporary Selection</h3>
    <p>Sometimes you'll see blue tiles that you can select even if they're not normally available. This happens when:</p>
    <ul>
      <li>The tile is visible but not yet selectable</li>
      <li>ALL tiles covering it are currently selected</li>
      <li>You must use ALL covering tiles in the same word</li>
    </ul>

    <div class="visual-example">
      <p class="demo-feedback">Click the S, C and T tiles. When all three are selected, the A tile below becomes temporarily selectable (blue). If you unselect any of the S, C, or T tiles, the A tile will no longer be selectable.</p>
      
      <div class="temp-selectable-demo">
        <div class="demo-board">
          <!-- Top layer (2x2) with S, C, T tiles (one missing) -->
          <div class="demo-layer top-layer">
            <div 
              class="demo-tile available" 
              class:selected={tempDemoSelectedTiles.includes('S')}
              onclick={() => toggleDemoTile('S')}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleDemoTile('S')
                }
              }}
              role="button"
              tabindex="0"
              data-letter="S"
            >
              <div class="corner top-left">S</div>
              <div class="corner top-right">S</div>
              <div class="corner bottom-left">S</div>
              <div class="corner bottom-right">S</div>
            </div>
            <div 
              class="demo-tile available" 
              class:selected={tempDemoSelectedTiles.includes('C')}
              onclick={() => toggleDemoTile('C')}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleDemoTile('C')
                }
              }}
              role="button"
              tabindex="0"
              data-letter="C"
            >
              <div class="corner top-left">C</div>
              <div class="corner top-right">C</div>
              <div class="corner bottom-left">C</div>
              <div class="corner bottom-right">C</div>
            </div>
            <div 
              class="demo-tile available" 
              class:selected={tempDemoSelectedTiles.includes('T')}
              onclick={() => toggleDemoTile('T')}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleDemoTile('T')
                }
              }}
              role="button"
              tabindex="0"
              data-letter="T"
            >
              <div class="corner top-left">T</div>
              <div class="corner top-right">T</div>
              <div class="corner bottom-left">T</div>
              <div class="corner bottom-right">T</div>
            </div>
            <div class="demo-tile empty"></div>
          </div>
          
          <!-- Bottom layer (1x1) - A tile becomes temp-selectable when all 3 above are selected -->
          <div class="demo-layer bottom-layer">
            <div 
              class="demo-tile" 
              class:unavailable={!isATempSelectable()}
              class:temp-selectable={isATempSelectable()}
              class:selected={tempDemoSelectedTiles.includes('A')}
              onclick={() => toggleDemoTile('A')}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleDemoTile('A')
                }
              }}
              role="button"
              tabindex="0"
              data-letter="A"
            >
              <div class="corner top-left">A</div>
              <div class="corner top-right">A</div>
              <div class="corner bottom-left">A</div>
              <div class="corner bottom-right">A</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <h3>Reordering Letters</h3>
    <p>After selecting tiles, you can drag them to rearrange their order in your word. This means you can use temporarily selectable tiles (blue) out of order. The order of the letters in your word doesn't matter - you can arrange the letters however you want!"</p>
    
    <div class="word-building-demo">
  
        <!-- Word area with drag and drop -->
        <div class="demo-word-area">
          <div class="word-area-row">
            <div 
              class="word-tiles-container"
              use:dndzone={{ items: demoSelectedTiles, flipDurationMs: 200 }}
              onconsider={handleDndConsider}
              onfinalize={handleDndFinalize}
            >
              {#each demoSelectedTiles as tile, index (tile.id)}
                <div 
                  class="word-tile" 
                  onclick={() => removeLetterFromDemo(index)}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      removeLetterFromDemo(index)
                    }
                  }}
                >
                  {tile.letter}
                </div>
              {/each}
            </div>
          </div>
          
          <p class="demo-feedback" style="color: {demoFeedbackColor}">
            {demoFeedback || 'Drag the letters to rearrange them into a valid word'}
          </p>
          
          <div class="demo-controls">
            <button onclick={clearDemoWord}>
              <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M3 21v-5h5"></path>
              </svg>
              Reset
            </button>
            <button onclick={submitDemoWord}>
              <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              Submit
            </button>
          </div>
        </div>
      </div>

    <h3>Tile Swapping</h3>
    <p>When you're stuck, use the <strong>Swap</strong> feature:</p>
    <ol>
      <li>Click the "Swap" button</li>
      <li>Click any available (beige) tile</li>
      <li>It gets replaced with a random new letter</li>
      <li>You have 3 swaps per game</li>
      <li>Cannot swap temporarily selectable (blue) tiles</li>
    </ol>

    <h2>Scoring</h2>

    <h3>Word Points</h3>
    <p>Points are based on word length:</p>
    <ul>
      <li>1 letters = 0 points</li>
      <li>2 letters = 1 point</li>
      <li>3 letters = 3 points</li>
      <li>4 letters = 5 points</li>
      <li>5 letters = 8 points</li>
      <li>6 letters = 12 points</li>
      <li>7 letters = 17 points</li>
      <li>8 letters = 23 points</li>
      <li>9 letters = 30 points</li>
      <li>10 letters = 38 points</li>
      <li>11 letters = 47 points</li>
      <li>12 letters = 57 points</li>
      <li>13 letters = 68 points</li>
      <li>14 letters = 80 points</li>
      <li>15 letters = 93 points</li>
      <li>16 letters = 107 points</li>
      <li>17+ = Even more points!</li>
    </ul>

    <h3>Special Tiles</h3>
    <ul>
      <li><strong>Wildcards (*)</strong>: Can be any letter, but don't count towards the word length</li>
      <li><strong>Bonus Tiles</strong>: Tiles marked with a <span class="bonus-tile">✶</span> that multiply your word score</li>
    </ul>

    <h3>Bonus Tiles</h3>
    <p>Some tiles on the board are marked as <strong>bonus tiles</strong> (marked by a <span class="bonus-tile">✶</span>). When you include bonus tiles in a word:</p>
    <ul>
      <li>Each bonus tile multiplies your word's base score</li>
      <li><strong>Formula</strong>: Final Score = Base Score × (1 + Number of Bonus Tiles)</li>
      <li>For example: A 5-letter word (8 points) with 2 bonus tiles = 8 × (1 + 2) = 24 points</li>
      <li>Bonus tiles appear randomly on the board (maximum of 1 per layer)</li>
      <li>You'll see a <span class="bonus-tile">✶</span> indicator next to your score when bonus tiles are included in your current word</li>
    </ul>

    <h3>End Game</h3>
    <ul>
      <li><strong>Final Score</strong> = Total Word Score - Penalty</li>
      <li><strong>Penalty</strong> = 3 points per leftover tile</li>
      <li>Game ends automatically when all tiles are cleared, or you can manually end the game using the "Done" button</li>
      <li>When you manually end the game, you'll receive a penalty for any remaining tiles</li>
    </ul>

    <h2>Game Modes</h2>

    <h3>Free Play</h3>
    <ul>
      <li>Random puzzle. Refresh the page anytime to start a new puzzle</li>
      <li>Perfect for practice! Play at your own pace without time limits</li>
      <li>Three different board sizes: Standard (4x4 → 3x3 → 2x2), Mini (3x3 → 2x2 → 3x3), and Pyramid (2x2 → 3x3 → 4x4)</li>
    </ul>

    <h3>Daily Puzzle</h3>
    <ul>
      <li>Same puzzle for everyone. Resets each day</li>
      <li>Can be replayed multiple times. Play the same puzzle again to improve your score</li>
      <li>The board is deterministic (including tile swaps). Replaying the puzzle again means you'll get the same board and same tile swaps</li>
      <li>Your stats are tracked: first score, best score, number of attempts, and longest word found</li>
    </ul>

    <h2>Strategy Tips</h2>

    <h3>Early Game</h3>
    <ul>
      <li>Start with longer words to clear more tiles</li>
      <li>Don't be afraid to use wildcards strategically</li>
    </ul>

    <h3>Mid Game</h3>
    <ul>
      <li>Plan ahead. Which tiles do you need to clear to reach hidden layers?</li>
      <li>Use temporary selection wisely. Make sure you can form a valid word with all required tiles</li>
      <li>Save your swaps for when you really need them</li>
    </ul>

    <h3>End Game</h3>
    <ul>
      <li>Every unused tile costs you 3 points. Sometimes it's better to form a shorter word than leave tiles unused</li>
      <li>Look for short 2-3 letter words to clear remaining tiles</li>
    </ul>

    <h3>Replay</h3>
    <p>When replaying a daily puzzle (after your first attempt), you have access to helpful tools:</p>
    <ul>
      <li><strong>Board Map</strong>: Click the "Board Map" button (with the eye icon) to see the complete board layout as plain text. This shows all layers with letters visible, making it easier to plan your strategy</li>
      <li><strong>Upcoming Tile Swaps</strong>: When you enter swap mode, you'll see the next letters that will appear when you swap tiles. This helps you decide which tiles to swap and when</li>
      <li><strong>Undo</strong>: Allows you to reverse your last permanent action (submitting a word or swapping a tile). This is useful for experimenting with different strategies or fixing mistakes</li>
      <li>Use these tools to optimize your strategy and improve your score on subsequent attempts</li>
    </ul>

    <h2>Need Help?</h2>
    <ul>
      <li><strong>Invalid word?</strong> Check your spelling</li>
      <li><strong>Can't select a tile?</strong> Make sure all tiles covering it are removed first</li>
      <li><strong>Stuck?</strong> Use the swap feature or look for shorter words</li>
    </ul>

    <h2>Changelog</h2>
    
      <div class="changelog-entry">
        <h3 class="changelog-version">v0.4.0 - 2025-11-13</h3>
        <div class="changelog-category">
          <h4>Added</h4>
          <ul>
            <li><strong>Bonus Tile Mechanic</strong>: Special tiles that multiply word score with visual indicator (✶ icon). Scoring formula: <code>baseScore * (1 + bonusCount)</code></li>
            <li><strong>Real-time Word Validation</strong>: Word validity checked as tiles are selected with visual feedback (green for valid, red for invalid) and real-time score calculation</li>
            <li><strong>Undo System</strong>: Added undo functionality for daily puzzle replays. Undo button appears after completing the daily puzzle at least once. Can undo word submissions and tile swaps. Undo history persists across page reloads.</li>
            <li><strong>Board Map Feature</strong>: Added board map modal for daily puzzle replays. Shows complete board layout with all layers visible, displays one letter per tile in a grid format, highlights bonus tiles in purple. Only available after completing the daily puzzle at least once.</li>
            <li><strong>End Game Modal Confirmation</strong>: Added confirmation dialog before ending a game to prevent accidental game endings. Shows remaining tiles count.</li>
          </ul>
        </div>
        <div class="changelog-category">
          <h4>Fixed</h4>
          <ul>
            <li>Selected tiles remaining visually selected after clearing word on page reload</li>
            <li>Tile swap mode preview not displaying on page reload after completion</li>
            <li>Swap mode preview now shows only as many letters as swaps remaining (instead of always 3)</li>
            <li>Swap system now uses pre-determined tiles generated at puzzle creation instead of random selection</li>
          </ul>
        </div>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-version">v0.3.0 - 2025-10-03</h3>
        <div class="changelog-category">
          <h4>Added</h4>
          <ul>
            <li><strong>New Logo and Branding</strong>: New logo and favicon design. Replaced all references from 'Stacks' to 'Quarry'. Updated tile color scheme and background.</li>
          </ul>
        </div>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-version">v0.2.6 - 2025-09-29</h3>
        <div class="changelog-category">
          <h4>Added</h4>
          <ul>
            <li><strong>PWA Support</strong>: Progressive Web App manifest, fullscreen functionality, service worker registration, install prompt support</li>
          </ul>
        </div>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-version">v0.2.5 - 2025-09-25</h3>
        <div class="changelog-category">
          <h4>Added</h4>
          <ul>
            <li><strong>Upcoming Swap Letters Preview</strong>: Shows next tiles that will be swapped in (for completed daily puzzles). Only visible after completing the puzzle at least once. Displays in swap mode feedback.</li>
          </ul>
        </div>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-version">v0.2.4 - 2025-09-24</h3>
        <div class="changelog-category">
          <h4>Added</h4>
          <ul>
            <li><strong>Game Modes</strong>: Added game modes under 'free play' menu. Multiple board configurations available.</li>
          </ul>
        </div>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-version">v0.2.3 - 2025-09-23</h3>
        <div class="changelog-category">
          <h4>Added</h4>
          <ul>
            <li><strong>Archive Feature</strong>: View past daily puzzles, track statistics across multiple days, access historical puzzle data</li>
          </ul>
        </div>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-version">v0.2.2 - 2025-09-22</h3>
        <div class="changelog-category">
          <h4>Added</h4>
          <ul>
            <li><strong>LocalStorage State Persistence</strong>: Game state saved automatically, restores on page reload, preserves progress across sessions</li>
            <li><strong>Longest Word Tracking</strong>: Tracks longest word found in daily puzzle, displays in stats layout</li>
            <li><strong>Wordlist Updates</strong>: Added 1 and 2-letter words to wordlist</li>
            <li><strong>Instructions Page</strong>: Game rules and instructions, strategy tips and gameplay guide</li>
          </ul>
        </div>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-version">v0.2.1 - 2025-09-21</h3>
        <div class="changelog-category">
          <h4>Added</h4>
          <ul>
            <li><strong>New Scoring System</strong>: Length-based scoring formula, points scale with word length</li>
            <li><strong>Completion Banner Enhancements</strong>: Sharing functionality, more complete statistics display, better visual presentation</li>
          </ul>
        </div>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-version">v0.2.0 - 2025-09-20</h3>
        <div class="changelog-category">
          <h4>Added</h4>
          <ul>
            <li><strong>Daily Puzzle Mode</strong>: Deterministic daily puzzles using seeded random number generation. Same puzzle for all players, resets each day. Can be replayed multiple times. Progress tracking and statistics. Completion banner with score breakdown. Best score tracking. Attempt counter.</li>
            <li><strong>Drag-and-Drop Tile Reordering</strong>: Redesigned tile area with drag-and-drop functionality. Reorder letters in word before submission.</li>
            <li><strong>Swap System</strong>: Tile swapping (3 swaps per game). Generates swap pile with rest of puzzle.</li>
          </ul>
        </div>
        <div class="changelog-category">
          <h4>Fixed</h4>
          <ul>
            <li><strong>Bug fixes</strong>: Various bug fixes and improvements</li>
          </ul>
        </div>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-version">v0.1.1 - 2025-09-19</h3>
        <div class="changelog-category">
          <h4>Added</h4>
          <ul>
            <li><strong>Svelte Migration</strong>: Converted project to Svelte framework</li>
          </ul>
        </div>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-version">v0.1.0 - 2025-05-09</h3>
        <div class="changelog-category">
          <h4>Added</h4>
          <ul>
            <li><strong>Initial Release</strong>: Core word-building gameplay, 3D layered board (4×4, 3×3, 2×2 layers), tile selection and word formation, basic scoring system, word validation, temporary tile selection (blue tiles), wildcard tiles (*) support, penalty system (3 points per remaining tile)</li>
          </ul>
        </div>
      </div>
  </div>
</div>

<style>
  .instructions-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
    padding: 0;
  }

  .instructions-content {
    background: white;
    border-radius: 4px;
    padding: 24px;
    width: 100%;
    max-width: 800px;
    line-height: 1.6;
    border: 1px solid #e9ecef;
    box-sizing: border-box;
  }

  .instructions-content h1 {
    color: #333;
    margin-bottom: 20px;
    font-size: clamp(1.75rem, 4vw, 2.25rem);
  }

  .instructions-content h2 {
    color: #333;
    margin-top: 24px;
    border-bottom: 1px solid #e9ecef;
    padding-bottom: 8px;
    font-size: clamp(1.25rem, 3vw, 1.5rem);
  }

  .instructions-content h3 {
    color: #495057;
    margin-top: 20px;
    margin-bottom: 8px;
    font-size: clamp(1.1rem, 2.5vw, 1.25rem);
  }

  .instructions-content p {
    color: #555;
    font-size: clamp(0.9rem, 2vw, 1rem);
  }

  .instructions-content ul, .instructions-content ol {
    margin-bottom: 16px;
    padding-left: 24px;
  }

  .instructions-content li {
    margin-bottom: 6px;
    color: #555;
    font-size: clamp(0.9rem, 2vw, 1rem);
  }

  .instructions-content strong {
    color: #333;
    font-weight: 600;
  }

  /* Visual Examples */
  .visual-example {
    background: #f8f9fa;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 16px;
  }


  /* Tile Demo */
  .tile-demo {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
    align-items: flex-start;
  }

  .tile {
    width: 40px;
    height: 40px;
    aspect-ratio: 1 / 1;
    position: relative;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.1s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tile.beige {
    background-color: #F2E3CA;
    border-bottom: 4px solid #E4CBAF;
  }

  .tile.beige:hover {
    background-color: #EBD7BD;
  }

  .tile.green {
    background-color: #CCE6BF;
    border-bottom: 4px solid #BED4AA;
  }

  .tile.orange {
    background-color: #F0C6AF;
    border-bottom: 4px solid #E3B49A;
    cursor: not-allowed;
  }

  .tile.yellow {
    background-color: #B3D9FF;
    border-bottom: 4px solid #99CCFF;
    animation: pulse 1.5s infinite;
  }

  .tile.yellow:hover {
    background-color: #A6D1FF;
  }

  .tile-pair {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .tile-label {
    color: #555;
    line-height: 1.6;
    white-space: nowrap;
    flex: 1;
    min-width: 200px;
  }

  /* Board Layout Demo */
  .board-layout-demo {
    display: flex;
    gap: 20px;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }

  .layer-demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }


  .demo-grid {
    display: grid;
    gap: 2px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .top-layer-demo {
    grid-template-columns: repeat(4, 1fr);
  }

  .middle-layer-demo {
    grid-template-columns: repeat(3, 1fr);
  }

  .bottom-layer-demo {
    grid-template-columns: repeat(2, 1fr);
  }

  .demo-tile-small {
    width: 24px;
    height: 24px;
    background-color: #F2E3CA;
    border: 1px solid #E6D3C0;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    color: #333;
  }

  /* Temp-selectable demo styles */
  .temp-selectable-demo {
    display: flex;
    justify-content: center;
    padding-top: 16px;
  }

  .demo-board {
    position: relative;
    width: 184px;
    height: 184px;
  }

  .demo-layer {
    position: absolute;
    display: grid;
    gap: 4px;
  }

  .top-layer {
    grid-template-columns: repeat(2, 1fr);
    width: 184px;
    height: 184px;
    z-index: 2;
  }

  .bottom-layer {
    grid-template-columns: 1fr;
    width: 92px;
    height: 92px;
    top: 46px;
    left: 46px;
    z-index: 1;
  }

  .demo-tile {
    aspect-ratio: 1 / 1;
    position: relative;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.1s ease;
    border-bottom: 4px solid #E4CBAF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 24px;
  }

  .demo-tile.available {
    background-color: #F2E3CA;
  }

  .demo-tile.available:hover:not(.selected) {
    background-color: #EBD7BD;
  }

  .demo-tile.unavailable {
    background-color: #F0C6AF;
    border-bottom: 4px solid #E3B49A;
    cursor: not-allowed;
  }

  .demo-tile.temp-selectable {
    background-color: #B3D9FF;
    border-bottom: 4px solid #99CCFF;
    cursor: pointer;
  }

  .demo-tile.temp-selectable:hover:not(.selected) {
    background-color: #A6D1FF;
  }

  .demo-tile.selected {
    background-color: #CCE6BF;
    border-bottom: 4px solid #BED4AA;
  }

  .demo-tile.selected:hover {
    background-color: #CCE6BF;
  }

  .demo-tile.temp-selectable.selected,
  .demo-tile.selected.temp-selectable {
    background-color: #CCE6BF !important;
    border-bottom: 4px solid #BED4AA !important;
  }

  .demo-tile.temp-selectable.selected:hover,
  .demo-tile.selected.temp-selectable:hover {
    background-color: #CCE6BF !important;
  }

  .demo-tile.empty {
    background-color: transparent;
    border: none;
    cursor: default;
  }

  .demo-tile.empty:hover {
    background-color: transparent;
  }

  /* 4-letter corner styling like actual game tiles */
  .corner {
    position: absolute;
    width: 50%;
    height: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 12px;
  }

  .top-left {
    top: 0;
    left: 0;
  }

  .top-right {
    top: 0;
    right: 0;
  }

  .bottom-left {
    bottom: 0;
    left: 0;
  }

  .bottom-right {
    bottom: 0;
    right: 0;
  }


  /* Word Building Demo */
  .word-building-demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }



  /* Demo Word Area */
  .demo-word-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background-color: #f8f9fa;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 100%;
  }

  .word-area-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }


  .word-tile {
    width: 40px;
    height: 40px;
    background: #90EE90;
    border: 2px solid #4CAF50;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
    cursor: grab;
    transition: all 0.1s ease;
    user-select: none;
  }

  .word-tile:hover {
    background: #7ED321;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .word-tile:active {
    cursor: grabbing;
  }

  .word-tile:focus {
    outline: 2px solid #007acc;
    outline-offset: 2px;
  }

  /* Drag and drop styles */
  .word-tiles-container {
    display: flex;
    gap: 8px;
    min-height: 50px;
    align-items: center;
    flex-wrap: wrap;
    padding: 8px;
    border: 2px dashed #ddd;
    border-radius: 8px;
    background: #fafafa;
  }



  .demo-feedback {
    margin: 0;
    font-size: 14px;
    text-align: center;
    min-height: 20px;
  }

  .demo-controls {
    display: flex;
    gap: 12px;
  }

  .demo-controls button {
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    transition: background-color 0.1s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    touch-action: manipulation;
  }

  .demo-controls button:hover:not(:disabled) {
    background-color: #f0f0f0;
  }

  .demo-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .bonus-tile {
    color: #9d4edd;
    font-weight: bold;
  }

  /* Changelog Styles */
  .changelog-section {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 2px solid #e9ecef;
  }

  .changelog-entry {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e9ecef;
  }

  .changelog-entry:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .changelog-version {
    color: #007bff;
    margin-top: 0;
    margin-bottom: 16px;
    font-size: clamp(1.1rem, 2.5vw, 1.25rem);
    font-weight: 600;
  }

  .changelog-category {
    margin-bottom: 16px;
  }

  .changelog-category:last-child {
    margin-bottom: 0;
  }

  .changelog-category h4 {
    color: #495057;
    margin-top: 12px;
    margin-bottom: 8px;
    font-size: clamp(1rem, 2vw, 1.1rem);
    font-weight: 600;
  }

  .changelog-category ul {
    margin-bottom: 12px;
    padding-left: 24px;
  }

  .changelog-category li {
    margin-bottom: 8px;
    color: #555;
    font-size: clamp(0.9rem, 2vw, 1rem);
    line-height: 1.6;
  }

  .changelog-category code {
    background-color: #f8f9fa;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9em;
    color: #d63384;
  }


  /* Animations */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes rearrange {
    0% { transform: scale(1); }
    50% { transform: scale(1.1) rotate(5deg); }
    100% { transform: scale(1); }
  }

  @media (max-width: 768px) {
    .instructions-content {
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 8px;
    }

    .instructions-content h1 {
      margin-bottom: 12px;
    }

    .instructions-content h2 {
      margin-top: 16px;
    }

    .instructions-content h3 {
      margin-top: 12px;
    }

    .tile-demo {
      gap: 8px;
    }

    .tile {
      width: 35px;
      height: 35px;
      font-size: 14px;
    }

    .tile-label {
      font-size: 14px;
      white-space: normal;
      min-width: unset;
    }

    .tile-pair {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .demo-board {
      width: 138px;
      height: 138px;
    }

    .top-layer {
      width: 138px;
      height: 138px;
    }

    .bottom-layer {
      width: 69px;
      height: 69px;
      top: 34.5px;
      left: 34.5px;
    }

    .demo-tile {
      font-size: 18px;
    }

    .corner {
      font-size: 9px;
    }

    .board-layout-demo {
      flex-direction: column;
      gap: 16px;
    }

    .demo-tile-small {
      width: 20px;
      height: 20px;
      font-size: 8px;
    }

    .word-tile {
      width: 30px;
      height: 30px;
      font-size: 12px;
    }

    .demo-word-area {
      min-width: 250px;
      padding: 16px;
    }

    .word-tiles-container {
      gap: 6px;
    }

    .demo-controls {
      gap: 8px;
      flex-wrap: wrap;
    }

    .demo-controls button {
      padding: 8px 12px;
      font-size: 12px;
      min-height: 40px;
    }

    .visual-example {
      padding: 8px;
    }

    .demo-feedback {
      font-size: 13px;
    }

    .instructions-content ul, .instructions-content ol {
      margin-bottom: 12px;
      padding-left: 20px;
    }

    .instructions-content li {
      margin-bottom: 4px;
    }
  }

  @media (max-width: 480px) {
    .instructions-content {
      padding: 4px;
    }

    .tile {
      width: 30px;
      height: 30px;
      font-size: 12px;
    }

    .tile-label {
      font-size: 13px;
    }

    .demo-board {
      width: 120px;
      height: 120px;
    }

    .top-layer {
      width: 120px;
      height: 120px;
    }

    .bottom-layer {
      width: 60px;
      height: 60px;
      top: 30px;
      left: 30px;
    }

    .demo-tile {
      font-size: 16px;
    }

    .corner {
      font-size: 8px;
    }

    .demo-tile-small {
      width: 18px;
      height: 18px;
      font-size: 7px;
    }

    .word-tile {
      width: 28px;
      height: 28px;
      font-size: 11px;
    }

    .demo-word-area {
      min-width: 200px;
      padding: 12px;
    }

    .demo-controls button {
      padding: 6px 10px;
      font-size: 11px;
      min-height: 36px;
    }

    .word-tiles-container {
      gap: 4px;
      padding: 6px;
    }
  }
</style>
