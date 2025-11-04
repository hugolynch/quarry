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

  /* Default tiles (unselected) - Middle layer (layer 1) */
  .tile.available.layer-1 {
    background-color: #E3E5EF;
    border-bottom: 4px solid #9E9FAA;
  }

  .tile.available.layer-1:hover {
    background-color: #D8DAE5;
  }

  /* Default tiles (unselected) - Bottom layer (layer 2) */
  .tile.available.layer-2 {
    background-color: #C9CAD6;
    border-bottom: 4px solid #8F909A;
  }

  .tile.available.layer-2:hover {
    background-color: #BFC0CC;
  }

  /* Selected tiles - Top layer (layer 0) */
  .tile.selected.layer-0 {
    background-color: #EDF5EB;
    border-bottom: 4px solid #ACD6A3;
  }

  /* Selected tiles - Middle layer (layer 1) */
  .tile.selected.layer-1 {
    background-color: #D4EAD0;
    border-bottom: 4px solid #80C171;
  }

  /* Selected tiles - Bottom layer (layer 2) */
  .tile.selected.layer-2 {
    background-color: #ACD6A3;
    border-bottom: 4px solid #63B251;
  }

  /* Unavailable tiles - top layer uses same colors as available */
  .tile.unavailable.layer-0 {
    background-color: #F2F3FB;
    border-bottom: 4px solid #C9CAD6;
    cursor: not-allowed;
  }

  /* Unavailable tiles - middle layer (layer 1) */
  .tile.unavailable.layer-1 {
    background-color: #FADEC9;
    border-bottom: 4px solid #EF9E58;
    cursor: not-allowed;
  }

  /* Unavailable tiles - bottom layer (layer 2) */
  .tile.unavailable.layer-2 {
    background-color: #F5C197;
    border-bottom: 4px solid #E88828;
    cursor: not-allowed;
  }

  /* Temp-selectable tiles - Middle layer (layer 1) */
  .tile.temp-selectable.layer-1 {
    background-color: #D4E5FF;
    border-bottom: 4px solid #83B2FF;
    cursor: pointer;
  }

  .tile.temp-selectable.layer-1:hover {
    background-color: #C7DDFF;
  }

  /* Temp-selectable tiles - Bottom layer (layer 2) */
  .tile.temp-selectable.layer-2 {
    background-color: #ADCCFF;
    border-bottom: 4px solid #66A0FF;
    cursor: pointer;
  }

  .tile.temp-selectable.layer-2:hover {
    background-color: #A0C5FF;
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
</style>
