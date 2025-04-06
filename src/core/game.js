import * as THREE from 'three';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { Player } from '../entities/player.js';
import { LevelManager } from '../world/level.js';
import { UI } from '../ui/ui.js';
import { AudioManager } from './audio.js';
import { NetworkManager } from './network.js';
import { SupabaseService } from './supabaseService.js';

// <<< DEFINE WebSocket Server URL (Replace with your actual server URL) >>>
const WEBSOCKET_URL = 'wss://vibegame-game-server.onrender.com'; // <<< UPDATED

export class Game {
  constructor(playerName = "Anon") { // <<< ACCEPT playerName >>>
    this.clock = new THREE.Clock();
    this.renderer = new Renderer();
    this.input = new InputManager();
    this.levelManager = new LevelManager();
    this.player = null;
    this.ui = new UI();
    this.audio = new AudioManager();
    this.supabase = new SupabaseService(); // <<< INSTANTIATE
    this.isRunning = false;
    this.interactingNPC = null;
    this.initialPlayerPosition = null;
    
    // <<< ADD Multiplayer State >>>
    this.network = null;
    this.clientId = null;
    this.playerName = playerName; // <<< STORE playerName >>>
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
    this.ui.init(this.state, this.input);
    
    // <<< Pass chat input element to InputManager >>>
    const chatInputElement = this.ui.chatUI.input; // Get the element from UI
    this.input.init(chatInputElement); // Pass it during initialization
    
    // <<< ADD: Fetch and Display Initial High Scores >>>
    if (this.supabase && typeof this.supabase.getHighScores === 'function') {
        this.supabase.getHighScores().then(scores => {
            this.ui.showInitialHighScores(scores);
        }).catch(e => {
            console.error("Failed to get initial high scores:", e);
            this.ui.showInitialHighScores([]); // Show panel even on error
        });
    } else {
         console.warn("Supabase service not available for initial high score fetch.");
         // Optionally show panel with error/loading state
         // this.ui.showInitialHighScores([]); 
    }

    // Create first level
    await this.levelManager.loadLevel(0);
    
    // Get player start position with a fallback
    const startPosition = this.levelManager.getPlayerStartPosition() || new THREE.Vector3(0, 2, 0);
    this.initialPlayerPosition = startPosition.clone();
    this.player = new Player(startPosition, this.playerName); // <<< PASS Name >>>
    
    // Add player to the scene
    this.levelManager.scene.add(this.player.mesh);
    
    // Set camera to follow player
    this.renderer.setFollowTarget(this.player.mesh);
    
    // Connect to WebSocket Server
    this.network = new NetworkManager(WEBSOCKET_URL, this);
    this.network.connect();

    // <<< ADD: Start Game Loop Function (called by UI button) >>>
    this.startGameLoop = () => {
       if (this.isRunning) return; // Prevent multiple starts
       console.log("Starting game loop...");
       this.isRunning = true;
       this.clock.start();
       this.update();
       this.audio.playMusic('surface', { volume: 0.4 });
       this.ui.hideInitialHighScores(); // Ensure panel is hidden
    };
    // Assign it to window for the UI button to call easily for now
    window.startGameLoop = this.startGameLoop;
  }

