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
    
    // Game state
    this.state = {
      oxygen: 100,
      artifacts: 0,
      memories: 0,
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
    
    const deltaTime = this.clock.getDelta();
    
    // Update game systems
    this.player.update(deltaTime, this.input.getInputState(), this.levelManager);
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
    
    // Update UI
    this.ui.update(this.state);
    
    // Check for level transition
    this.checkLevelTransition();
    
    // Render the current frame
    this.renderer.render(this.levelManager.scene, deltaTime);
    
    // Continue the game loop
    requestAnimationFrame(this.update);
  }
  
  updateGameState(deltaTime) {
    // Update depth based on player y position
    this.state.depth = Math.abs(this.player.mesh.position.y);
    
    // Only deplete oxygen when below a certain depth (deeper than 2 units)
    if (this.state.depth > 2) {
      // Deplete oxygen faster based on depth
      const depletionRate = 1 + ((this.state.depth - 2) * 0.2);
      this.state.oxygen = Math.max(0, this.state.oxygen - (depletionRate * deltaTime));
    } else {
      // Replenish oxygen when near the surface
      this.state.oxygen = Math.min(100, this.state.oxygen + (10 * deltaTime));
    }
    
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
    
    // Load new level
    await this.levelManager.loadLevel(levelIndex);
    
    // Reposition player
    const newPosition = this.levelManager.getEntryPosition(entryPoint);
    this.player.setPosition(newPosition);
    
    // Add player to new scene
    this.levelManager.scene.add(this.player.mesh);
    
    // Fade in
    await this.ui.fadeIn();
  }
  
  collectArtifact(artifactData) {
    this.state.artifacts++;
    // Apply artifact effect
    if (artifactData.data.effect) {
      this.applyArtifactEffect(artifactData.data.effect);

      // Update objective if it's the first artifact
      if (artifactData.data.effect.type === 'oxygen_efficiency') {
        this.ui.setObjectiveText('Artifact found! Oxygen consumption reduced. Find a way deeper...');
      } else {
        // Generic update for other artifacts later
        this.ui.setObjectiveText('Another artifact secured. The path continues downwards.');
      }
    }
    // Play collection sound
    this.audio.play('artifact_collect');
  }
  
  collectMemory(memoryData) {
    this.state.memories++;
    // Show memory flashback
    this.ui.showMemoryFlashback(memoryData);
    // Play memory sound
    this.audio.play('memory_collect');
  }
  
  applyArtifactEffect(effect) {
    // Apply various effects based on artifact type
    switch (effect.type) {
      case 'oxygen_efficiency':
        // Improve oxygen efficiency (Actual effect logic TBD)
        console.log('Oxygen Efficiency Artifact Effect Applied!');
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
      depth: 0
    };
    
    // Reload first level
    this.transitionToLevel(0, 'start');
    this.isRunning = true;
  }
} 