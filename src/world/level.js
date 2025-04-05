import * as THREE from 'three';
import { createCollectible } from '../entities/collectible.js';
import { InteractiveObject } from '../entities/interactive.js';
import { NPC } from '../entities/npc.js';
import { Biome } from './biome.js';

export class LevelManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.currentLevel = null;
    this.levels = [];
    this.collectibles = [];
    this.interactiveObjects = [];
    this.npcs = [];
    this.waterLevel = 0; // Y-position of water surface (for underwater detection)
    this.movableObjects = [];
    this.collisionObjects = [];
    this.transitionPoints = [];
    this.groundObjects = []; // Store ground objects for ground check
    
    // Define the different levels/biomes in the game
    this.defineLevels();
  }
  
  defineLevels() {
    // Level 0: Surface - Starting area
    this.levels.push({
      id: 0,
      name: 'Surface',
      type: 'surface',
      environmentType: 'surface',
      waterLevel: -10, // Water is below the ground level
      playerStart: new THREE.Vector3(0, 2, 0),
      entries: {
        'start': new THREE.Vector3(0, 2, 0),
        'return_from_underwater': new THREE.Vector3(10, 2, 20)
      }
    });
    
    // Level 1: Underwater - First depth layer
    this.levels.push({
      id: 1,
      name: 'Underwater',
      type: 'underwater',
      environmentType: 'underwater',
      waterLevel: 50, // Everything is underwater in this level
      playerStart: new THREE.Vector3(0, -5, 0),
      entries: {
        'start': new THREE.Vector3(0, -5, 0),
        'from_surface': new THREE.Vector3(0, -5, 0),
        'return_from_cave': new THREE.Vector3(-20, -5, -10)
      }
    });
    
    // Level 2: Underwater Caves - Second depth layer
    this.levels.push({
      id: 2,
      name: 'Underwater Caves',
      type: 'cave',
      environmentType: 'cave',
      waterLevel: 50, // Partially underwater cave system
      playerStart: new THREE.Vector3(0, -20, 0),
      entries: {
        'start': new THREE.Vector3(0, -20, 0),
        'from_underwater': new THREE.Vector3(5, -20, 5),
        'return_from_ruins': new THREE.Vector3(-5, -20, -15)
      }
    });
    
    // Level 3: Ancient Ruins - Third depth layer
    this.levels.push({
      id: 3,
      name: 'Ancient Ruins',
      type: 'ruins',
      environmentType: 'cave',
      waterLevel: 30, // Some underwater sections
      playerStart: new THREE.Vector3(0, -40, 0),
      entries: {
        'start': new THREE.Vector3(0, -40, 0),
        'from_cave': new THREE.Vector3(10, -40, 10),
        'return_from_subconscious': new THREE.Vector3(-10, -40, -10)
      }
    });
    
    // Level 4: Subconscious - Fourth depth layer
    this.levels.push({
      id: 4,
      name: 'Subconscious',
      type: 'subconscious',
      environmentType: 'cosmic',
      waterLevel: -100, // No water in this abstract realm
      playerStart: new THREE.Vector3(0, -70, 0),
      entries: {
        'start': new THREE.Vector3(0, -70, 0),
        'from_ruins': new THREE.Vector3(0, -70, 20),
        'return_from_void': new THREE.Vector3(0, -70, -20)
      }
    });
    
    // Level 5: Cosmic Void - Final depth layer
    this.levels.push({
      id: 5,
      name: 'Cosmic Void',
      type: 'void',
      environmentType: 'cosmic',
      waterLevel: -100, // No water
      playerStart: new THREE.Vector3(0, -100, 0),
      entries: {
        'start': new THREE.Vector3(0, -100, 0),
        'from_subconscious': new THREE.Vector3(0, -100, 0)
      }
    });
  }
  
  async loadLevel(levelIndex) {
    if (levelIndex < 0 || levelIndex >= this.levels.length) {
      console.error(`Level ${levelIndex} does not exist`);
      return false;
    }
    
    // Clear current level
    this.clearLevel();
    
    // Set current level
    this.currentLevel = this.levels[levelIndex];
    
    // Create new scene
    this.scene = new THREE.Scene();
    
    // Set water level for this level
    this.waterLevel = this.currentLevel.waterLevel;
    
    // Create the environment based on level type
    const biome = new Biome(this.currentLevel.environmentType);
    const environmentData = biome.createEnvironment(this.scene);
    this.collisionObjects = environmentData.collisionObjects || [];
    this.groundObjects = environmentData.groundObjects || []; // Store ground objects for ground check
    
    // Add collectibles specific to this level
    this.addLevelCollectibles(levelIndex);
    
    // Add interactive objects
    this.addLevelInteractiveObjects(levelIndex);
    
    // Add NPCs
    this.addLevelNPCs(levelIndex);
    
    // Add transition points between levels
    this.addLevelTransitionPoints(levelIndex);
    
    console.log(`Loaded level: ${this.currentLevel.name}`);
    return true;
  }
  
  clearLevel() {
    // Clear references to objects
    this.collectibles = [];
    this.interactiveObjects = [];
    this.movableObjects = [];
    this.collisionObjects = [];
    this.transitionPoints = [];
    this.groundObjects = [];
    this.npcs = [];
    
    // Scene will be replaced entirely
  }
  
  addLevelCollectibles(levelIndex) {
    // Add collectibles based on level
    switch (levelIndex) {
      case 0: // Surface
        // A few basic collectibles to get started
        this.addCollectible(new THREE.Vector3(10, 1, 10), 'memory', 'surface_memory_1');
        this.addCollectible(new THREE.Vector3(-10, 1, -10), 'memory', 'surface_memory_2');
        break;
        
      case 1: // Underwater
        // Underwater artifacts and memories
        this.addCollectible(new THREE.Vector3(15, -8, 15), 'artifact', 'underwater_artifact_1', 'oxygen_efficiency');
        this.addCollectible(new THREE.Vector3(-15, -6, 5), 'memory', 'underwater_memory_1');
        this.addCollectible(new THREE.Vector3(0, -10, -20), 'memory', 'underwater_memory_2');
        break;
        
      case 2: // Underwater Caves
        // Cave artifacts and memories
        this.addCollectible(new THREE.Vector3(20, -22, 10), 'artifact', 'cave_artifact_1', 'night_vision');
        this.addCollectible(new THREE.Vector3(-10, -25, -5), 'memory', 'cave_memory_1');
        this.addCollectible(new THREE.Vector3(5, -18, -15), 'memory', 'cave_memory_2');
        break;
        
      case 3: // Ancient Ruins
        // Ruins artifacts and memories
        this.addCollectible(new THREE.Vector3(-15, -38, 15), 'artifact', 'ruins_artifact_1', 'telekinesis');
        this.addCollectible(new THREE.Vector3(25, -42, -5), 'memory', 'ruins_memory_1');
        this.addCollectible(new THREE.Vector3(-5, -45, -25), 'memory', 'ruins_memory_2');
        break;
        
      case 4: // Subconscious
        // Subconscious memories reveal more of the story
        this.addCollectible(new THREE.Vector3(15, -72, 15), 'memory', 'subconscious_memory_1');
        this.addCollectible(new THREE.Vector3(-15, -68, 15), 'memory', 'subconscious_memory_2');
        this.addCollectible(new THREE.Vector3(0, -75, -15), 'memory', 'subconscious_memory_3');
        break;
        
      case 5: // Cosmic Void
        // Final revelations
        this.addCollectible(new THREE.Vector3(0, -98, 0), 'memory', 'void_memory_1');
        break;
    }
  }
  
  addCollectible(position, type, id, effectType = null) {
    const collectible = createCollectible(position, type, id, effectType);
    this.collectibles.push(collectible);
    this.scene.add(collectible.mesh);
    return collectible;
  }
  
  addLevelInteractiveObjects(levelIndex) {
    // Add interactive objects based on level
    switch (levelIndex) {
      case 0: // Surface
        // Path to underwater
        this.addInteractiveObject(
          new THREE.Vector3(20, 0, 20),
          'Portal to Underwater',
          () => {
            console.log('Transitioning to underwater level');
            return { targetLevel: 1, entryPoint: 'from_surface' };
          }
        );
        break;
        
      case 1: // Underwater
        // Path back to surface
        this.addInteractiveObject(
          new THREE.Vector3(20, -2, 20),
          'Ascend to Surface',
          () => {
            console.log('Returning to surface');
            return { targetLevel: 0, entryPoint: 'return_from_underwater' };
          }
        );
        
        // Path to caves
        this.addInteractiveObject(
          new THREE.Vector3(-20, -8, -10),
          'Enter Underwater Caves',
          () => {
            console.log('Entering underwater caves');
            return { targetLevel: 2, entryPoint: 'from_underwater' };
          }
        );
        break;
        
      case 2: // Underwater Caves
        // Path back to underwater
        this.addInteractiveObject(
          new THREE.Vector3(5, -18, 5),
          'Return to Open Water',
          () => {
            console.log('Returning to underwater area');
            return { targetLevel: 1, entryPoint: 'return_from_cave' };
          }
        );
        
        // Path to ruins
        this.addInteractiveObject(
          new THREE.Vector3(-5, -22, -15),
          'Descend to Ancient Ruins',
          () => {
            console.log('Descending to ancient ruins');
            return { targetLevel: 3, entryPoint: 'from_cave' };
          }
        );
        break;
        
      case 3: // Ancient Ruins
        // Path back to caves
        this.addInteractiveObject(
          new THREE.Vector3(10, -38, 10),
          'Return to Caves',
          () => {
            console.log('Returning to caves');
            return { targetLevel: 2, entryPoint: 'return_from_ruins' };
          }
        );
        
        // Path to subconscious
        this.addInteractiveObject(
          new THREE.Vector3(-10, -42, -10),
          'Enter the Mysterious Portal',
          () => {
            console.log('Entering subconscious realm');
            return { targetLevel: 4, entryPoint: 'from_ruins' };
          }
        );
        break;
        
      case 4: // Subconscious
        // Path back to ruins
        this.addInteractiveObject(
          new THREE.Vector3(0, -68, 20),
          'Return to Reality',
          () => {
            console.log('Returning to ruins');
            return { targetLevel: 3, entryPoint: 'return_from_subconscious' };
          }
        );
        
        // Path to void
        this.addInteractiveObject(
          new THREE.Vector3(0, -72, -20),
          'Journey to the Depths',
          () => {
            console.log('Entering the void');
            return { targetLevel: 5, entryPoint: 'from_subconscious' };
          }
        );
        break;
        
      case 5: // Cosmic Void
        // Path back to subconscious
        this.addInteractiveObject(
          new THREE.Vector3(0, -98, 0),
          'Return to Consciousness',
          () => {
            console.log('Returning to subconscious');
            return { targetLevel: 4, entryPoint: 'return_from_void' };
          }
        );
        break;
    }
  }
  
  addInteractiveObject(position, name, interactCallback) {
    const interactiveObject = new InteractiveObject(position, name, interactCallback);
    this.interactiveObjects.push(interactiveObject);
    this.scene.add(interactiveObject.mesh);
    return interactiveObject;
  }
  
  addLevelNPCs(levelIndex) {
    switch (levelIndex) {
      case 2: // Underwater Caves
        this.addNPC(
          new THREE.Vector3(-15, 0, 10), // Position in the cave
          "Echoing Shade", 
          [
            "...who disturbs the silence...?",
            "These depths hold forgotten whispers...",
            "I sense... warmth. A flicker. Do you carry a memory of *Hope*?"
          ],
          { 
            color: 0x6688cc,
            desire: { type: 'resonance', value: 'Hope' },
            offer: { type: 'memory', id: 'cave_memory_2' } // Offers the mystery tablet memory
          }
        );
        break;
      // Add cases for other levels later...
    }
  }
  
  addNPC(position, name, dialogue, appearance) {
    const npc = new NPC(position, name, dialogue, appearance);
    this.npcs.push(npc);
    this.scene.add(npc.mesh);
    return npc;
  }
  
  addLevelTransitionPoints(levelIndex) {
    // These are invisible triggers that transition between levels when the player enters them
    // They serve as an alternative to the interactive objects which require explicit interaction
    
    // For now, we won't add any automatic transition points
    // All level transitions will be through interactive objects
  }
  
  update(deltaTime, player) {
    // Update all collectibles
    this.collectibles.forEach(collectible => {
      if (!collectible.collected) {
        collectible.update(deltaTime);
      }
    });
    
    // Update all interactive objects
    this.interactiveObjects.forEach(obj => {
      obj.update(deltaTime, player.mesh.position);
    });
    
    // Update NPCs
    this.npcs.forEach(npc => {
        npc.update(deltaTime);
    });
    
    // Update physics for movable objects
    this.movableObjects.forEach(obj => {
      // Simple physics update for movable objects
      if (obj.velocity) {
        obj.position.add(obj.velocity.clone().multiplyScalar(deltaTime));
        obj.velocity.multiplyScalar(0.98); // Apply drag
      }
    });
  }
  
  isPositionUnderwater(position) {
    if (!position) return false;
    return position.y < this.waterLevel;
  }
  
  getPlayerStartPosition() {
    return this.currentLevel ? this.currentLevel.playerStart.clone() : new THREE.Vector3(0, 2, 0);
  }
  
  getEntryPosition(entryPointName) {
    if (!this.currentLevel || !this.currentLevel.entries[entryPointName]) {
      console.warn(`Entry point ${entryPointName} not found in level ${this.currentLevel?.id}`);
      return this.getPlayerStartPosition();
    }
    
    return this.currentLevel.entries[entryPointName].clone();
  }
  
  checkCollisions(playerHitbox) {
    const collisions = [];
    
    // Check collisions with static level geometry
    this.collisionObjects.forEach(object => {
      const objectHitbox = new THREE.Box3().setFromObject(object);
      if (playerHitbox.intersectsBox(objectHitbox)) {
        // Calculate collision response
        const playerCenter = new THREE.Vector3();
        const objectCenter = new THREE.Vector3();
        playerHitbox.getCenter(playerCenter);
        objectHitbox.getCenter(objectCenter);
        
        // Direction from object to player
        const normal = new THREE.Vector3().subVectors(playerCenter, objectCenter).normalize();
        
        // Calculate penetration depth (approximate)
        const playerSize = new THREE.Vector3();
        const objectSize = new THREE.Vector3();
        playerHitbox.getSize(playerSize);
        objectHitbox.getSize(objectSize);
        const minDistance = (playerSize.length() + objectSize.length()) * 0.5;
        const actualDistance = playerCenter.distanceTo(objectCenter);
        const depth = minDistance - actualDistance;
        
        collisions.push({
          object,
          normal,
          depth
        });
      }
    });
    
    return collisions;
  }
  
  getCollectiblesInRadius(position, radius) {
    const collectiblesInRange = [];
    const radiusSquared = radius * radius; // Avoid square root calculations
    
    this.collectibles.forEach(collectible => {
      if (!collectible.collected && collectible.mesh) {
        const distance = position.distanceToSquared(collectible.mesh.position);
        if (distance <= radiusSquared) {
          collectiblesInRange.push(collectible);
        }
      }
    });
    
    return collectiblesInRange;
  }
  
  collectItem(itemId) {
    const collectible = this.collectibles.find(item => item.id === itemId && !item.collected);
    
    if (!collectible) return null;
    
    const itemData = collectible.collect();
    return itemData;
  }
  
  getClosestInteractiveObject(position, maxDistance) {
    let closest = null;
    let closestDistance = maxDistance * maxDistance;
    
    this.interactiveObjects.forEach(obj => {
      const distanceSquared = position.distanceToSquared(obj.mesh.position);
      if (distanceSquared < closestDistance) {
        closest = obj;
        closestDistance = distanceSquared;
      }
    });
    
    return closest;
  }
  
  getClosestNPC(position, maxDistance) {
    let closestNPC = null;
    let closestDistanceSq = maxDistance * maxDistance;

    this.npcs.forEach(npc => {
      if (npc.mesh) {
        const distanceSq = position.distanceToSquared(npc.mesh.position);
        if (distanceSq < closestDistanceSq) {
          closestNPC = npc;
          closestDistanceSq = distanceSq;
        }
      }
    });

    return closestNPC;
  }
  
  checkTransitionPoint(playerPosition) {
    for (const point of this.transitionPoints) {
      const distanceSquared = playerPosition.distanceToSquared(point.position);
      if (distanceSquared <= point.radiusSquared) {
        return {
          targetLevel: point.targetLevel,
          entryPoint: point.entryPoint
        };
      }
    }
    
    return null;
  }
  
  getMovableObjects() {
    return this.movableObjects.map(obj => obj.mesh);
  }
  
  applyForceToObject(object, force) {
    // Find the movable object container for this mesh
    const movableObject = this.movableObjects.find(obj => obj.mesh === object);
    
    if (movableObject) {
      if (!movableObject.velocity) {
        movableObject.velocity = new THREE.Vector3();
      }
      
      // Apply the force
      movableObject.velocity.add(force);
    }
  }
} 