import * as THREE from 'three';
import { formatTime } from '../utils/math.js';

export class UI {
  constructor() {
    // Reference to game state
    this.gameState = null;
    
    // UI elements
    this.container = null;
    this.depthMeter = null;
    this.timerDisplay = null;
    this.interactionPrompt = null;
    this.memoryFlashback = null;
    this.fadeOverlay = null;
    this.gameOverScreen = null;
    this.controlsDisplay = null;
    this.memoryLogPanel = null;
    this.dialogueBox = null;
    this.pauseScreen = null;
    this.gameWonScreen = null;
    this.crosshair = null;
    this.healthBar = null;
    this.touchControls = {};
    
    this.isFading = false;
    this.activeMemoryTimeout = null;
    this.messageTimeout = null;
  }
  
  init(gameState) {
    this.gameState = gameState;
    
    // Create main UI container
    this.container = document.createElement('div');
    this.container.className = 'game-ui';
    document.body.appendChild(this.container);
    
    // Create HUD container
    const hudContainer = document.createElement('div');
    hudContainer.id = 'hud-container';
    this.container.appendChild(hudContainer);
    
    // Create UI elements and append to HUD
    this.createDepthMeter();
    if (this.depthMeter) hudContainer.appendChild(this.depthMeter.container);
    
    this.createTimerDisplay();
    if (this.timerDisplay) hudContainer.appendChild(this.timerDisplay.container);

    this.createHealthBar();
    if (this.healthBar) hudContainer.appendChild(this.healthBar.container);
    
    // Create other UI elements (append directly to body or container as appropriate)
    this.createInteractionPrompt();
    this.createMemoryFlashback();
    this.createFadeOverlay();
    this.createGameOverScreen();
    this.createControlsDisplay();
    this.createMemoryLogPanel();
    this.createDialogueBox();
    this.createPauseScreen();
    this.createGameWonScreen();
    this.createCrosshair();
    this.createTouchControls();
    
    // Add CSS
    this.addStyles();
  }
  
  createDepthMeter() {
    const container = document.createElement('div');
    container.className = 'ui-element depth-container';
    
    const label = document.createElement('div');
    label.className = 'ui-label';
    label.textContent = 'DEPTH';
    
    const valueElement = document.createElement('div');
    valueElement.className = 'depth-value';
    valueElement.textContent = '0m';
    
    container.appendChild(label);
    container.appendChild(valueElement);
    
    this.depthMeter = { container, value: valueElement };
  }
  
  createTimerDisplay() {
    const container = document.createElement('div');
    container.className = 'ui-element timer-container';

    const label = document.createElement('div');
    label.className = 'ui-label';
    label.textContent = 'TIME';

    const valueElement = document.createElement('div');
    valueElement.className = 'timer-value';
    valueElement.textContent = formatTime(0);

    container.appendChild(label);
    container.appendChild(valueElement);

    this.timerDisplay = { container, value: valueElement };
  }
  
  createHealthBar() {
    const container = document.createElement('div');
    container.className = 'ui-element health-container';

    const label = document.createElement('div');
    label.className = 'ui-label';
    label.textContent = 'HEALTH';

    const barBackground = document.createElement('div');
    barBackground.className = 'health-bar-background';

    const barFill = document.createElement('div');
    barFill.className = 'health-bar-fill';
    barFill.style.width = '100%'; // Start full

    barBackground.appendChild(barFill);
    container.appendChild(label);
    container.appendChild(barBackground);

    this.healthBar = { container, fill: barFill };
  }
  
  createInteractionPrompt() {
    this.interactionPrompt = document.createElement('div');
    this.interactionPrompt.className = 'interaction-prompt';
    this.interactionPrompt.style.display = 'none';
    this.container.appendChild(this.interactionPrompt);
  }
  
