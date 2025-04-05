import * as THREE from 'three';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { Player } from '../entities/player.js';
import { LevelManager } from '../world/level.js';
import { UI } from '../ui/ui.js';
import { AudioManager } from './audio.js';
import { NetworkManager } from './network.js';

// <<< DEFINE WebSocket Server URL (Replace with your actual server URL) >>>
const WEBSOCKET_URL = 'wss://vibegame-game-server.onrender.com'; // <<< UPDATED

export class Game {
  constructor() {
    this.clock = new THREE.Clock();
    this.renderer = new Renderer();
    this.input = new InputManager();
    this.levelManager = new LevelManager();
    this.player = null;
    this.ui = new UI();
    this.audio = new AudioManager();
    this.isRunning = false;
    this.isPaused = false;
    this.isUserPaused = false;
    this.interactingNPC = null;
    this.initialPlayerPosition = null;
    
    // <<< ADD Multiplayer State >>>
    this.network = null;
    this.clientId = null;
    this.otherPlayers = {}; // Store other players' data/meshes { id: { mesh, state } }
    this.lastNetworkUpdate = 0; // Timer for throttling network updates
    this.networkUpdateInterval = 100; // Send updates every 100ms
    
    // <<< ADD Map Regeneration State >>>
    this.mapRegenInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.timeSinceLastRegen = 0;

    // Game state
    this.state = {
      artifacts: 0,
      memories: 0,
      collectedMemories: [],
      depth: 0,
      gameTimer: 0,
      playerHealth: null,
      gameOverReason: null,
      gameWon: false,
      finalScore: 0
    };

    // Bind methods
    this.update = this.update.bind(this);
  }

  async init() {
    // Initialize systems
    await this.audio.init();
    this.renderer.init();
    this.input.init();
    this.ui.init(this.state);
    
    // Create first level
    await this.levelManager.loadLevel(0);
    
    // Get player start position with a fallback
    const startPosition = this.levelManager.getPlayerStartPosition() || new THREE.Vector3(0, 2, 0);
    this.initialPlayerPosition = startPosition.clone();
    this.player = new Player(startPosition);
    
    // Add player to the scene
    this.levelManager.scene.add(this.player.mesh);
    
    // Set camera to follow player
    this.renderer.setFollowTarget(this.player.mesh);
    
    // Start the game loop
    this.isRunning = true;
    this.clock.start();
    this.update();
    
    // Maybe play a general ambient track?
    this.audio.playMusic('surface', { volume: 0.4 }); // Play surface music quieter

    // <<< ADD: Connect to WebSocket Server >>>
    this.network = new NetworkManager(WEBSOCKET_URL, this); 
    this.network.connect();
  }

