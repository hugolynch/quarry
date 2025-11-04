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
    <h1>Welcome to Quarry!</h1>
    
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
      <li><strong>Click selected tiles again</strong> to remove them</li>
      <li><strong>Click "Submit"</strong> when you're ready to submit your word</li>
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

    <h3>How Scoring Works</h3>
    <p>Each word's score is calculated as: <strong>Length Score × Word Score</strong></p>
    
    <h4>Length Score</h4>
    <p>Based on word length (excluding wildcards):</p>
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

    <h4>Word Score</h4>
    <p>Sum of letter point values (like Scrabble):</p>
    <ul>
      <li><strong>1 point:</strong> A, E, I, L, N, O, R, S, T, U</li>
      <li><strong>2 points:</strong> D, G</li>
      <li><strong>3 points:</strong> B, C, M, P</li>
      <li><strong>4 points:</strong> F, H, V, W, Y</li>
      <li><strong>5 points:</strong> K</li>
      <li><strong>8 points:</strong> J, X</li>
      <li><strong>10 points:</strong> Q, Z</li>
      <li><strong>0 points:</strong> * (wildcards)</li>
    </ul>

    <h4>Example</h4>
    <p>Word "QUIZ" (4 letters):</p>
    <ul>
      <li>Length Score: 5 points (4 letters)</li>
      <li>Word Score: 10 + 1 + 1 + 10 = 22 points (Q+U+I+Z)</li>
      <li>Total: 5 × 22 = 110 points</li>
    </ul>

    <h3>Special Tiles</h3>
    <ul>
      <li><strong>Wildcards (*)</strong>: Can be any letter, but don't count towards the word length and have 0 point value</li>
    </ul>

    <h3>End Game</h3>
    <ul>
      <li><strong>Final Score</strong> = Total Word Score - Penalty</li>
      <li><strong>Penalty</strong> = 3 points per leftover tile</li>
      <li>Game ends when the board is cleared or no more words can be formed</li>
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

    <h2>Need Help?</h2>
    <ul>
      <li><strong>Invalid word?</strong> Check your spelling</li>
      <li><strong>Can't select a tile?</strong> Make sure all tiles covering it are removed first</li>
      <li><strong>Stuck?</strong> Use the swap feature or look for shorter words</li>
    </ul>
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
