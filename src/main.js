import { Game } from './core/game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Don't prompt immediately
  // let playerName = prompt("Please enter your name:", "Player"); ...

  // Show the name input UI first
  showNameInputUI();
});

function showNameInputUI() {
  // Create overlay elements
  const overlay = document.createElement('div');
  overlay.id = 'name-input-overlay';

  const content = document.createElement('div');
  content.className = 'name-input-content';

  const title = document.createElement('h2');
  title.textContent = 'Enter Your Name';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'player-name-input';
  input.placeholder = 'Player Name';
  input.maxLength = 16;
  input.value = "Player"; // Default value

  const startButton = document.createElement('button');
  startButton.id = 'start-game-button';
  startButton.textContent = 'Start';

  content.appendChild(title);
  content.appendChild(input);
  content.appendChild(startButton);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Add basic styles (could be moved to CSS file)
  const style = document.createElement('style');
  style.textContent = `
    #name-input-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      color: white;
      font-family: sans-serif;
    }
    .name-input-content {
      background-color: rgba(0, 20, 40, 0.9);
      padding: 30px 40px;
      border-radius: 10px;
      text-align: center;
      border: 1px solid #337ab7;
    }
    .name-input-content h2 {
      margin-top: 0;
      margin-bottom: 20px;
    }
    #player-name-input {
      display: block;
      width: 80%;
      margin: 0 auto 20px auto;
      padding: 10px;
      font-size: 16px;
      border-radius: 5px;
      border: 1px solid #ccc;
    }
    #start-game-button {
      padding: 12px 25px;
      font-size: 16px;
      font-weight: bold;
      color: white;
      background-color: #337ab7;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    #start-game-button:hover {
      background-color: #286090;
    }
  `;
  document.head.appendChild(style);

  // --- Event Listener for Starting Game ---
  startButton.addEventListener('click', () => {
    let playerName = input.value.trim();
    if (!playerName || playerName.length === 0) {
      playerName = `Player_${Math.random().toString(36).substring(2, 7)}`;
    }
    playerName = playerName.substring(0, 16); // Enforce length limit again

    // Hide the name input overlay
    overlay.style.display = 'none'; 
    // Optional: remove the overlay from DOM after hiding
    // overlay.remove(); 

    // --- NOW Initialize the Game --- 
    initializeGame(playerName);
  });
  
  // Also allow Enter key in input field
  input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
          startButton.click(); // Trigger the button click
      }
  });
}

function initializeGame(playerName) {
  // Show loading message again briefly if needed
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'block'; // Make sure loading is visible
  }

  // Create and initialize our game, passing the name
  const game = new Game(playerName);
  window.game = game; // Store globally

  game.init().then(() => {
    // Hide loading screen AFTER game init is complete
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }).catch(error => {
    console.error('Error starting game:', error);
    // Display error to user maybe?
    if (loadingElement) {
       loadingElement.textContent = "Error starting game. Please refresh.";
    }
  });
} 