  update() {
    if (!this.isRunning) return;
    
    // <<< MOVE: Calculate deltaTime first
    const deltaTime = this.isUserPaused ? 0 : this.clock.getDelta(); // Get deltaTime ONLY if not user-paused
    
    // Always get input state first
    const inputState = this.input.getInputState();

    // --- Check for User Pause Toggle --- 
    if (inputState.pause) {
        this.togglePause();
        this.input.clearInputState(); // Consume the pause input for this frame
    }

    // Handle Dialogue Pause State (takes precedence over user pause for dialogue flow)
    if (this.isPaused && this.interactingNPC) { // Paused for dialogue
      if (inputState.interact && this.interactingNPC) {
        // If paused for dialogue and interact is pressed, get the next line
        
        // <<< MODIFY: Check for win condition NPC interaction >>>
        if (this.interactingNPC.appearance?.isWinConditionNPC) {
          this.checkWinCondition();
          // If checkWinCondition triggers win, it will set isRunning = false
          // If not won, proceed with normal dialogue or end it
          if (this.isRunning) {
             this.unpauseAndEndDialogue();
          }
        }
        // Original Trade Logic (can be kept or removed)
        // else {
        //   const nextDialogueData = this.interactingNPC.interact();
        //   if (nextDialogueData.canTrade) {
        //     this.presentTradeOptions(nextDialogueData);
        //   } else if (nextDialogueData.isComplete) {
        //     this.unpauseAndEndDialogue();
        //   } else {
        //     this.ui.showDialogue(nextDialogueData.speaker, nextDialogueData.text);
        //     this.input.clearInputState(); // Consume input for this frame
        //   }
        // }
         else { // <<< ADD: Handle non-win NPC dialogue >>>
             // Default behavior: just end dialogue after first interaction for non-win NPCs
             this.unpauseAndEndDialogue();
         }
      } else if (inputState.interact && !this.interactingNPC) {
          // Failsafe: If paused but somehow lost NPC ref, just unpause
          this.unpauseAndEndDialogue();
      }
      // Still need to keep the animation frame loop going while paused
      requestAnimationFrame(this.update);
      return; // Prevent rest of update logic (player movement etc.)
    }
    
    // --- Handle User Pause State --- 
    if (this.isUserPaused) {
        // Optional: Render a pause screen overlay via UI
        this.renderer.render(this.levelManager.scene, 0); // Render static scene
        requestAnimationFrame(this.update);
        return; // Skip game logic updates
    }
    
    // --- If NOT paused (by dialogue or user) --- 
    // const dialogueData = this.player.getCurrentDialogue();
    // console.log(`[Game.update] Received dialogue data from player:`, dialogueData); 
    // if (dialogueData) { ... } else { ... }
    
    // Normal game updates only if NOT starting dialogue
    this.player.update(deltaTime, inputState, this.levelManager);

    // <<< MODIFY: Check for player death and respawn >>>
    if (this.player.checkIfDead()) {
      this.respawnPlayer('death_by_fall'); // Use new reason
      // Skip the rest of the update for this frame after respawn
      requestAnimationFrame(this.update);
      return;
    }

    this.levelManager.update(deltaTime, this.player);
    
    // Process collected items
    const collectedItems = this.player.getCollectedItems();
    collectedItems.forEach(itemData => {
      if (itemData.type === 'artifact') {
        this.collectArtifact(itemData);
      } else if (itemData.type === 'memory') {
        this.collectMemory(itemData);
      } else if (itemData.type === 'health') {
        this.player.heal(50); // Heal 50%
      }
    });

    // Update game state (only checks win/lose now)
    this.updateGameState(deltaTime);

    // Update UI (non-dialogue parts)
    this.ui.update(this.state);
    
    // Render the current frame (happens whether paused check passed or not, unless returned early)
    this.renderer.render(this.levelManager.scene, deltaTime);
    
    // Continue the game loop
    requestAnimationFrame(this.update);

    // <<< ADD: Send player state periodically >>>
    const now = performance.now();
    if (this.network && this.clientId && now - this.lastNetworkUpdate > this.networkUpdateInterval) {
      this.sendPlayerState();
      this.lastNetworkUpdate = now;
    }
    
    // <<< ADD: Check for Map Regeneration >>>
    if (!this.isUserPaused && !this.isPaused) { // Only update timer if game is active
       this.timeSinceLastRegen += deltaTime * 1000; // deltaTime is in seconds
       if (this.timeSinceLastRegen >= this.mapRegenInterval) {
          this.regenerateLevel();
          // Don't return here, let the rest of the frame process before potential async reload
       }
    }
  }
  
  updateGameState(deltaTime) {
    // <<< MODIFY: Calculate Depth from first platform surface (145.5) >>>
    const firstPlatformTopY = 145.5; // Platform center Y (145) + half height (0.5)
    this.state.depth = Math.max(0, firstPlatformTopY - this.player.mesh.position.y);

    // <<< ADD: Update player health in game state >>>
    if (this.player && this.player.getHealthState) {
      const healthData = this.player.getHealthState(); // Get the data
      this.state.playerHealth = healthData; // Assign it
    }

    // Increment Timer 
    if (!this.isUserPaused && !this.isPaused) { 
        this.state.gameTimer += deltaTime; // Count up
    }

    // Check for falling out of world
    if (this.player.mesh.position.y < -20) { 
      this.gameOver('fall');
    }

    // Basic win condition - reaching the bottom
    if (this.player.isGrounded && this.player.mesh.position.y < 5) { // Adjust Y threshold as needed
      // Optional: Check if all artifacts are collected first
      // const totalArtifacts = this.levelManager.collectibles.filter(c => c.type === 'artifact').length;
      // if (this.state.artifacts >= totalArtifacts) {
        this.gameWon();
      // }
    }
  }
  