  update() {
    if (!this.isRunning) return;
    
    // <<< MOVE: Calculate deltaTime first
    const deltaTime = this.clock.getDelta();
    
    // Always get input state first
    const inputState = this.input.getInputState();

    // --- Handle Interactions (Simplified) ---
    if (inputState.interact) {
      if (this.interactingNPC) {
         // If already interacting, check win condition or end dialogue
         if (this.interactingNPC.appearance?.isWinConditionNPC) {
             this.checkWinCondition(); 
         } 
         this.unpauseAndEndDialogue(); // End dialogue regardless (win sets isRunning=false)
      } else {
         // If not interacting, check for nearby NPCs
         const nearbyNPC = this.levelManager.findNearbyInteractable(this.player.mesh.position, 2.0);
         if (nearbyNPC) {
            this.startInteraction(nearbyNPC);
         } else {
             // Maybe trigger player's own interact action if no NPC?
             this.player.handleInteract();
         }
      }
      this.input.clearInputState(); // Consume interact input
    }
    
    // If dialogue is active, don't update player/world (prevents movement during dialogue)
    if (this.interactingNPC) {
       this.renderer.render(this.levelManager.scene, deltaTime);
       requestAnimationFrame(this.update); // Keep rendering
       return; // Skip player/world update
    }
    
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
    this.timeSinceLastRegen += deltaTime * 1000; // deltaTime is in seconds
    if (this.timeSinceLastRegen >= this.mapRegenInterval) {
       this.regenerateLevel();
       // Don't return here, let the rest of the frame process before potential async reload
    }

    // Update other player name sprite positions (after local player update)
    Object.values(this.otherPlayers).forEach(otherPlayer => {
       if (otherPlayer.mesh && otherPlayer.nameSprite) {
           otherPlayer.nameSprite.position.set(
               otherPlayer.mesh.position.x,
               otherPlayer.mesh.position.y + 2.5, // Keep offset consistent
               otherPlayer.mesh.position.z
           );
       }
    });
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
    this.state.gameTimer += deltaTime; // Count up

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
    
    // <<< IMPLEMENT NEW Score Calculation >>>
    const BaseTimeScore = 10000;
    const PenaltyPerSecond = 10;
    const PointsPerArtifact = 150;
    const PointsPerMemory = 75;

    const elapsedSeconds = this.state.gameTimer;
    const numArtifacts = this.state.artifacts;
    const numMemories = this.state.memories;

    const TimeScore = Math.max(0, BaseTimeScore - (elapsedSeconds * PenaltyPerSecond));
    const CollectibleScore = (numArtifacts * PointsPerArtifact) + (numMemories * PointsPerMemory);
    const CalculatedScore = TimeScore + CollectibleScore;

    this.state.finalScore = Math.floor(CalculatedScore); 
    
    // Save High Score (async but we don't need to wait here)
    this.supabase.saveHighScore(
      this.playerName, 
      this.state.finalScore,
      this.state.gameTimer, // Pass game time
      this.state.artifacts  // Pass artifacts collected
    ).catch(e => console.error("Failed to save high score on game over:", e)); 
    
    // <<< Fetch and display high scores >>>
    this.supabase.getHighScores().then(scores => {
        this.ui.showGameOver(this.state, scores); // Pass scores to UI
    }).catch(e => {
        console.error("Failed to get high scores for game over screen:", e);
        this.ui.showGameOver(this.state, []); // Show screen even if fetch fails
    });
    
    this.audio.play('game_over');
    
    // Stop music on game over
    this.audio.stopMusic();
    // <<< ADD: Stop looping sounds >>>
    this.audio.stopAllLoops(); 
    this.input.clearInputState();
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
    this.interactingNPC = null;
    this.clock.start();
    this.update();
  }

  // Helper function to unpause and clean up dialogue state
  unpauseAndEndDialogue() {
    this.ui.hideDialogue();
    this.interactingNPC = null;
    this.input.clearInputState(); 
  }

  // <<< ADD: Start Interaction Method >>>
  startInteraction(npc) {
      this.interactingNPC = npc;
      const dialogueData = npc.getInitialDialogue ? npc.getInitialDialogue() : { speaker: npc.name, text: "..." };
      this.ui.showDialogue(dialogueData.speaker, dialogueData.text); // Show only initial text
      this.input.clearInputState(); // Consume input
  }

