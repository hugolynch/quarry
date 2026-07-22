<script lang="ts">
  import { game, getShareUrl, setFeedback } from '../lib/state.svelte'

  let shareButtonText = $state('Share')

  async function shareGame() {
    if (game.seed === null) return
    const url = getShareUrl(game.gameMode, game.seed)
    try {
      await navigator.clipboard.writeText(url)
      setFeedback('Game link copied!', 'green')
      shareButtonText = 'Copied'
      setTimeout(() => {
        shareButtonText = 'Share'
      }, 3000)
    } catch (err) {
      console.error('Failed to copy share link:', err)
      setFeedback('Failed to copy link', 'red')
    }
  }
</script>

<button onclick={shareGame} class="share-button" type="button">
  <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
  {shareButtonText}
</button>

<style>
  .share-button {
    padding: 8px 16px;
    border: 1px solid #6c757d;
    border-radius: 4px;
    background-color: white;
    color: #333;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    transition: background-color 0.1s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .share-button:hover {
    background-color: #f0f0f0;
  }

  .button-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
</style>