  createMemoryFlashback() {
    this.memoryFlashback = document.createElement('div');
    this.memoryFlashback.className = 'memory-flashback';
    this.memoryFlashback.style.display = 'none';
    
    const content = document.createElement('div');
    content.className = 'flashback-content';
    
    const image = document.createElement('div');
    image.className = 'flashback-image';
    
    const text = document.createElement('div');
    text.className = 'flashback-text';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'flashback-close';
    closeButton.textContent = 'Continue';
    closeButton.addEventListener('click', () => {
      this.hideMemoryFlashback();
    });
    
    content.appendChild(image);
    content.appendChild(text);
    content.appendChild(closeButton);
    
    this.memoryFlashback.appendChild(content);
    document.body.appendChild(this.memoryFlashback);
  }
  
  createFadeOverlay() {
    this.fadeOverlay = document.createElement('div');
    this.fadeOverlay.className = 'fade-overlay';
    this.fadeOverlay.style.opacity = '0';
    this.fadeOverlay.style.pointerEvents = 'none';
    document.body.appendChild(this.fadeOverlay);
  }
  
  createGameOverScreen() {
    this.gameOverScreen = document.createElement('div');
    this.gameOverScreen.id = 'game-over-screen';
    this.gameOverScreen.style.display = 'none';
    
    const content = document.createElement('div');
    content.className = 'game-over-content';
    
    const title = document.createElement('h1');
    title.className = 'game-over-title';
    title.textContent = 'JOURNEY ENDED';
    
    const subtitle = document.createElement('h2');
    subtitle.className = 'game-over-reason';
    subtitle.textContent = '...';
    
    const statsContainer = document.createElement('div');
    statsContainer.className = 'game-over-stats';
    
    statsContainer.innerHTML = `
        Score: <span class="stat-value score-stat">0</span><br>
        Time Taken: <span class="stat-value time-stat">00:00</span><br> 
        Artifacts Found: <span class="stat-value artifacts-stat">0 / 4</span><br> 
        Memories Recovered: <span class="stat-value memories-stat">0 / 4</span>
      `;
    
    const restartButton = document.createElement('button');
    restartButton.className = 'restart-button';
    restartButton.textContent = 'Try Again';
    restartButton.addEventListener('click', async () => {
      // Hide the game over screen first
      this.hideGameOver();
      
      // Now call the async restart method
      if (window.game) {
        await window.game.restart();
      }
    });
    
    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(statsContainer);
    content.appendChild(restartButton);
    
    this.gameOverScreen.appendChild(content);
    document.body.appendChild(this.gameOverScreen);
  }
  
  createControlsDisplay() {
    this.controlsDisplay = document.createElement('div');
    this.controlsDisplay.className = 'controls-display';
    this.controlsDisplay.innerHTML = `
      <h4>Controls</h4>
      <ul>
        <li><strong>W/↑:</strong> Forward</li>
        <li><strong>S/↓:</strong> Backward</li>
        <li><strong>A/←:</strong> Turn Left</li>
        <li><strong>D/→:</strong> Turn Right</li>
        <li><strong>Space:</strong> Jump / Swim Up</li>
        <li><strong>Z:</strong> Swim Down</li>
        <li><strong>E:</strong> Interact</li>
        <li><strong>F:</strong> Use Ability</li>
        <li><strong>P:</strong> Pause</li>
      </ul>
    `;
    this.container.appendChild(this.controlsDisplay);
  }
  
  createMemoryLogPanel() {
    this.memoryLogPanel = document.createElement('div');
    this.memoryLogPanel.className = 'memory-log-panel';
    this.memoryLogPanel.style.display = 'none';
    this.memoryLogPanel.innerHTML = `
      <div class="memory-log-content">
        <h2>Memory Log</h2>
        <div class="memory-list-container">
          <ul id="memory-list"></ul>
        </div>
        <div class="memory-detail-container">
          <h3 id="memory-detail-title">Select a Memory</h3>
          <img id="memory-detail-image" src="" alt="Memory Visual" />
          <p id="memory-detail-resonance">Resonance: -</p>
          <p id="memory-detail-content"></p>
        </div>
        <button id="close-memory-log">Close</button>
      </div>
    `;
    document.body.appendChild(this.memoryLogPanel);

    // Add event listener for close button
    document.getElementById('close-memory-log').addEventListener('click', () => {
      this.hideMemoryLog();
    });

    // Add event listener for keyboard toggle (e.g., Tab key)
    // We'll add the input handling later in InputManager/Game
  }
  
