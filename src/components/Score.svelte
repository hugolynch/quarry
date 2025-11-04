<script lang="ts">
  import { game } from '../lib/state.svelte'
</script>

<div class="score-container">
  <h3>Score: {game.totalScore}</h3>
  
  {#if game.usedWords.length > 0}
    <div class="word-list">
      <ul>
        {#each game.usedWords as wordData (wordData.word)}
          <li>{wordData.word} ({wordData.score})</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .score-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  h3 {
    margin: 0;
    font-size: 1.5em;
    color: #333;
  }


  .word-list {
    text-align: center;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-height: 200px;
    overflow-y: auto;
  }

  li {
    padding: 4px 8px;
    background-color: #f0f0f0;
    border-radius: 4px;
    font-size: 0.9em;
  }
</style>
