<script lang="ts">
  import { game, toggleTileSelection, getTileState } from '../lib/state.svelte'
  import type { Tile } from '../types/game'
  import TileComponent from './Tile.svelte'

  function handleTileClick(tile: Tile) {
    toggleTileSelection(tile)
  }
</script>

<div class="game-container">
  {#each game.layers.slice().reverse() as layer}
    <div class="layer">
      {#each layer.tiles as tile (tile.id)}
        <TileComponent 
          {tile} 
          state={getTileState(tile)}
          on:click={() => handleTileClick(tile)}
        />
      {/each}
    </div>
  {/each}
</div>

<style>
  .game-container {
    display: grid;
    /* 7×5 top silhouette → 14×10 fine grid */
    width: calc(32px * 14);
    max-width: 100%;
    grid-template: repeat(10, 1fr) / repeat(14, 1fr);
    gap: 2px;
    margin: 5px auto;
  }

  .layer {
    display: grid;
    grid-area: 1 / 1 / -1 / -1;
    grid-template-rows: repeat(10, 1fr);
    grid-template-columns: repeat(14, 1fr);
    gap: 4px;
  }

  @media (max-width: 480px) {
    .game-container {
      width: calc(22px * 14);
    }
  }
</style>