  createDialogueBox() {
    this.dialogueBox = document.createElement('div');
    this.dialogueBox.className = 'dialogue-box';
    this.dialogueBox.style.display = 'none';
    this.dialogueBox.innerHTML = `
      <div class="dialogue-speaker" id="dialogue-speaker"></div>
      <div class="dialogue-text" id="dialogue-text"></div>
      <div class="dialogue-prompt" id="dialogue-prompt">Press [E] to continue...</div>
      <div class="dialogue-options" id="dialogue-options"></div>
    `;
    document.body.appendChild(this.dialogueBox);

    // Close on next interact press (will be handled in Game update)
  }
  
  createPauseScreen() {
    this.pauseScreen = document.createElement('div');
    this.pauseScreen.className = 'pause-screen';
    this.pauseScreen.style.display = 'none';
    this.pauseScreen.innerHTML = `
      <div class="pause-content">
        <h1>PAUSED</h1>
        <p>Press 'P' to resume</p>
      </div>
    `;
    document.body.appendChild(this.pauseScreen);
  }
  
  createGameWonScreen() {
    this.gameWonScreen = document.createElement('div');
    this.gameWonScreen.className = 'game-won-screen';
    this.gameWonScreen.style.display = 'none';
    this.gameWonScreen.innerHTML = `
      <div class="game-won-content">
        <h1>VICTORY!</h1>
        <h2>You reached the bottom!</h2>
        <div class="game-over-stats">
          Score: <span class="stat-value score-stat">0</span><br>
          Time Taken: <span class="stat-value time-stat">00:00</span><br>
          Artifacts Found: <span class="stat-value artifacts-stat">0 / 4</span><br>
          Memories Recovered: <span class="stat-value memories-stat">0 / 4</span>
        </div>
        <button class="restart-button" id="play-again-button">Play Again?</button>
      </div>
    `;
    document.body.appendChild(this.gameWonScreen);
    
    // Add listener to the new button
    document.getElementById('play-again-button').addEventListener('click', async () => {
        this.hideGameWon();
        if (window.game) {
            await window.game.restart();
        }
    });
  }
  
  createCrosshair() {
    this.crosshair = document.createElement('div');
    this.crosshair.className = 'crosshair';
    document.body.appendChild(this.crosshair);
  }
  
  createTouchControls() {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouchDevice) {
        return; // Don't create controls if not a touch device
    }

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'touch-controls-container';

    // Movement Buttons (Left Side)
    const moveContainer = document.createElement('div');
    moveContainer.className = 'touch-move-container';
    this.touchControls.forward = this.createTouchButton('▲', 'forward', moveContainer);
    const leftRightContainer = document.createElement('div');
    leftRightContainer.className = 'touch-left-right';
    this.touchControls.left = this.createTouchButton('◄', 'left', leftRightContainer);
    this.touchControls.right = this.createTouchButton('►', 'right', leftRightContainer);
    moveContainer.appendChild(leftRightContainer);
    this.touchControls.backward = this.createTouchButton('▼', 'backward', moveContainer);

    // Action Buttons (Right Side)
    const actionContainer = document.createElement('div');
    actionContainer.className = 'touch-action-container';
    this.touchControls.jump = this.createTouchButton('JUMP', 'jump', actionContainer); // Or an icon
    this.touchControls.interact = this.createTouchButton('E', 'interact', actionContainer);
    this.touchControls.action = this.createTouchButton('F', 'action', actionContainer);
    // Maybe a pause button?
    this.touchControls.pause = this.createTouchButton('P', 'pause', actionContainer);