  gameWon() {
    if (!this.isRunning) return; 
    this.isRunning = false;
    this.state.gameWon = true;
    
    // <<< IMPLEMENT NEW Score Calculation >>>
    const BaseTimeScore = 10000;
    const PenaltyPerSecond = 10;
    const PointsPerArtifact = 150;
    const PointsPerMemory = 75;

    const elapsedSeconds = this.state.gameTimer;
    const numArtifacts = this.state.artifacts;
    const numMemories = this.state.memories;

    const TimeScore = Math.max(0, BaseTimeScore - (elapsedSeconds * PenaltyPerSecond));
    const CollectibleScore = (numArtifacts * PointsPerArtifact) + (numMemories * PointsPerMemory);
    const CalculatedScore = TimeScore + CollectibleScore;
      
    this.state.finalScore = Math.floor(CalculatedScore);
      
    // Save High Score (async but we don't need to wait here)
    this.supabase.saveHighScore(
      this.playerName, 
      this.state.finalScore,
      this.state.gameTimer, // Pass game time
      this.state.artifacts  // Pass artifacts collected
    ).catch(e => console.error("Failed to save high score on game won:", e)); 
    
    // <<< Fetch and display high scores >>>
    this.supabase.getHighScores().then(scores => {
        this.ui.showGameWon(this.state, scores); // Pass scores to UI
    }).catch(e => {
        console.error("Failed to get high scores for game won screen:", e);
        this.ui.showGameWon(this.state, []); // Show screen even if fetch fails
    });
    
    // Don't show UI immediately, wait for fetch (or show loading state)
    // this.ui.showGameWon(this.state); 
    this.audio.stopMusic();
    this.audio.play('game_win_sound');
    this.input.clearInputState();
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
      name: this.playerName // <<< ADD name >>>
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
    this.ui.showChatMessage(this.playerName, sanitizedMessage); // Use full name locally
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
    const otherPlayer = this.otherPlayers[playerId];
    if (otherPlayer && otherPlayer.mesh && state) {
       // Directly set position and rotation for now (consider interpolation later)
       if (state.position) {
          otherPlayer.mesh.position.fromArray(state.position);
       }
       if (state.rotation) {
          otherPlayer.mesh.quaternion.fromArray(state.rotation);
       }
       // <<< Update name if included and different >>>
       const receivedName = state.name || `Player_${playerId.substring(0,4)}`;
       if (receivedName !== otherPlayer.name) {
           otherPlayer.name = receivedName;
           // <<< Update the sprite texture if name changes >>>
           if (otherPlayer.nameSprite) {
               this.updateNameSprite(otherPlayer.nameSprite, receivedName);
           }
       }
       otherPlayer.state = state; // Store latest full state
       // <<< Update name sprite position >>>
       if (otherPlayer.nameSprite) {
           otherPlayer.nameSprite.position.set(
               otherPlayer.mesh.position.x,
               otherPlayer.mesh.position.y + 2.5, // Adjust offset as needed
               otherPlayer.mesh.position.z
           );
       }
    } else if (!otherPlayer) {
      // Could potentially queue the update or request the player's full data if join message was missed
      console.warn(`Received update for unknown player ID: ${playerId}`);
    }
  }
  
  // <<< ADD: Handle incoming chat messages >>>
  handleChatMessage(senderId, messageText) {
     if (senderId === this.clientId) return; // Already displayed own message
     
     // <<< FIX: Find player name from stored data >>>
     const senderData = this.otherPlayers[senderId];
     const displayName = senderData?.name || senderId.substring(0, 6); // Use stored name or fallback ID
     
     console.log(`Chat from ${displayName} (${senderId}): ${messageText}`);
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
         return;
      }
      const playerName = playerData.name || `Player_${playerData.id.substring(0, 4)}`; 
      
