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
    
    // Add control instructions to the page
    addControlInstructions();
  }).catch(error => {
    console.error('Error starting game:', error);
  });
});

// Add instructions text
function addControlInstructions() {
  const instructions = document.createElement('div');
  instructions.className = 'instructions';
  instructions.innerHTML = `
    <div class="instructions-content">
      <h2>Controls</h2>
      <ul>
        <li><strong>W/↑:</strong> Move Forward</li>
        <li><strong>S/↓:</strong> Move Backward</li>
        <li><strong>A/←:</strong> Turn Left</li>
        <li><strong>D/→:</strong> Turn Right</li>
        <li><strong>Space:</strong> Jump/Swim Up</li>
        <li><strong>E:</strong> Interact</li>
        <li><strong>F:</strong> Use Artifact Ability</li>
      </ul>
      <button id="start-game">Start Exploring</button>
    </div>
  `;
  
  document.body.appendChild(instructions);
  
  // Add CSS for instructions
  const style = document.createElement('style');
  style.textContent = `
    .instructions {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 500;
    }
    
    .instructions-content {
      background-color: rgba(0, 50, 100, 0.9);
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      color: white;
      max-width: 80%;
    }
    
    .instructions-content h2 {
      margin-top: 0;
      font-size: 24px;
    }
    
    .instructions-content ul {
      text-align: left;
      list-style-type: none;
      padding: 0;
      margin: 20px 0;
    }
    
    .instructions-content li {
      margin: 10px 0;
      font-size: 18px;
    }
    
    #start-game {
      background-color: #4499ff;
      border: none;
      color: white;
      padding: 15px 30px;
      font-size: 18px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s;
    }
    
    #start-game:hover {
      background-color: #55aaff;
    }
  `;
  
  document.head.appendChild(style);
  
  // Handle start button click
  document.getElementById('start-game').addEventListener('click', () => {
    instructions.style.display = 'none';
  });
} 