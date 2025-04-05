export class UI {
  constructor() {
    // Reference to game state
    this.gameState = null;
    
    // UI elements
    this.container = null;
    this.oxygenMeter = null;
    this.depthMeter = null;
    this.artifactsCounter = null;
    this.memoriesCounter = null;
    this.interactionPrompt = null;
    this.memoryFlashback = null;
    this.fadeOverlay = null;
    this.gameOverScreen = null;
    this.controlsDisplay = null;
    this.memoryLogPanel = null;
    this.dialogueBox = null;
  }
  
  init(gameState) {
    this.gameState = gameState;
    
    // Create main UI container
    this.container = document.createElement('div');
    this.container.className = 'game-ui';
    document.body.appendChild(this.container);
    
    // Create UI elements
    this.createOxygenMeter();
    this.createDepthMeter();
    this.createCollectibleCounters();
    this.createInteractionPrompt();
    this.createMemoryFlashback();
    this.createFadeOverlay();
    this.createGameOverScreen();
    this.createControlsDisplay();
    this.createMemoryLogPanel();
    this.createDialogueBox();
    
    // Add CSS
    this.addStyles();
    
    console.log('UI initialized');
  }
  
  createOxygenMeter() {
    const oxygenContainer = document.createElement('div');
    oxygenContainer.className = 'ui-element oxygen-container';
    
    const label = document.createElement('div');
    label.className = 'ui-label';
    label.textContent = 'OXYGEN';
    
    this.oxygenMeter = document.createElement('div');
    this.oxygenMeter.className = 'oxygen-meter';
    
    const oxygenFill = document.createElement('div');
    oxygenFill.className = 'oxygen-fill';
    this.oxygenMeter.appendChild(oxygenFill);
    
    oxygenContainer.appendChild(label);
    oxygenContainer.appendChild(this.oxygenMeter);
    this.container.appendChild(oxygenContainer);
  }
  
  createDepthMeter() {
    const depthContainer = document.createElement('div');
    depthContainer.className = 'ui-element depth-container';
    
    const label = document.createElement('div');
    label.className = 'ui-label';
    label.textContent = 'DEPTH';
    
    this.depthMeter = document.createElement('div');
    this.depthMeter.className = 'depth-value';
    this.depthMeter.textContent = '0m';
    
    depthContainer.appendChild(label);
    depthContainer.appendChild(this.depthMeter);
    this.container.appendChild(depthContainer);
  }
  
  createCollectibleCounters() {
    const collectiblesContainer = document.createElement('div');
    collectiblesContainer.className = 'ui-element collectibles-container';
    
    // Artifacts counter
    const artifactsWrapper = document.createElement('div');
    artifactsWrapper.className = 'counter-wrapper';
    
    const artifactsLabel = document.createElement('div');
    artifactsLabel.className = 'ui-label';
    artifactsLabel.textContent = 'ARTIFACTS';
    
    this.artifactsCounter = document.createElement('div');
    this.artifactsCounter.className = 'counter-value';
    this.artifactsCounter.textContent = '0';
    
    artifactsWrapper.appendChild(artifactsLabel);
    artifactsWrapper.appendChild(this.artifactsCounter);
    
    // Memories counter
    const memoriesWrapper = document.createElement('div');
    memoriesWrapper.className = 'counter-wrapper';
    
    const memoriesLabel = document.createElement('div');
    memoriesLabel.className = 'ui-label';
    memoriesLabel.textContent = 'MEMORIES';
    
    this.memoriesCounter = document.createElement('div');
    this.memoriesCounter.className = 'counter-value';
    this.memoriesCounter.textContent = '0';
    
    memoriesWrapper.appendChild(memoriesLabel);
    memoriesWrapper.appendChild(this.memoriesCounter);
    
    collectiblesContainer.appendChild(artifactsWrapper);
    collectiblesContainer.appendChild(memoriesWrapper);
    this.container.appendChild(collectiblesContainer);
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
    this.gameOverScreen.className = 'game-over-screen';
    this.gameOverScreen.style.display = 'none';
    
    const content = document.createElement('div');
    content.className = 'game-over-content';
    
    const title = document.createElement('h1');
    title.textContent = 'OXYGEN DEPLETED';
    
    const subtitle = document.createElement('h2');
    subtitle.textContent = 'You could not survive the depths...';
    
    const statsContainer = document.createElement('div');
    statsContainer.className = 'game-over-stats';
    
    const depthStat = document.createElement('div');
    depthStat.innerHTML = 'Max Depth: <span id="max-depth">0m</span>';
    
    const artifactsStat = document.createElement('div');
    artifactsStat.innerHTML = 'Artifacts Found: <span id="artifacts-found">0</span>';
    
    const memoriesStat = document.createElement('div');
    memoriesStat.innerHTML = 'Memories Recovered: <span id="memories-found">0</span>';
    
    statsContainer.appendChild(depthStat);
    statsContainer.appendChild(artifactsStat);
    statsContainer.appendChild(memoriesStat);
    
    const restartButton = document.createElement('button');
    restartButton.className = 'restart-button';
    restartButton.textContent = 'Try Again';
    restartButton.addEventListener('click', () => {
      // This will need to be connected to the Game's restart method
      if (window.game) {
        window.game.restart();
      }
      this.hideGameOver();
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
      
      .ui-element {
        position: absolute;
        padding: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 5px;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      .ui-label {
        font-size: 12px;
        opacity: 0.8;
        margin-bottom: 5px;
      }
      
      .oxygen-container {
        top: 20px;
        left: 20px;
        width: 200px;
      }
      
      .oxygen-meter {
        width: 100%;
        height: 20px;
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 10px;
        overflow: hidden;
        position: relative;
      }
      
      .oxygen-fill {
        height: 100%;
        width: 100%;
        background: linear-gradient(to right, #ff3838, #ff8838, #4499ff);
        transition: width 0.3s;
      }
      
      .depth-container {
        top: 20px;
        right: 20px;
        text-align: right;
      }
      
      .depth-value {
        font-size: 24px;
        font-weight: bold;
      }
      
      .collectibles-container {
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: row;
        gap: 20px;
      }
      
      .counter-wrapper {
        text-align: center;
      }
      
      .counter-value {
        font-size: 20px;
        font-weight: bold;
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
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .game-over-content {
        background-color: rgba(50, 20, 20, 0.9);
        border-radius: 10px;
        padding: 30px;
        max-width: 80%;
        text-align: center;
      }
      
      .game-over-stats {
        margin: 20px 0;
        font-size: 18px;
        line-height: 1.8;
      }
      
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
        display: none; /* Hidden by default */
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
        height: calc(100% - 80px); /* Adjust based on header/footer height */
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
        width: calc(70% - 30px); /* Adjust for padding/margins */
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
        bottom: 30px; /* Adjust positioning */
        right: 40px; /* Adjust positioning */
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
        display: none; /* Hidden by default */
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
        display: flex; /* Use flexbox for buttons */
        gap: 10px; /* Spacing between buttons */
      }

      .dialogue-options button {
        padding: 8px 15px;
        background-color: #336699;
        border: 1px solid #5588bb;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        flex-grow: 1; /* Make buttons share space */
      }

      .dialogue-options button:hover {
        background-color: #4477aa;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  update(gameState) {
    // Update oxygen meter
    const oxygenFill = this.oxygenMeter.querySelector('.oxygen-fill');
    oxygenFill.style.width = `${gameState.oxygen}%`;
    
    // Change color based on oxygen level
    if (gameState.oxygen < 30) {
      oxygenFill.style.backgroundColor = '#ff3838'; // Red when low
    } else if (gameState.oxygen < 60) {
      oxygenFill.style.backgroundColor = '#ff8838'; // Orange when medium
    } else {
      oxygenFill.style.backgroundColor = '#4499ff'; // Blue when high
    }
    
    // Update depth meter
    this.depthMeter.textContent = `${Math.round(gameState.depth)}m`;
    
    // Update collectible counters
    this.artifactsCounter.textContent = gameState.artifacts;
    this.memoriesCounter.textContent = gameState.memories;
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
  
  showGameOver() {
    // Update stats in game over screen
    const maxDepthElement = document.getElementById('max-depth');
    const artifactsFoundElement = document.getElementById('artifacts-found');
    const memoriesFoundElement = document.getElementById('memories-found');
    
    if (maxDepthElement) maxDepthElement.textContent = `${Math.round(this.gameState.depth)}m`;
    if (artifactsFoundElement) artifactsFoundElement.textContent = this.gameState.artifacts;
    if (memoriesFoundElement) memoriesFoundElement.textContent = this.gameState.memories;
    
    // Show the screen
    this.gameOverScreen.style.display = 'flex';
  }
  
  hideGameOver() {
    this.gameOverScreen.style.display = 'none';
  }

  showMemoryLog() {
    if (this.memoryLogPanel) {
      this.updateMemoryLogList(); // Populate the list when shown
      this.memoryLogPanel.style.display = 'flex';
    }
  }

  hideMemoryLog() {
    if (this.memoryLogPanel) {
      this.memoryLogPanel.style.display = 'none';
    }
  }

  updateMemoryLogList() {
    // TODO: Get collected memories from Game state and populate the #memory-list ul
    const listElement = document.getElementById('memory-list');
    if (!listElement) return;
    listElement.innerHTML = ''; // Clear previous list

    // Example: (Replace with actual data later)
    const fakeMemories = [
      { id: 'surface_memory_1', data: { content: "Test Memory 1", resonance: 'Hope', imagePath: '' } },
      { id: 'surface_memory_2', data: { content: "Test Memory 2", resonance: 'Sorrow', imagePath: '' } }
    ];

    fakeMemories.forEach(mem => {
      const listItem = document.createElement('li');
      listItem.textContent = mem.id; // Display ID for now
      listItem.dataset.memoryId = mem.id;
      listItem.addEventListener('click', () => {
        this.showMemoryDetail(mem); // Show details when clicked
      });
      listElement.appendChild(listItem);
    });
  }

  showMemoryDetail(memoryData) {
    // TODO: Update the detail view elements
    document.getElementById('memory-detail-title').textContent = memoryData.id; // Use ID as title for now
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
      optionsContainer.innerHTML = ''; // Clear old options

      if (options.length > 0) {
        promptElement.style.display = 'none'; // Hide "Press E" prompt
        options.forEach(option => {
          const button = document.createElement('button');
          button.textContent = option.text;
          button.onclick = option.callback; // Assign callback function
          optionsContainer.appendChild(button);
        });
      } else {
        promptElement.style.display = 'block'; // Show "Press E" prompt
      }

      this.dialogueBox.style.display = 'flex';
    }
  }

  hideDialogue() {
    if (this.dialogueBox) {
      this.dialogueBox.style.display = 'none';
      // Unpause game?
    }
  }
} 