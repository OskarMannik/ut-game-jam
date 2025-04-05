import * as THREE from 'three';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { Player } from '../entities/player.js';
import { LevelManager } from '../world/level.js';
import { UI } from '../ui/ui.js';
import { AudioManager } from './audio.js';

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
    
    // Game state
    this.state = {
      artifacts: 0,
      memories: 0,
      collectedMemories: [],
      depth: 0,
      gameTimer: 0,
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
    
    console.log('Game initialized');
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
    this.levelManager.update(deltaTime, this.player);
    
    // Process collected items
    const collectedItems = this.player.getCollectedItems();
    collectedItems.forEach(itemData => {
      if (itemData.type === 'artifact') {
        this.collectArtifact(itemData);
      } else if (itemData.type === 'memory') {
        this.collectMemory(itemData);
      }
    });

    // <<< SIMPLIFY: Update game state (only checks win/lose now) >>>
    this.updateGameState(deltaTime);
    
    // Update UI (non-dialogue parts)
    this.ui.update(this.state);
    
    // Render the current frame (happens whether paused check passed or not, unless returned early)
    this.renderer.render(this.levelManager.scene, deltaTime);
    
    // Continue the game loop
    requestAnimationFrame(this.update);
  }
  
  updateGameState(deltaTime) {
    // <<< MODIFY: Calculate Depth from first platform surface (145.5) >>>
    const firstPlatformTopY = 145.5; // Platform center Y (145) + half height (0.5)
    this.state.depth = Math.max(0, firstPlatformTopY - this.player.mesh.position.y);

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
    console.log(`Calculating score: MaxFall=${this.player.maxFallDistanceThisSession.toFixed(2)}, FallPenalty=${fallPenalty.toFixed(0)}, ArtifactBonus=${artifactBonus}`);
    
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
    console.log(`Game ${this.isUserPaused ? 'paused' : 'resumed'}`);
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
    console.log("GAME WON!");
    this.isRunning = false;
    this.state.gameWon = true;
    
    // <<< MODIFY Score Calculation >>>
    // const timePenalty = Math.floor(this.state.gameTimer * 10);
    const artifactBonus = this.state.artifacts * 500; 
    const fallThreshold = 10; 
    const fallPenaltyMultiplier = 50; 
    const fallPenalty = Math.max(0, (this.player.maxFallDistanceThisSession - fallThreshold)) * fallPenaltyMultiplier;
    console.log(`Calculating score: MaxFall=${this.player.maxFallDistanceThisSession.toFixed(2)}, FallPenalty=${fallPenalty.toFixed(0)}, ArtifactBonus=${artifactBonus}`);
    
    this.state.finalScore = Math.max(0, 10000 + artifactBonus - fallPenalty);
      
    this.audio.stopMusic(); 
    // this.audio.play('game_win_sound');
    this.ui.showGameWon(this.state); // Pass updated state
  }
} 