    controlsContainer.appendChild(moveContainer);
    controlsContainer.appendChild(actionContainer);
    document.body.appendChild(controlsContainer); // Append to body to overlay game canvas
  }

  // Helper to create a single touch button
  createTouchButton(text, actionName, parentElement) {
    const button = document.createElement('div');
    button.className = `touch-button touch-${actionName}`;
    button.textContent = text;
    button.dataset.action = actionName; // Store action name for input manager
    parentElement.appendChild(button);
    return button;
  }
  
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .game-ui {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
        color: white;
        font-family: Arial, sans-serif;
      }
      
      /* Container for HUD elements */
      #hud-container {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          flex-direction: column; 
          align-items: flex-end; 
      }
      
      /* Common style for HUD elements */
      .ui-element {
          background-color: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 5px;
          padding: 8px 12px;
          margin-bottom: 8px; 
          text-align: right;
      }
      
      .ui-label {
        font-size: 10px; /* Smaller label */
        opacity: 0.8;
        margin-bottom: 3px;
        text-transform: uppercase;
      }
      
      .depth-container {
        padding: 10px 15px;
      }
      
      .depth-value {
        font-size: 22px;
        font-weight: bold;
        font-family: 'Courier New', Courier, monospace;
        min-width: 3ch;
        display: inline-block;
      }
      
      .timer-value {
        font-size: 18px;
        font-weight: bold;
        font-family: 'Courier New', Courier, monospace;
        min-width: 5ch;
        display: inline-block;
      }
      
      .interaction-prompt {
        position: absolute;
        bottom: 50px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        padding: 10px 20px;
        border-radius: 20px;
        text-align: center;
        pointer-events: none;
      }
      
      .memory-flashback {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 200;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .flashback-content {
        background-color: rgba(20, 20, 50, 0.9);
        border-radius: 10px;
        padding: 20px;
        max-width: 80%;
        text-align: center;
      }
      
      .flashback-image {
        width: 100%;
        height: 300px;
        background-color: #333;
        margin-bottom: 20px;
        background-size: cover;
        background-position: center;
      }
      
      .flashback-text {
        margin-bottom: 20px;
        font-size: 18px;
        line-height: 1.5;
      }
      
      .flashback-close {
        padding: 10px 20px;
        background-color: #4499ff;
        border: none;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        cursor: pointer;
      }
      
      .fade-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: black;
        z-index: 300;
        transition: opacity 1s ease;
      }
      
      .game-over-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        z-index: 400;
        display: none;
        justify-content: center;
        align-items: center;
        color: white;
      }
      
      .game-over-content { 
          background-color: rgba(50, 20, 20, 0.9);
          border-radius: 10px;
          padding: 30px 40px;
          text-align: center; 
      }
      
      .game-over-title { /* Style for H1 */
          margin-bottom: 10px;
          color: #ff6666;
      }
      .game-over-reason { /* Style for H2 */
          font-size: 18px; 
          font-style: italic;
          opacity: 0.9;
          margin-bottom: 25px;
      }
      .game-over-stats { 
          margin-bottom: 30px;
          font-size: 16px;
          line-height: 1.6;
      }
      .game-over-stats .stat-value { /* Class for the span */
          font-weight: bold;
          font-size: 18px;
          color: #ffdddd;
      }
      .game-over-stats .score-stat { color: #ffffaa; } /* Yellow for score */
      .game-over-stats .time-stat { color: #cccccc; } /* Grey for time */
      .game-over-stats .artifacts-stat { color: #ffdddd; } 
      .game-over-stats .memories-stat { color: #ddddff; } 
      .restart-button {
        padding: 15px 30px;
        background-color: #ff4444;
        border: none;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        font-size: 18px;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      
      .restart-button:hover {
        background-color: #ff6666;
      }
      
      .controls-display {
        position: absolute;
        bottom: 10px;
        left: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        font-family: sans-serif;
      }
      
      .controls-display h4 {
        margin-top: 0;
        margin-bottom: 5px;
        text-align: center;
      }
      
      .controls-display ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
      }
      
      .controls-display li {
        margin-bottom: 3px;
      }

      .memory-log-panel {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 10, 20, 0.9);
        color: #eee;
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: sans-serif;
      }

      .memory-log-content {
        background-color: rgba(10, 30, 50, 0.95);
        padding: 20px;
        border: 1px solid #557799;
        border-radius: 10px;
        width: 80%;
        max-width: 800px;
        height: 70%;
        max-height: 600px;
        display: flex;
        flex-direction: column;
      }

      .memory-log-content h2 {
        text-align: center;
        margin-top: 0;
        margin-bottom: 15px;
        color: #aaddff;
      }
      
      .memory-list-container {
        float: left;
        width: 30%;
        height: calc(100% - 80px);
        overflow-y: auto;
        border-right: 1px solid #557799;
        padding-right: 15px;
        margin-right: 15px;
      }

      #memory-list {
        list-style-type: none;
        padding: 0;
        margin: 0;
      }

      #memory-list li {
        padding: 8px;
        cursor: pointer;
        border-bottom: 1px solid #335577;
        transition: background-color 0.2s;
      }

      #memory-list li:hover {
        background-color: rgba(70, 100, 130, 0.7);
      }

      .memory-detail-container {
        float: left;
        width: calc(70% - 30px);
        height: calc(100% - 80px); 
        overflow-y: auto;
      }

      #memory-detail-image {
        max-width: 150px;
        max-height: 150px;
        float: right;
        margin-left: 15px;
        margin-bottom: 10px;
        border: 1px solid #557799;
      }

      #memory-detail-resonance {
        font-style: italic;
        color: #88aacc;
        margin-top: 5px;
        margin-bottom: 15px;
      }

      #close-memory-log {
        position: absolute;
        bottom: 30px;
        right: 40px;
        padding: 10px 20px;
        background-color: #4477aa;
        border: none;
        color: white;
        border-radius: 5px;
        cursor: pointer;
      }

      .dialogue-box {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 70%;
        max-width: 700px;
        background-color: rgba(10, 20, 40, 0.9);
        border: 1px solid #6688cc;
        border-radius: 8px;
        color: #eee;
        padding: 15px 20px;
        display: none;
        flex-direction: column;
        z-index: 900;
        font-family: sans-serif;
      }

      .dialogue-speaker {
        font-weight: bold;
        color: #aaddff;
        margin-bottom: 8px;
        font-size: 16px;
      }

      .dialogue-text {
        font-size: 14px;
        margin-bottom: 10px;
        line-height: 1.4;
      }

      .dialogue-prompt {
        font-size: 12px;
        color: #88aacc;
        text-align: right;
        font-style: italic;
      }

      .dialogue-options {
        margin-top: 15px;
        border-top: 1px solid #557799;
        padding-top: 10px;
        display: flex;
        gap: 10px;
      }

      .dialogue-options button {
        padding: 8px 15px;
        background-color: #336699;
        border: 1px solid #5588bb;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        flex-grow: 1;
      }

      .dialogue-options button:hover {
        background-color: #4477aa;
      }
      
      .pause-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1100;
        font-family: Arial, sans-serif;
      }
      
      .pause-content {
        text-align: center;
      }
      
      .pause-content h1 {
        font-size: 48px;
        margin-bottom: 10px;
        letter-spacing: 3px;
        text-shadow: 2px 2px 5px rgba(0,0,0,0.5);
      }
      
      .pause-content p {
        font-size: 20px;
        opacity: 0.8;
      }

      .game-won-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(10, 50, 10, 0.9);
        z-index: 450;
        display: none;
        justify-content: center;
        align-items: center;
        color: white;
        font-family: Arial, sans-serif;
      }
      
      .game-won-content {
        background-color: rgba(20, 80, 20, 0.95);
        border-radius: 10px;
        padding: 30px;
        max-width: 80%;
        text-align: center;
      }
      
      .game-won-content h1 {
        color: #aaffaa;
      }

      .crosshair {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 4px;
        height: 4px;
        background-color: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        pointer-events: none;
        display: none;
      }

      .health-container {
        width: 150px;
      }

      .health-bar-background {
        width: 100%;
        height: 12px;
        background-color: #555;
        border: 1px solid #888;
        border-radius: 3px;
        overflow: hidden;
        margin-top: 4px;
      }

      .health-bar-fill {
        height: 100%;
        background-color: #4CAF50;
        width: 100%;
        transition: width 0.3s ease-out;
        border-radius: 2px;
      }

      /* <<< ADD: Touch Control Styles >>> */
      .touch-controls-container {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 150px; /* Adjust height as needed */
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        box-sizing: border-box;
        pointer-events: none; /* Allow clicks/touches to pass through container */
        z-index: 100; /* Ensure controls are above canvas */
      }

      .touch-move-container,
      .touch-action-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: auto; /* Enable touch on button areas */
      }
      
      .touch-action-container {
         align-items: flex-end; /* Align action buttons to the right */
      }
      
      .touch-left-right {
          display: flex;
          width: 100%;
          justify-content: space-between;
      }

      .touch-button {
        background-color: rgba(100, 100, 100, 0.5);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.7);
        border-radius: 50%; /* Circular buttons */
        width: 50px;
        height: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 16px;
        font-weight: bold;
        margin: 5px;
        cursor: pointer;
        user-select: none; /* Prevent text selection */
        -webkit-user-select: none;
        touch-action: manipulation; /* Prevent double-tap zoom etc. */
      }
      
       /* Specific button positioning/sizing if needed */
      .touch-jump {
         width: 60px;
         height: 60px;
      }

      .touch-button:active {
        background-color: rgba(200, 200, 200, 0.7);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  update(gameState) {
    this.gameState = gameState;
    
    // Update depth meter (Depth)
    if (this.depthMeter && this.depthMeter.value && gameState.depth !== undefined) {
        // Display depth directly, ensuring it's rounded
        this.depthMeter.value.textContent = `${Math.round(gameState.depth)}m`;
    }

    // Update Timer
    if (this.timerDisplay && this.timerDisplay.value && gameState.gameTimer !== undefined) {
        this.timerDisplay.value.textContent = formatTime(gameState.gameTimer);
        if (gameState.gameTimer < 30) {
            this.timerDisplay.container.classList.add('low-time');
        } else {
            this.timerDisplay.container.classList.remove('low-time');
        }
    }

    // Update Health Bar
    if (this.healthBar && this.healthBar.fill && gameState.playerHealth) {
      const current = gameState.playerHealth.current;
      const max = gameState.playerHealth.max;

      const healthPercent = (current / max) * 100;

      this.healthBar.fill.style.width = `${Math.max(0, healthPercent)}%`;

      // Optional: Change color based on health percentage
      if (healthPercent < 30) {
        this.healthBar.fill.style.backgroundColor = '#f44336'; // Red when low
      } else if (healthPercent < 60) {
        this.healthBar.fill.style.backgroundColor = '#ffeb3b'; // Yellow when medium
      } else {
        this.healthBar.fill.style.backgroundColor = '#4CAF50'; // Green when high
      }
    }
  }
  
  showInteractionPrompt(text) {
    this.interactionPrompt.textContent = text;
    this.interactionPrompt.style.display = 'block';
  }
  
  hideInteractionPrompt() {
    this.interactionPrompt.style.display = 'none';
  }
  
  showMemoryFlashback(memoryData) {
    const content = this.memoryFlashback.querySelector('.flashback-content');
    const image = content.querySelector('.flashback-image');
    const text = content.querySelector('.flashback-text');
    
    // Set memory content
    if (memoryData.image) {
      image.style.backgroundImage = `url(${memoryData.image})`;
      image.style.display = 'block';
    } else {
      image.style.display = 'none';
    }
    
    text.textContent = memoryData.content || 'A memory flashes before your eyes...';
    
    // Show the flashback
    this.memoryFlashback.style.display = 'flex';
  }
  
  hideMemoryFlashback() {
    this.memoryFlashback.style.display = 'none';
  }
  
  async fadeOut() {
    return new Promise(resolve => {
      this.fadeOverlay.style.opacity = '1';
      this.fadeOverlay.style.pointerEvents = 'auto';
      
      setTimeout(() => {
        resolve();
      }, 1000); // Match the CSS transition duration
    });
  }
  
  async fadeIn() {
    return new Promise(resolve => {
      this.fadeOverlay.style.opacity = '0';
      this.fadeOverlay.style.pointerEvents = 'none';
      
      setTimeout(() => {
        resolve();
      }, 1000); // Match the CSS transition duration
    });
  }
  
  showGameOver(gameState) {
    if (!this.gameOverScreen) return;

    // Find elements within the game over screen
    const titleElement = this.gameOverScreen.querySelector('.game-over-title');
    const reasonElement = this.gameOverScreen.querySelector('.game-over-reason');
    const statsContainer = this.gameOverScreen.querySelector('.game-over-stats'); // Target container

    // Update reason text (H2)
    let reasonText = 'The journey ends here.';
    if (gameState.gameOverReason === 'fall') {
      reasonText = 'You fell into the abyss.';
    }
    if (reasonElement) reasonElement.textContent = reasonText;

    // Update title (H1) based on reason
    if (titleElement) {
        titleElement.textContent = (gameState.gameOverReason === 'fall') ? 'LOST TO THE VOID' : 'JOURNEY ENDED';
    }

    // Update stats (find spans within stats container)
    if (statsContainer) {
        const scoreSpan = statsContainer.querySelector('.score-stat');
        const timeSpan = statsContainer.querySelector('.time-stat');
        const artifactsSpan = statsContainer.querySelector('.artifacts-stat'); 
        const memoriesSpan = statsContainer.querySelector('.memories-stat');
        
        if (scoreSpan) scoreSpan.textContent = gameState.finalScore;
        if (timeSpan) timeSpan.textContent = formatTime(gameState.gameTimer);
        if (artifactsSpan) artifactsSpan.textContent = `${gameState.artifacts} / 4`;
        if (memoriesSpan) memoriesSpan.textContent = `${gameState.memories} / 4`;
    }

    // Show the screen
    this.gameOverScreen.style.display = 'flex';
  }
  
  hideGameOver() {
    this.gameOverScreen.style.display = 'none';
  }

  showMemoryLog() {
    if (this.memoryLogPanel) {
      this.updateMemoryLogList();
      this.memoryLogPanel.style.display = 'flex';
    }
  }

  hideMemoryLog() {
    if (this.memoryLogPanel) {
      this.memoryLogPanel.style.display = 'none';
    }
  }

  updateMemoryLogList() {
    const listElement = document.getElementById('memory-list');
    if (!listElement) return;
    listElement.innerHTML = '';

    const fakeMemories = [
      { id: 'surface_memory_1', data: { content: "Test Memory 1", resonance: 'Hope', imagePath: '' } },
      { id: 'surface_memory_2', data: { content: "Test Memory 2", resonance: 'Sorrow', imagePath: '' } }
    ];

    fakeMemories.forEach(mem => {
      const listItem = document.createElement('li');
      listItem.textContent = mem.id;
      listItem.dataset.memoryId = mem.id;
      listItem.addEventListener('click', () => {
        this.showMemoryDetail(mem);
      });
      listElement.appendChild(listItem);
    });
  }

  showMemoryDetail(memoryData) {
    document.getElementById('memory-detail-title').textContent = memoryData.id;
    document.getElementById('memory-detail-image').src = memoryData.data.imagePath || '/images/memories/default.png';
    document.getElementById('memory-detail-resonance').textContent = `Resonance: ${memoryData.data.resonance || 'Unknown'}`;
    document.getElementById('memory-detail-content').textContent = memoryData.data.content || 'No description available.';
  }

  showDialogue(speaker, text, options = []) {
    if (this.dialogueBox) {
      document.getElementById('dialogue-speaker').textContent = speaker || '';
      document.getElementById('dialogue-text').textContent = text || '...';
      
      const optionsContainer = document.getElementById('dialogue-options');
      const promptElement = document.getElementById('dialogue-prompt');
      optionsContainer.innerHTML = '';

      if (options.length > 0) {
        promptElement.style.display = 'none';
        options.forEach(option => {
          const button = document.createElement('button');
          button.textContent = option.text;
          button.onclick = option.callback;
          optionsContainer.appendChild(button);
        });
      } else {
        promptElement.style.display = 'block';
      }

      this.dialogueBox.style.display = 'flex';
    }
  }

  hideDialogue() {
    if (this.dialogueBox) {
      this.dialogueBox.style.display = 'none';
    }
  }

  showPauseScreen() {
    if (this.pauseScreen) {
      this.pauseScreen.style.display = 'flex';
    }
  }
  
  hidePauseScreen() {
    if (this.pauseScreen) {
      this.pauseScreen.style.display = 'none';
    }
  }

  showGameWon(gameState) {
    if (!this.gameWonScreen) return;
    const statsContainer = this.gameWonScreen.querySelector('.game-over-stats'); 
     if (statsContainer) {
        const scoreSpan = statsContainer.querySelector('.score-stat');
        const timeSpan = statsContainer.querySelector('.time-stat');
        const artifactsSpan = statsContainer.querySelector('.artifacts-stat'); 
        const memoriesSpan = statsContainer.querySelector('.memories-stat');

        if (scoreSpan) scoreSpan.textContent = gameState.finalScore;
        if (timeSpan) timeSpan.textContent = formatTime(gameState.gameTimer);
        if (artifactsSpan) artifactsSpan.textContent = `${gameState.artifacts} / 4`;
        if (memoriesSpan) memoriesSpan.textContent = `${gameState.memories} / 4`;
    }
    this.gameWonScreen.style.display = 'flex';
  }
  
  hideGameWon() {
      if (this.gameWonScreen) {
          this.gameWonScreen.style.display = 'none';
      }
  }

  // <<< ADD: Function to show a temporary message >>>
  showTemporaryMessage(message, duration = 2000) {
    if (this.tempMessageElement) {
      // Remove any existing temporary message immediately
      this.tempMessageElement.remove();
      if (this.tempMessageTimeout) {
        clearTimeout(this.tempMessageTimeout);
      }
    }

    this.tempMessageElement = document.createElement('div');
    this.tempMessageElement.className = 'temporary-message';
    this.tempMessageElement.textContent = message;

    // Basic styling (can be moved to CSS)
    this.tempMessageElement.style.position = 'fixed';
    this.tempMessageElement.style.bottom = '20px';
    this.tempMessageElement.style.left = '50%';
    this.tempMessageElement.style.transform = 'translateX(-50%)';
    this.tempMessageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.tempMessageElement.style.color = 'white';
    this.tempMessageElement.style.padding = '10px 20px';
    this.tempMessageElement.style.borderRadius = '5px';
    this.tempMessageElement.style.zIndex = '1001'; // Above other UI
    this.tempMessageElement.style.textAlign = 'center';
    this.tempMessageElement.style.transition = 'opacity 0.5s ease-out';
    this.tempMessageElement.style.opacity = '1';

    document.body.appendChild(this.tempMessageElement);

    this.tempMessageTimeout = setTimeout(() => {
      if (this.tempMessageElement) {
        this.tempMessageElement.style.opacity = '0';
        // Remove element after fade out transition
        setTimeout(() => {
          if (this.tempMessageElement) {
             this.tempMessageElement.remove();
             this.tempMessageElement = null;
             this.tempMessageTimeout = null;
          }
        }, 500); // Matches transition duration
      }
    }, duration);
  }
} 