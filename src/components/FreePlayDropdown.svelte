<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { GameMode } from '../types/game'
  
  export let currentMode: GameMode
  export let isActive: boolean = false
  
  const dispatch = createEventDispatcher()
  
  let isOpen = false
  
  const modes: { id: GameMode; label: string }[] = [
    { id: 'main', label: 'Standard' },
    { id: 'mini', label: 'Mini' },
    { id: 'pyramid', label: 'Pyramid' },
    { id: 'crown', label: 'Crown' }
  ]
  
  function handleModeSelect(mode: GameMode) {
    dispatch('modeSelect', mode)
    isOpen = false
  }
  
  function toggleDropdown() {
    isOpen = !isOpen
  }
  
  function getCurrentLabel() {
    return modes.find(m => m.id === currentMode)?.label || 'Standard'
  }
</script>

<div class="dropdown-container">
  <button 
    class="nav-button dropdown-button" 
    class:active={isActive}
    onclick={toggleDropdown}
  >
    Free Play
    <svg class="dropdown-arrow" class:open={isOpen} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6,9 12,15 18,9"></polyline>
    </svg>
  </button>
  
  {#if isOpen}
    <div class="dropdown-menu">
      {#each modes as mode}
        <button 
          class="dropdown-item" 
          class:selected={mode.id === currentMode}
          onclick={() => handleModeSelect(mode.id)}
        >
          {mode.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dropdown-container {
    position: relative;
    display: inline-block;
  }
  
  .dropdown-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    transition: background-color 0.1s ease;
  }
  
  .dropdown-button:hover:not(:disabled) {
    background-color: #f0f0f0;
  }
  
  .dropdown-button.active {
    background-color: #007bff;
    color: white;
    border-color: #0056b3;
  }
  
  .dropdown-button.active:hover {
    background-color: #0056b3;
  }
  
  .dropdown-arrow {
    width: 12px;
    height: 12px;
    transition: transform 0.2s ease;
  }
  
  .dropdown-arrow.open {
    transform: rotate(180deg);
  }
  
  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    margin-top: 2px;
  }
  
  .dropdown-item {
    width: 100%;
    padding: 8px 16px;
    border: none;
    background-color: white;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    text-align: left;
    transition: background-color 0.1s ease;
  }
  
  .dropdown-item:hover {
    background-color: #f0f0f0;
  }
  
  .dropdown-item.selected {
    background-color: #007bff;
    color: white;
  }
  
  .dropdown-item.selected:hover {
    background-color: #0056b3;
  }
  
  .dropdown-item:first-child {
    border-radius: 4px 4px 0 0;
  }
  
  .dropdown-item:last-child {
    border-radius: 0 0 4px 4px;
  }
</style>