  collectArtifact(artifactData) {
    this.state.artifacts++;
    // Apply artifact effect
    if (artifactData.effect) {
      this.applyArtifactEffect(artifactData.effect);
    }
    // Play collection sound
    this.audio.play('artifact_collect');

    // <<< MODIFY: Enable HIGH jump on first artifact collect >>>
    if (this.state.artifacts === 1 && this.player) {
        this.player.enableHighJump();
    }
  }
  
  collectMemory(memoryData) {
    this.state.memories++;
    // Add the full memory data to the collected list if not already present
    if (!this.state.collectedMemories.some(m => m.id === memoryData.id)) {
        this.state.collectedMemories.push(memoryData);
    }
    // <<< COMMENT OUT: Disable flashback UI >>>
    // this.ui.showMemoryFlashback(memoryData);
    // Play memory sound
    this.audio.play('memory_collect');
  }
  
  applyArtifactEffect(effect) {
    // Apply various effects based on artifact type
    switch (effect.type) {
      case 'oxygen_efficiency':
        // <<< REMOVE/COMMENT OUT: No longer relevant >>>
        // Improve oxygen efficiency
        break;
      case 'night_vision':
        // Enable night vision
        this.renderer.enableNightVision();
        break;
      case 'telekinesis':
        // Enable telekinesis ability
        this.player.enableTelekinesis();
        break;
    }
  }
  
  gameOver(reason = 'unknown') { 
    if (!this.isRunning) return; 
    this.isRunning = false;
    this.state.gameOverReason = reason;
    
    // <<< MODIFY Score Calculation >>>
    // Remove time penalty
    // const timePenalty = Math.floor(this.state.gameTimer * 10); 
    const artifactBonus = this.state.artifacts * 500; 
    // Add fall penalty - e.g., penalize heavily for falls over a certain threshold
    const fallThreshold = 10; // Only penalize falls greater than 10 units
    const fallPenaltyMultiplier = 50; // Points lost per unit fallen over threshold
    const fallPenalty = Math.max(0, (this.player.maxFallDistanceThisSession - fallThreshold)) * fallPenaltyMultiplier;
    
    this.state.finalScore = Math.max(0, 10000 + artifactBonus - fallPenalty); 
    
    this.ui.showGameOver(this.state); 
    this.audio.play('game_over');
    
    // Stop music on game over
    this.audio.stopMusic();
    // <<< ADD: Stop looping sounds >>>
    this.audio.stopAllLoops(); 
  }
  
  async restart() {
    // Reset game state
    this.state = {
      artifacts: 0,
      memories: 0,
      collectedMemories: [],
      depth: 0, 
      gameTimer: 0, 
      playerHealth: null,
      gameOverReason: null,
      gameWon: false,
      finalScore: 0 
    };

    // <<< Reset Player Stats >>>
    if (this.player) {
        this.player.resetSessionStats();
    }
    
    // Ensure UI is reset 
    this.ui.hideGameOver(); 
    
    // Stop music before restart transition
    this.audio.stopMusic();
    
    // <<< SIMPLIFY: Reload level 0 directly, no transition >>>
    await this.levelManager.loadLevel(0);
    const newPosition = this.levelManager.getEntryPosition('start');
    this.player.setPosition(newPosition);
    this.levelManager.scene.add(this.player.mesh); // Re-add player to scene
    this.audio.playMusic('surface', { volume: 0.4 }); // Restart music
    
    // Restart the game loop
    this.isRunning = true;
    this.isPaused = false;
    this.isUserPaused = false;
    this.interactingNPC = null;
    this.clock.start();
    this.update();
  }

  // Helper function to unpause and clean up dialogue state
  unpauseAndEndDialogue() {
    this.ui.hideDialogue();
    this.isPaused = false;
    this.interactingNPC = null;
    this.input.clearInputState(); 
  }

  // <<< ADD: Toggle Pause Method
  togglePause() {
    this.isUserPaused = !this.isUserPaused;
    if (this.isUserPaused) {
      this.clock.stop(); // Stop the clock to halt physics time
      this.audio.pauseAudio(); // <<< Use new method
      this.ui.showPauseScreen(); // Show UI overlay
    } else {
      this.clock.start(); // Resume the clock
      this.audio.resumeAudio(); // <<< Use new method
      this.ui.hidePauseScreen(); // Hide UI overlay
    }
  }

