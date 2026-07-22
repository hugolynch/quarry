<script lang="ts">
  import type { Tile } from '../types/game'
  import type { TileState } from '../types/game'
  import { createEventDispatcher } from 'svelte'

  export let tile: Tile
  export let state: TileState

  const dispatch = createEventDispatcher()

  function handleClick() {
    dispatch('click')
  }

  function getGridStyle() {
    return `grid-row-start: ${tile.position.x + 1}; grid-column-start: ${tile.position.y + 1};`
  }
</script>

<div 
  class="tile {state} layer-{tile.layer}"
  style={getGridStyle()}
  on:click={handleClick}
  role="button"
  tabindex="0"
  on:keydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  <div class="corner top-left">{tile.completelyCovered ? '?' : tile.letter}</div>
  <div class="corner top-right">{tile.completelyCovered ? '?' : tile.letter}</div>
  <div class="corner bottom-left">{tile.completelyCovered ? '?' : tile.letter}</div>
  <div class="corner bottom-right">{tile.completelyCovered ? '?' : tile.letter}</div>
  {#if tile.isBonus && !tile.completelyCovered}
    <div class="bonus-star">
      <img src="./mult.svg" alt="Bonus tile" />
    </div>
  {/if}
</div>

<style>
  .tile {
    aspect-ratio: 1 / 1;
    grid-row-end: span 2;
    grid-column-end: span 2;
    position: relative;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.1s ease;
    box-shadow: 0 6px 6px 0 rgba(0, 0, 0, 0.1);
  }

  /* Default tiles (unselected) - Top layer (layer 0) */
  .tile.available.layer-0 {
    background-color: #F2F3FB;
    border-bottom: 4px solid #C9CAD6;
  }

  .tile.available.layer-0:hover {
    background-color: #E8E9F0;
  }

  /* Default tiles (unselected) - layer 1 */
  .tile.available.layer-1 {
    background-color: #E3E5EF;
    border-bottom: 4px solid #9E9FAA;
  }

  .tile.available.layer-1:hover {
    background-color: #D8DAE5;
  }

  /* Default tiles (unselected) - layer 2 */
  .tile.available.layer-2 {
    background-color: #C9CAD6;
    border-bottom: 4px solid #8F909A;
  }

  .tile.available.layer-2:hover {
    background-color: #BFC0CC;
  }

  /* Default tiles (unselected) - layer 3 */
  .tile.available.layer-3 {
    background-color: #B0B1BD;
    border-bottom: 4px solid #7A7B85;
  }

  .tile.available.layer-3:hover {
    background-color: #A5A6B2;
  }

  /* Default tiles (unselected) - layer 4 */
  .tile.available.layer-4 {
    background-color: #9798A4;
    border-bottom: 4px solid #686972;
  }

  .tile.available.layer-4:hover {
    background-color: #8C8D99;
  }

  /* Selected tiles */
  .tile.selected.layer-0 {
    background-color: #EDF5EB;
    border-bottom: 4px solid #ACD6A3;
  }

  .tile.selected.layer-1 {
    background-color: #D4EAD0;
    border-bottom: 4px solid #80C171;
  }

  .tile.selected.layer-2 {
    background-color: #ACD6A3;
    border-bottom: 4px solid #63B251;
  }

  .tile.selected.layer-3 {
    background-color: #8FC484;
    border-bottom: 4px solid #4FA040;
  }

  .tile.selected.layer-4 {
    background-color: #72B265;
    border-bottom: 4px solid #3D8A30;
  }

  /* Unavailable tiles - top layer uses same colors as available */
  .tile.unavailable.layer-0 {
    background-color: #F2F3FB;
    border-bottom: 4px solid #C9CAD6;
    cursor: not-allowed;
  }

  .tile.unavailable.layer-1 {
    background-color: #FADEC9;
    border-bottom: 4px solid #EF9E58;
    cursor: not-allowed;
  }

  .tile.unavailable.layer-2 {
    background-color: #F5C197;
    border-bottom: 4px solid #E88828;
    cursor: not-allowed;
  }

  .tile.unavailable.layer-3 {
    background-color: #EBA66A;
    border-bottom: 4px solid #D9741A;
    cursor: not-allowed;
  }

  .tile.unavailable.layer-4 {
    background-color: #E08B3D;
    border-bottom: 4px solid #C66510;
    cursor: not-allowed;
  }

  /* Temp-selectable tiles */
  .tile.temp-selectable.layer-1 {
    background-color: #D4E5FF;
    border-bottom: 4px solid #83B2FF;
    cursor: pointer;
  }

  .tile.temp-selectable.layer-1:hover {
    background-color: #C7DDFF;
  }

  .tile.temp-selectable.layer-2 {
    background-color: #ADCCFF;
    border-bottom: 4px solid #66A0FF;
    cursor: pointer;
  }

  .tile.temp-selectable.layer-2:hover {
    background-color: #A0C5FF;
  }

  .tile.temp-selectable.layer-3 {
    background-color: #86B3FF;
    border-bottom: 4px solid #4A8EFF;
    cursor: pointer;
  }

  .tile.temp-selectable.layer-3:hover {
    background-color: #79AAFF;
  }

  .tile.temp-selectable.layer-4 {
    background-color: #5F9AFF;
    border-bottom: 4px solid #2E7CFF;
    cursor: pointer;
  }

  .tile.temp-selectable.layer-4:hover {
    background-color: #5291FF;
  }

  /* Hidden tiles - look like normal tiles since they're completely covered */
  .tile.hidden.layer-0 {
    background-color: #F2F3FB;
    border-bottom: 4px solid #C9CAD6;
    cursor: not-allowed;
  }

  .tile.hidden.layer-1 {
    background-color: #E3E5EF;
    border-bottom: 4px solid #9E9FAA;
    cursor: not-allowed;
  }

  .tile.hidden.layer-2 {
    background-color: #C9CAD6;
    border-bottom: 4px solid #8F909A;
    cursor: not-allowed;
  }

  .tile.hidden.layer-3 {
    background-color: #B0B1BD;
    border-bottom: 4px solid #7A7B85;
    cursor: not-allowed;
  }

  .tile.hidden.layer-4 {
    background-color: #9798A4;
    border-bottom: 4px solid #686972;
    cursor: not-allowed;
  }

  .corner {
    position: absolute;
    width: 50%;
    height: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
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

  .bonus-star {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 0;
  }

  .bonus-star img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