      const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
      const material = new THREE.MeshStandardMaterial({ color: 0xff6633 }); 
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, -100, 0); 
      const initialState = playerData.state || {};
      if (initialState.position) {
          mesh.position.fromArray(initialState.position);
      }
      if (initialState.rotation) {
          mesh.quaternion.fromArray(initialState.rotation);
      }
      
      // <<< CREATE and position name sprite >>>
      const nameSprite = this.createNameSprite(playerName);
      nameSprite.position.set(
           mesh.position.x,
           mesh.position.y + 2.5, // Adjust offset
           mesh.position.z
       );

      this.levelManager.scene.add(mesh);
      this.levelManager.scene.add(nameSprite); 
      this.otherPlayers[playerData.id] = {
          mesh: mesh,
          nameSprite: nameSprite, 
          state: initialState,
          name: playerName 
      };
      console.log(`Added visual for player ${playerName} (${playerData.id})`);
  }
  
  removeOtherPlayer(playerId) {
     const otherPlayer = this.otherPlayers[playerId];
     if (otherPlayer) { 
        if (otherPlayer.mesh) {
           this.levelManager.scene.remove(otherPlayer.mesh);
        }
        if (otherPlayer.nameSprite) {
            // <<< Dispose texture and material when removing sprite >>>
            if (otherPlayer.nameSprite.material.map) {
                otherPlayer.nameSprite.material.map.dispose();
            }
            otherPlayer.nameSprite.material.dispose();
            this.levelManager.scene.remove(otherPlayer.nameSprite);
        }
        console.log(`Removed visual for player ${otherPlayer.name || playerId}`);
     }
     delete this.otherPlayers[playerId];
  }

  // <<< REWRITE Utility to create name sprite using CanvasTexture >>>
  createNameSprite(text) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const fontSize = 24;
      const fontFace = 'Arial';
      context.font = `Bold ${fontSize}px ${fontFace}`;

      // Measure text width for canvas size
      const textMetrics = context.measureText(text);
      const textWidth = textMetrics.width;

      // Adjust canvas size (add padding)
      canvas.width = textWidth + 20; // Add horizontal padding
      canvas.height = fontSize + 10; // Add vertical padding

      // Re-apply font settings after resize (important!)
      context.font = `Bold ${fontSize}px ${fontFace}`;
      context.fillStyle = 'rgba(255, 255, 255, 0.8)'; // White text, slightly transparent
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      // Draw text in the center
      context.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      const material = new THREE.SpriteMaterial({ 
          map: texture, 
          sizeAttenuation: false, // Keep size constant regardless of distance
          depthTest: false // Render on top
       });
      const sprite = new THREE.Sprite(material);

      // Scale the sprite based on canvas aspect ratio
      const spriteScaleFactor = 0.005; // <<< REDUCE Scale factor significantly
      sprite.scale.set(canvas.width * spriteScaleFactor, canvas.height * spriteScaleFactor, 1.0);

      return sprite;
  }

   // <<< REWRITE Utility to update name sprite texture >>>
   updateNameSprite(sprite, newText) {
        const canvas = document.createElement('canvas'); // Could reuse existing canvas if stored/managed
        const context = canvas.getContext('2d');
        const fontSize = 24;
        const fontFace = 'Arial';
        context.font = `Bold ${fontSize}px ${fontFace}`;
        const textMetrics = context.measureText(newText);
        const textWidth = textMetrics.width;
        canvas.width = textWidth + 20;
        canvas.height = fontSize + 10;

        // Re-apply font settings
        context.font = `Bold ${fontSize}px ${fontFace}`;
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(newText, canvas.width / 2, canvas.height / 2);

        const newTexture = new THREE.CanvasTexture(canvas);
        newTexture.needsUpdate = true;

        // Ensure sprite material exists
        if (!sprite.material) {
            sprite.material = new THREE.SpriteMaterial();
        }

        // Dispose old texture before assigning new one
        if (sprite.material.map) {
             sprite.material.map.dispose();
        }
        sprite.material.map = newTexture;
        sprite.material.needsUpdate = true; // Important for material update

        // Rescale sprite based on new text width
        const spriteScaleFactor = 0.005; // <<< REDUCE Scale factor here too
        sprite.scale.set(canvas.width * spriteScaleFactor, canvas.height * spriteScaleFactor, 1.0);
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

  // <<< MODIFY: Check Win Condition (This is the intended location) >>>
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
} 