  // <<< MODIFY: Check Win Condition >>>
  checkWinCondition() {
    // Win condition is now simply interacting with the Guardian after spawning
    if (this.interactingNPC && this.interactingNPC.name === "Guardian of the Depths") {
        this.gameWon();
    } else {
        // This should ideally not be reached if interaction logic is correct,
        // but leave a failsafe dialogue
        this.ui.showDialogue(
            this.interactingNPC?.name || "???",
            `Something seems incomplete...`,
            [{ text: "(Leave)", callback: () => this.unpauseAndEndDialogue() }]
        );
        this.input.clearInputState();
    }
  }

  gameWon() {
    if (!this.isRunning) return; 
    this.isRunning = false;
    this.state.gameWon = true;
    
    // <<< MODIFY Score Calculation >>>
    // const timePenalty = Math.floor(this.state.gameTimer * 10);
    const artifactBonus = this.state.artifacts * 500; 
    const fallThreshold = 10; 
    const fallPenaltyMultiplier = 50; 
    const fallPenalty = Math.max(0, (this.player.maxFallDistanceThisSession - fallThreshold)) * fallPenaltyMultiplier;
    
    this.state.finalScore = Math.max(0, 10000 + artifactBonus - fallPenalty);
      
    this.audio.stopMusic(); 
    this.audio.play('game_win_sound');
    this.ui.showGameWon(this.state); // Pass updated state
  }

  // <<< MODIFY: Player Respawn Logic >>>
  respawnPlayer(reason = 'unknown') {
    if (!this.player || !this.initialPlayerPosition) {
      console.error("Cannot respawn: Player or initial position missing. Triggering full game over.");
      this.gameOver('respawn_error');
      return;
    }

    // <<< MODIFY: Use player's internal reset method >>>
    this.player.resetForRespawn();

    // Move player back to start
    this.player.setPosition(this.initialPlayerPosition);

    // Briefly show a message via UI
    this.ui.showTemporaryMessage("Respawning...", 2000); // Simpler message

    // Ensure game continues running
    this.isRunning = true;
    this.isPaused = false;
    this.isUserPaused = false;

    // Optional: Add a small visual/audio cue for respawn
    this.audio.play('player_respawn'); // Assuming you have a sound named 'player_respawn'

    // <<< ADD: Reset player health on respawn >>>
    if (this.player && this.player.maxHealth) {
      this.player.currentHealth = this.player.maxHealth;
    }
  }

  // <<< ADD: Send player state to server >>>
  sendPlayerState() {
    if (!this.player || !this.clientId) return;
    
    const stateToSend = {
      position: this.player.mesh.position.toArray(),
      rotation: this.player.mesh.quaternion.toArray(), // Send quaternion for rotation
      health: this.player.currentHealth, // Include health
      // Add any other relevant state: isJumping, isFalling, animationState etc.
    };
    
    this.network.send('playerStateUpdate', stateToSend);
  }
  
  // <<< ADD: Send Chat Message >>>
  sendChatMessage(message) {
    if (!this.network || !this.clientId) {
      console.warn("Cannot send chat message: Network not ready.");
      return;
    }
    if (!message || message.length === 0 || message.length > 100) {
      console.warn("Cannot send empty or too long chat message.");
      return;
    }
    // Basic sanitization (can be improved)
    const sanitizedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    this.network.send('chatMessage', { text: sanitizedMessage });
    // Optionally display own message immediately
    this.ui.showChatMessage(this.clientId.substring(0, 6), sanitizedMessage); // Show shortened ID
  }

  // <<< ADD: Handlers for Network Messages >>>
  setClientId(id) {
     this.clientId = id;
     console.log(`Game received Client ID: ${id}`);
  }
  
  handleWorldState(playersData) {
    console.log("Received initial world state:", playersData);
    // Clear existing other players
    Object.keys(this.otherPlayers).forEach(id => this.removeOtherPlayer(id));
    
    // Add players from the received state
    playersData.forEach(playerData => {
       if (playerData.id !== this.clientId) { // Don't add self
          this.addOtherPlayer(playerData);
       }
    });
  }
  
  handlePlayerJoined(playerData) {
    console.log("Player joined:", playerData);
    if (playerData.id !== this.clientId) { // Don't add self
       this.addOtherPlayer(playerData);
    }
  }
  
  handlePlayerLeft(playerId) {
    console.log(`Player left: ${playerId}`);
    this.removeOtherPlayer(playerId);
  }
  
