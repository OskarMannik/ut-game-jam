import * as THREE from 'three';
import { createCollectible } from '../entities/collectible.js';
import { NPC } from '../entities/npc.js';
import { Biome } from './biome.js';

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export class LevelManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.currentLevel = null;
    this.levels = [];
    this.collectibles = [];
    this.npcs = [];
    this.movableObjects = [];
    this.collisionObjects = [];
    this.groundObjects = []; // Store ground objects for ground check
    this.firstPlatform = null; // Store reference to the first platform
    this.generatedPlatforms = []; // Store generated platforms
    
    // Define the different levels/biomes in the game
    this.defineLevels();
  }
  
  defineLevels() {
    // Level 0: Surface - Starting area
    this.levels.push({
      id: 0,
      name: 'The Descent',
      type: 'descent',
      environmentType: 'descent',
      playerStart: new THREE.Vector3(0, 150, 0),
      entries: {
        'start': new THREE.Vector3(0, 150, 0)
      },
    });
  }
  
  async loadLevel(levelIndex) {
    if (levelIndex !== 0) {
      console.warn(`Attempting to load non-existent level: ${levelIndex}. Loading level 0 instead.`);
      levelIndex = 0; 
    }
    if (levelIndex < 0 || levelIndex >= this.levels.length) {
      console.error(`Level 0 does not exist`);
      return false;
    }
    
    // Clear current level
    this.clearLevel();
    
    // Set current level
    this.currentLevel = this.levels[levelIndex];
    
    // Create new scene
    this.scene = new THREE.Scene();
    
    // Create the environment based on level type
    const biome = new Biome(this.currentLevel.environmentType);
    const environmentData = biome.createEnvironment(this.scene);
    this.collisionObjects = environmentData.collisionObjects || [];
    this.groundObjects = environmentData.groundObjects || []; // Store ground objects for ground check
    this.firstPlatform = environmentData.firstPlatform || null; // Store first platform
    this.generatedPlatforms = environmentData.platforms || []; // Store generated platforms
    
    // Add collectibles specific to this level
    this.addLevelCollectibles(levelIndex);
    
    console.log(`Loaded level: ${this.currentLevel.name}`);
    return true;
  }
  
  clearLevel() {
    // Clear references to objects
    this.collectibles = [];
    this.movableObjects = [];
    this.collisionObjects = [];
    this.groundObjects = [];
    this.npcs = [];
    this.firstPlatform = null; // Reset first platform
    this.generatedPlatforms = []; // Reset generated platforms
    
    // Scene will be replaced entirely
  }
  
  addLevelCollectibles(levelIndex) {
    const requiredPlatformCount = 10; // 4 artifacts + 4 memories + 2 health
    if (levelIndex !== 0 || this.generatedPlatforms.length < requiredPlatformCount + 1) { // +1 for the start platform
        console.warn(`Cannot add collectibles: Not on descent level or not enough platforms generated (need ${requiredPlatformCount + 1}). Found: ${this.generatedPlatforms.length}`);
        return;
    }

    // Exclude the first platform from collectible placement
    const eligiblePlatforms = this.generatedPlatforms.slice(1);
    if (eligiblePlatforms.length < requiredPlatformCount) {
        console.warn(`Not enough eligible platforms (excluding the first) to place all collectibles (need ${requiredPlatformCount}). Found: ${eligiblePlatforms.length}`);
        return; // Or adjust logic to place fewer items
    }

    shuffleArray(eligiblePlatforms); // Randomize platform order

    const artifactIds = ['surface_artifact_1', 'surface_artifact_2', 'underwater_artifact_1', 'underwater_artifact_2'];
    const artifactEffects = ['oxygen_efficiency', 'night_vision', 'telekinesis', 'oxygen_efficiency']; // Match IDs
    const memoryIds = ['surface_memory_1', 'surface_memory_2', 'underwater_memory_1', 'underwater_memory_2'];
    const healthPickupIds = ['health_1', 'health_2']; // <<< ADD: IDs for health pickups
    
    let platformIndex = 0;

    // Place Artifacts
    console.log(`Placing ${artifactIds.length} artifacts...`);
    for (let i = 0; i < artifactIds.length; i++) {
        if (platformIndex >= eligiblePlatforms.length) break; // Safety check
        const platform = eligiblePlatforms[platformIndex++];
        const platformPos = platform.position.clone();
        const platformHeight = platform.geometry.parameters.height || 0.5;
        const collectiblePos = platformPos.add(new THREE.Vector3(0, platformHeight / 2 + 1.5, 0)); // Place 1.5 units above platform center
        this.addCollectible(collectiblePos, 'artifact', artifactIds[i], artifactEffects[i]);
        console.log(` - Added ${artifactIds[i]} at`, collectiblePos);
    }

    // Place Memories
    console.log(`Placing ${memoryIds.length} memories...`);
    for (let i = 0; i < memoryIds.length; i++) {
        if (platformIndex >= eligiblePlatforms.length) break; // Safety check
        const platform = eligiblePlatforms[platformIndex++];
        const platformPos = platform.position.clone();
        const platformHeight = platform.geometry.parameters.height || 0.5;
        const collectiblePos = platformPos.add(new THREE.Vector3(0, platformHeight / 2 + 1.5, 0)); // Place 1.5 units above platform center
        this.addCollectible(collectiblePos, 'memory', memoryIds[i]);
        console.log(` - Added ${memoryIds[i]} at`, collectiblePos);
    }

    // <<< ADD: Place Health Pickups >>>
    console.log(`Placing ${healthPickupIds.length} health pickups...`);
    for (let i = 0; i < healthPickupIds.length; i++) {
        if (platformIndex >= eligiblePlatforms.length) break; // Safety check
        const platform = eligiblePlatforms[platformIndex++];
        const platformPos = platform.position.clone();
        const platformHeight = platform.geometry.parameters.height || 0.5;
        const collectiblePos = platformPos.add(new THREE.Vector3(0, platformHeight / 2 + 1.5, 0)); // Place 1.5 units above platform center
        // Call addCollectible with type 'health'
        this.addCollectible(collectiblePos, 'health', healthPickupIds[i]); 
        console.log(` - Added ${healthPickupIds[i]} at`, collectiblePos);
    }
  }
  
  addCollectible(position, type, id, effectType = null) {
    const collectible = createCollectible(position, type, id, effectType);
    this.collectibles.push(collectible);
    this.scene.add(collectible.mesh);
    return collectible;
  }
  
  addNPC(position, name, dialogue, appearance) {
    const npc = new NPC(position, name, dialogue, appearance);
    this.npcs.push(npc);
    this.scene.add(npc.mesh);
    return npc;
  }
  
  update(deltaTime, player) {
    // Update all collectibles
    this.collectibles.forEach(collectible => {
      if (!collectible.collected) {
        collectible.update(deltaTime);
      }
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
  
  getPlayerStartPosition() {
    if (this.firstPlatform) {
      const platformPos = this.firstPlatform.position.clone();
      // Get platform dimensions (assuming BoxGeometry)
      const platformHeight = this.firstPlatform.geometry.parameters.height || 1; 
      return platformPos.add(new THREE.Vector3(0, platformHeight / 2 + 2, 0)); // Start 2 units above platform center
    } else {
      // Fallback to original defined start if no platform
      return this.currentLevel ? this.currentLevel.playerStart.clone() : new THREE.Vector3(0, 150, 0);
    }
  }
  
  getEntryPosition(entryPointName) {
    if (!this.currentLevel || !this.currentLevel.entries[entryPointName]) {
      console.warn(`Entry point ${entryPointName} not found in level ${this.currentLevel?.id}, using default start.`);
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