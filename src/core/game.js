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
    this.currentLevel = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.interactingNPC = null;
    
    // Game state
    this.state = {
      oxygen: 100,
      artifacts: 0,
      memories: 0,
      collectedMemories: [],
      depth: 0
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
    
    console.log('Game initialized');
  }

  update() {
    if (!this.isRunning) return;
    
    // Always get input state first
    const inputState = this.input.getInputState();

    // Handle Pause State (Dialogue Advancement / Unpausing)
    if (this.isPaused) {
      if (inputState.interact && this.interactingNPC) {
        // If paused for dialogue and interact is pressed, get the next line
        const nextDialogueData = this.interactingNPC.interact();
        
        if (nextDialogueData.canTrade) {
          // Last line reached, NPC wants to trade
          this.presentTradeOptions(nextDialogueData);
        } else if (nextDialogueData.isComplete) {
          // If dialogue cycle is complete (and no trade), hide UI, unpause, clear NPC
          this.unpauseAndEndDialogue();
        } else {
          // Otherwise, just update the dialogue text
          this.ui.showDialogue(nextDialogueData.speaker, nextDialogueData.text);
          this.input.clearInputState(); // Consume input for this frame
        }
      } else if (inputState.interact && !this.interactingNPC) {
          // Failsafe: If paused but somehow lost NPC ref, just unpause
          this.unpauseAndEndDialogue();
      }
      // Still need to keep the animation frame loop going while paused
      requestAnimationFrame(this.update);
      return; // Prevent rest of update logic (player movement etc.)
    }
    
    // --- If NOT paused --- 
    const deltaTime = this.clock.getDelta(); // Get deltaTime ONLY if not paused

    // Check if player initiated NEW dialogue this frame
    const dialogueData = this.player.getCurrentDialogue();
    console.log(`[Game.update] Received dialogue data from player:`, dialogueData); // Will be null unless interact happened in player.update
    if (dialogueData) {
      // Initiate dialogue and pause
      this.ui.showDialogue(dialogueData.speaker, dialogueData.text);
      this.isPaused = true; 
      this.interactingNPC = dialogueData.npc; 
      this.input.clearInputState(); // Consume the initial interact press
    } else {
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

      // Update oxygen based on depth
      this.updateGameState(deltaTime);
      
      // Update UI (non-dialogue parts)
      this.ui.update(this.state);
      
      // Check for level transition
      this.checkLevelTransition();
    }
    
    // Render the current frame (happens whether paused check passed or not, unless returned early)
    this.renderer.render(this.levelManager.scene, deltaTime);
    
    // Continue the game loop
    requestAnimationFrame(this.update);
  }
  
  updateGameState(deltaTime) {
    // Update depth based on player y position
    this.state.depth = Math.abs(this.player.mesh.position.y);
    
    // Only deplete oxygen when below a certain depth (deeper than 2 units)
    if (this.state.depth > 2) {
      // Deplete oxygen faster based on depth - reduced rate increase
      const depletionRate = 1 + ((this.state.depth - 2) * 0.1); // Reduced multiplier from 0.2
      this.state.oxygen = Math.max(0, this.state.oxygen - (depletionRate * deltaTime));
    } else {
      // Replenish oxygen when near the surface - increased rate
      this.state.oxygen = Math.min(100, this.state.oxygen + (12 * deltaTime)); // Increased from 10
    }
    
    // Play low oxygen sound
    this.audio.playHeartbeat(this.state.oxygen);

    // Check for game over
    if (this.state.oxygen <= 0) {
      this.gameOver();
    }
  }
  
  checkLevelTransition() {
    // Check for transition requested by interaction first
    const interactionTransition = this.player.getRequestedTransition();
    if (interactionTransition) {
      this.transitionToLevel(interactionTransition.targetLevel, interactionTransition.entryPoint);
      return; // Prioritize interaction transition
    }

    // Then, check for transitions based on proximity
    const proximityTransition = this.levelManager.checkTransitionPoint(this.player.mesh.position);
    if (proximityTransition) {
      this.transitionToLevel(proximityTransition.targetLevel, proximityTransition.entryPoint);
    }
  }
  
  async transitionToLevel(levelIndex, entryPoint) {
    // Fade out
    await this.ui.fadeOut();
    
    // Play transition sound
    this.audio.play('level_transition');

    // Stop looping sounds from previous level
    this.audio.stopAllLoops();

    // Load new level
    await this.levelManager.loadLevel(levelIndex);
    
    // Reposition player
    const newPosition = this.levelManager.getEntryPosition(entryPoint);
    this.player.setPosition(newPosition);
    
    // Add player to new scene
    this.levelManager.scene.add(this.player.mesh);
    
    // Start ambient sounds for new level
    const newLevelData = this.levelManager.levels[levelIndex];
    if (newLevelData) {
        this.audio.playAmbientSounds(newLevelData.environmentType);
    }

    // Fade in
    await this.ui.fadeIn();
  }
  
  collectArtifact(artifactData) {
    this.state.artifacts++;
    // Apply artifact effect
    if (artifactData.effect) {
      this.applyArtifactEffect(artifactData.effect);
    }
    // Play collection sound
    this.audio.play('artifact_collect');
  }
  
  collectMemory(memoryData) {
    this.state.memories++;
    // Add the full memory data to the collected list if not already present
    if (!this.state.collectedMemories.some(m => m.id === memoryData.id)) {
        this.state.collectedMemories.push(memoryData);
    }
    // Show memory flashback
    this.ui.showMemoryFlashback(memoryData);
    // Play memory sound
    this.audio.play('memory_collect');
  }
  
  applyArtifactEffect(effect) {
    // Apply various effects based on artifact type
    switch (effect.type) {
      case 'oxygen_efficiency':
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
  
  gameOver() {
    this.isRunning = false;
    this.ui.showGameOver();
    this.audio.play('game_over');
  }
  
  restart() {
    // Reset game state
    this.state = {
      oxygen: 100,
      artifacts: 0,
      memories: 0,
      collectedMemories: [],
      depth: 0
    };
    
    // Reload first level
    this.transitionToLevel(0, 'start');
    this.isRunning = true;
  }

  // Helper function to unpause and clean up dialogue state
  unpauseAndEndDialogue() {
    this.ui.hideDialogue();
    this.isPaused = false;
    this.interactingNPC = null;
    this.input.clearInputState(); 
  }

  // Function to handle presenting trade options
  presentTradeOptions(dialogueData) {
    const npc = this.interactingNPC;
    const playerMemories = this.state.collectedMemories;
    const desire = dialogueData.desire;
    const offer = dialogueData.offer;

    let canFulfill = false;
    let matchingMemory = null;

    // Check if player has a memory matching the desire
    if (desire.type === 'resonance') {
      matchingMemory = playerMemories.find(mem => mem.data.resonance === desire.value);
      canFulfill = !!matchingMemory;
    } // Add checks for desire.type === 'id' later if needed

    let options = [];
    if (canFulfill) {
      options.push({
        text: `Offer Memory of ${desire.value} (ID: ${matchingMemory.id})`,
        callback: () => this.executeTrade(npc, matchingMemory, offer)
      });
    }
    options.push({
      text: "(Leave)",
      callback: () => this.unpauseAndEndDialogue()
    });

    // Show the last dialogue line again, but with trade options
    this.ui.showDialogue(dialogueData.speaker, dialogueData.text, options);
    this.input.clearInputState(); // Consume the input that triggered this
  }

  // Function to execute the trade
  executeTrade(npc, playerMemoryToGive, npcOffer) {
    console.log(`Executing trade: Giving ${playerMemoryToGive.id}, Receiving ${npcOffer.id}`);

    // 1. Remove memory from player state
    this.state.collectedMemories = this.state.collectedMemories.filter(mem => mem.id !== playerMemoryToGive.id);
    this.state.memories--; // Update count

    // 2. Add offered memory to player state
    // We need to get the full memory data for the offered ID
    // For now, let's assume we have a way to fetch it (or create it on the fly if simple)
    // Placeholder: Just log for now
    console.log(`Need to implement logic to get/create memory data for ${npcOffer.id}`);
    // TODO: Implement getting offered memory data and adding it to this.state.collectedMemories
    // Example: const offeredMemoryData = findMemoryDataById(npcOffer.id);
    // this.state.collectedMemories.push(offeredMemoryData);
    // this.state.memories++;

    // 3. (Optional) Update NPC state - maybe they have different dialogue now?
    // npc.memoryReceived(playerMemoryToGive.id); // Add method to NPC class later

    // 4. End dialogue
    this.unpauseAndEndDialogue();
  }
} 