  handlePlayerUpdate(playerId, state) {
    // console.log(`Received update for player ${playerId}:`, state);
    const otherPlayer = this.otherPlayers[playerId];
    if (otherPlayer && otherPlayer.mesh && state) {
       // Directly set position and rotation for now (consider interpolation later)
       if (state.position) {
          otherPlayer.mesh.position.fromArray(state.position);
       }
       if (state.rotation) {
          otherPlayer.mesh.quaternion.fromArray(state.rotation);
       }
       // Update other visual state if needed (health bar, animations etc.)
       otherPlayer.state = state; // Store latest state
    } else if (!otherPlayer) {
      // Optional: If update received for unknown player, request full state or ignore
      console.warn(`Received update for unknown player ID: ${playerId}`);
    }
  }
  
  // <<< ADD: Handle incoming chat messages >>>
  handleChatMessage(senderId, messageText) {
     if (senderId === this.clientId) return; // Already displayed own message
     console.log(`Chat from ${senderId}: ${messageText}`);
     // Use a shortened version of the sender ID for display
     const displayName = senderId.substring(0, 6);
     this.ui.showChatMessage(displayName, messageText);
  }

  handleDisconnect() {
      console.warn("Disconnected from server.");
      // Clear other players on disconnect
      Object.keys(this.otherPlayers).forEach(id => this.removeOtherPlayer(id));
      // Optionally show a UI message
      this.ui?.showTemporaryMessage("Disconnected from server", 5000);
  }
  
  // <<< ADD: Helper methods for managing other player visuals >>>
  addOtherPlayer(playerData) {
      if (!playerData || !playerData.id || this.otherPlayers[playerData.id]) {
         console.warn("Attempted to add invalid or existing player data", playerData);
         return; // Already exists or invalid data
      }
      
      // Create a simple mesh representation for the other player
      // (Use a different color or model than the local player)
      const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
      const material = new THREE.MeshStandardMaterial({ color: 0xff6633 }); // Orange color
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, -100, 0); // Start off-screen until first update
      if (playerData.state && playerData.state.position) {
          mesh.position.fromArray(playerData.state.position);
      }
      if (playerData.state && playerData.state.rotation) {
          mesh.quaternion.fromArray(playerData.state.rotation);
      }
      
      this.levelManager.scene.add(mesh);
      this.otherPlayers[playerData.id] = { mesh: mesh, state: playerData.state || {} };
      console.log(`Added visual for player ${playerData.id}`);
  }
  
  removeOtherPlayer(playerId) {
     const otherPlayer = this.otherPlayers[playerId];
     if (otherPlayer && otherPlayer.mesh) {
        this.levelManager.scene.remove(otherPlayer.mesh);
        console.log(`Removed visual for player ${playerId}`);
     }
     delete this.otherPlayers[playerId];
  }

  // <<< ADD: Map Regeneration Logic >>>
  async regenerateLevel() {
    console.log(`Map regeneration triggered after ${this.timeSinceLastRegen / 1000} seconds.`);
    this.ui?.showTemporaryMessage("Regenerating level...", 3000);
    
    // Reset timer immediately
    this.timeSinceLastRegen = 0;
    
    // Clear visual representation of other players (as their positions are relative to the old map)
    Object.keys(this.otherPlayers).forEach(id => this.removeOtherPlayer(id));
    this.otherPlayers = {}; // Reset the cache
    
    // Stop current music maybe?
    this.audio.stopMusic();
    
    // Reload level 0 (which handles clearing old scene objects)
    await this.levelManager.loadLevel(0);
    
    // Get the new start position from the reloaded level
    // Use the specific playerStart from level definition, not necessarily the first platform
    this.initialPlayerPosition = this.levelManager.getEntryPosition('start') || new THREE.Vector3(0, 150, 0);
    
    // Reposition the player
    if (this.player) {
        this.player.setPosition(this.initialPlayerPosition);
        // Ensure player mesh is in the new scene (loadLevel replaces the scene)
        this.levelManager.scene.add(this.player.mesh);
        // Also reset fall state in case they were falling during regen
        this.player.isFalling = false;
        this.player.currentFallDistance = 0;
        this.player.jumpStartY = null;
        this.player.velocity.set(0,0,0);
    }
    
    // Restart music
    this.audio.playMusic('surface', { volume: 0.4 });
    
    console.log("Map regeneration complete.");
  }
} 