import { Game } from './core/game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Create and initialize our game
  const game = new Game();
  
  // Store game instance globally for debugging and UI access
  window.game = game;
  
  // Initialize the game
  game.init().then(() => {
    console.log('Game started successfully');
    
    // Hide the initial loading screen
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }).catch(error => {
    console.error('Error starting game:', error);
  });
}); 