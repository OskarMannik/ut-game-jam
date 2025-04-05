import { Game } from './core/game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Ask for username
  let playerName = prompt("Please enter your name:", "Player");
  if (!playerName || playerName.trim().length === 0) {
    playerName = `Player_${Math.random().toString(36).substring(2, 7)}`; // Generate random if empty
  }
  playerName = playerName.substring(0, 16); // Limit length

  // Create and initialize our game, passing the name
  const game = new Game(playerName);
  
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
    // Display error to user maybe?
  });
}); 