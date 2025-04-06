import * as THREE from 'three';

export class Player {
  constructor(startPosition = new THREE.Vector3(0, 2, 0)) {
    // Player properties
    this.moveSpeed = 10;
    this.turnSpeed = 2.5;
    this.jumpForce = 15;
    this.highJumpForceMultiplier = 1.4; // Multiplier for high jump
    this.gravity = 30;
    this.maxHealth = 100;          // Maximum health
    this.canTelekinesis = false;
    
    // Player state
    this.velocity = new THREE.Vector3();
    this.isGrounded = false;
    this.isJumping = false;
    this.isFalling = false;
    this.isDead = false; // Flag for zero health state
    this.currentHealth = this.maxHealth; // Current health, start at max
    this.currentDialogue = null; // To hold dialogue data from interaction
    this.currentFallDistance = 0; // Track current fall
    this.maxFallDistanceThisSession = 0; // Track max fall in session
    this.hasHighJump = false; // Ability state
    this.jumpStartY = null; // Track Y position at the start of a jump
    
    // Step sound timing
    this.stepTimer = 0;
    this.stepInterval = 0.4; // Time between step sounds in seconds
    
    // Create player mesh
    this.mesh = this.createPlayerMesh();
    
    // Hitbox for collision detection
    this.hitbox = new THREE.Box3().setFromObject(this.mesh);
    
    // Set initial position (after mesh and hitbox creation)
    this.setPosition(startPosition);
    
    // Rays for ground detection and obstacle detection
    this.groundRay = new THREE.Raycaster(
      this.mesh.position,
      new THREE.Vector3(0, -1, 0),
      0,
      2 // Distance to check for ground
    );
    
    // Collection radius (for picking up items)
    this.collectionRadius = 2.5;
    
    // <<< ADD: Create telekinesis indicator mesh upfront >>>
    this.telekinesisIndicator = this.createTelekinesisIndicator();
    this.telekinesisIndicator.visible = false; // Start hidden
    this.mesh.add(this.telekinesisIndicator); // Add it once
  }
  
  createPlayerMesh() {
    const playerGroup = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3366ff });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1; // Offset to stand on ground
    body.castShadow = true;
    playerGroup.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.85, 0); // Position on top of body
    head.castShadow = true;
    playerGroup.add(head);
    
    // Light source (lamp/torch)
    const light = new THREE.PointLight(0xffffdd, 2.0, 20);
    light.position.set(0, 1.5, 0.8); // Light in front of player
    playerGroup.add(light);
    
    // Light helper (visual representation of light)
    const lampGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.copy(light.position);
    playerGroup.add(lamp);
    
    return playerGroup;
  }
  
  setPosition(position) {
    if (!position) {
      position = new THREE.Vector3(0, 2, 0);
    } else if (!(position instanceof THREE.Vector3)) {
      // If somehow we got a non-Vector3 object
      position = new THREE.Vector3(
        position.x || 0,
        position.y || 2,
        position.z || 0
      );
    }
    
    this.mesh.position.copy(position);
    // Update hitbox position
    this.hitbox.setFromObject(this.mesh);
  }
  
  update(deltaTime, inputState, levelManager) {
    if (!levelManager) return;
    
    // Reset collected items and interaction requests for this frame
    this.collectedItemsThisFrame = [];
    
    this.updateLandMovement(deltaTime, inputState, levelManager);
    
    // Update player position based on velocity
    this.mesh.position.x += this.velocity.x * deltaTime;
    this.mesh.position.y += this.velocity.y * deltaTime;
    this.mesh.position.z += this.velocity.z * deltaTime;
    
    // Collision detection with level
    if (levelManager.checkCollisions) {
      this.handleCollisions(levelManager);
    }
    
    // Update player's hitbox
    this.hitbox.setFromObject(this.mesh);
    
    // Check for collectibles
    if (levelManager.getCollectiblesInRadius) {
      this.checkCollectibles(levelManager);
    }
    
    // Check for interaction input
    if (inputState.interact) {
      this.interact(levelManager);
    }
    
    // Use telekinesis ability if available
    if (inputState.action && this.canTelekinesis && levelManager.getMovableObjects) {
      this.useTelekinesis(levelManager);
    }
  }
  
  updateLandMovement(deltaTime, inputState, levelManager) {
    const previousYVelocity = this.velocity.y; // Store velocity before gravity
    // Check if player is grounded
    this.checkGrounded(levelManager);
    
    // Reset horizontal velocity
    this.velocity.x = 0;
    this.velocity.z = 0;
    
    // Calculate forward direction based on player rotation
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(this.mesh.quaternion);
    
    // Calculate right direction based on player rotation
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.mesh.quaternion);
    
    // Track if player is moving
    let isMoving = false;
    
    // Apply movement based on input
    if (inputState.forward) {
      this.velocity.add(forward.multiplyScalar(this.moveSpeed));
      isMoving = true;
    }
    if (inputState.backward) {
      this.velocity.add(forward.multiplyScalar(-this.moveSpeed * 0.7)); // Slower backward movement
      isMoving = true;
    }
    if (inputState.left) {
      this.mesh.rotation.y += this.turnSpeed * deltaTime;
    }
    if (inputState.right) {
      this.mesh.rotation.y -= this.turnSpeed * deltaTime;
    }
    
    // Handle jumping
    if (inputState.jump && this.isGrounded) {
        // Calculate jump force based on ability
        const effectiveJumpForce = this.hasHighJump 
            ? this.jumpForce * this.highJumpForceMultiplier 
            : this.jumpForce;
        
        this.velocity.y = effectiveJumpForce;
        this.isJumping = true;
        this.isGrounded = false;
        this.jumpStartY = this.mesh.position.y; // Record Y position on jump
        window.game?.audio.play('player_jump'); 
        if (this.hasHighJump) {
            // REMOVE: console.log("High Jump!");
        }
    }
    
    // Apply gravity
    if (!this.isGrounded) {
      if (!this.isFalling && this.velocity.y < 0) { // Start falling only when moving down
         this.isFalling = true;
         this.currentFallDistance = 0; 
      } else if (this.isFalling) {
         // Continue falling - add vertical distance covered this frame
         const verticalDelta = Math.abs(previousYVelocity * deltaTime);
         this.currentFallDistance += verticalDelta;
      }
      this.velocity.y -= this.gravity * deltaTime;
    } else { // Player is grounded
      if (this.isFalling) { // Landed after falling
        // Update Max Fall Distance
        this.maxFallDistanceThisSession = Math.max(this.maxFallDistanceThisSession, this.currentFallDistance);

        // Determine effective fall distance for damage calculation
        let effectiveFallDistance = this.currentFallDistance;
        let fallType = "Walked Off";
        if (this.jumpStartY !== null) {
          fallType = "Jump";
          const netVerticalDrop = Math.max(0, this.jumpStartY - this.mesh.position.y);
          effectiveFallDistance = netVerticalDrop; // Use net drop for jump falls
        }

        // Calculate and apply fall damage based on EFFECTIVE distance
        let fallDamage = 0;
        if (effectiveFallDistance > 20) { // Deadly fall
          fallDamage = this.maxHealth; // Instant death
          window.game?.audio.play('player_fall_damage'); // Use a fatal fall sound
        } else if (effectiveFallDistance > 15) { // 75% damage
          fallDamage = Math.floor(this.maxHealth * 0.75);
          window.game?.audio.play('player_hurt'); // Use a hurt sound
        } else if (effectiveFallDistance > 10) { // 50% damage
          fallDamage = Math.floor(this.maxHealth * 0.50);
          window.game?.audio.play('player_hurt'); // Use a hurt sound
        } else {
          // Safe fall, play normal landing sound
          window.game?.audio.play('player_step', { volume: 0.6 });
        }

        if (fallDamage > 0) {
          this.takeDamage(fallDamage);
        }
      }
      // Reset falling state and vertical velocity
      this.isFalling = false;
      this.currentFallDistance = 0;
      this.jumpStartY = null; // Reset jump start Y after landing
      this.velocity.y = 0;
      this.isJumping = false;
      
      // Play step sounds while moving on ground
      if (isMoving) {
        this.stepTimer += deltaTime;
        if (this.stepTimer >= this.stepInterval) {
          window.game?.audio.play('player_step', { volume: 0.4 });
          this.stepTimer = 0;
        }
      } else {
        this.stepTimer = 0; // Reset timer when not moving
      }
    }
  }
  
  checkGrounded(levelManager) {
    // Update ray origin to match player position
    this.groundRay.ray.origin.copy(this.mesh.position);
    
    // Get ground objects from the level manager
    const groundObjects = levelManager && levelManager.groundObjects ? levelManager.groundObjects : [];
    
    // Default to not grounded if no ground objects available
    this.isGrounded = false;
    
    // Skip raycasting if we don't have any ground objects
    if (!groundObjects || groundObjects.length === 0) {
      return;
    }
    
    // Cast ray downwards to check for ground
    const intersects = this.groundRay.intersectObjects(groundObjects, false); // false for non-recursive
    
    if (intersects.length > 0 && intersects[0].distance <= 2) { // Check distance
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
  }
  
  handleCollisions(levelManager) {
    // Get collision objects from the level manager
    const collisionObjects = levelManager && levelManager.collisionObjects ? levelManager.collisionObjects : [];
    
    // Skip collision check if no objects
    if (!collisionObjects || collisionObjects.length === 0) {
      return;
    }
    
    const playerCenter = new THREE.Vector3();
    const playerSize = new THREE.Vector3();
    
    // Check for collisions with level geometry
    collisionObjects.forEach(object => {
      if (!object || !object.geometry || !object.matrixWorld) return; // Skip invalid objects
      
      const objectHitbox = new THREE.Box3().setFromObject(object);
      
      // Update player hitbox for each check (needed if position changes mid-loop)
      this.hitbox.setFromObject(this.mesh);

      if (this.hitbox.intersectsBox(objectHitbox)) {
        this.hitbox.getCenter(playerCenter);
        this.hitbox.getSize(playerSize);
        
        const objectCenter = new THREE.Vector3();
        const objectSize = new THREE.Vector3();
        objectHitbox.getCenter(objectCenter);
        objectHitbox.getSize(objectSize);
        
        // Calculate overlap on each axis
        const overlap = new THREE.Vector3();
        overlap.x = (playerSize.x / 2 + objectSize.x / 2) - Math.abs(playerCenter.x - objectCenter.x);
        overlap.y = (playerSize.y / 2 + objectSize.y / 2) - Math.abs(playerCenter.y - objectCenter.y);
        overlap.z = (playerSize.z / 2 + objectSize.z / 2) - Math.abs(playerCenter.z - objectCenter.z);
        
        // Ensure overlap is positive (can happen with floating point inaccuracies)
        if (overlap.x <= 0 || overlap.y <= 0 || overlap.z <= 0) return; 

        // Find axis with minimum overlap (Minimum Translation Vector direction)
        let minOverlap = Infinity;
        let pushAxis = null;
        
        if (overlap.x < minOverlap) { minOverlap = overlap.x; pushAxis = 'x'; }
        if (overlap.y < minOverlap) { minOverlap = overlap.y; pushAxis = 'y'; }
        if (overlap.z < minOverlap) { minOverlap = overlap.z; pushAxis = 'z'; }

        const mtv = new THREE.Vector3(); // Minimum Translation Vector
        const pushAmount = minOverlap * 1.01; // Add a small buffer to ensure separation

        // Determine push direction based on relative centers
        if (pushAxis === 'x') {
          mtv.x = Math.sign(playerCenter.x - objectCenter.x);
        } else if (pushAxis === 'y') {
          mtv.y = Math.sign(playerCenter.y - objectCenter.y);
        } else if (pushAxis === 'z') {
          mtv.z = Math.sign(playerCenter.z - objectCenter.z);
        }

        // Apply the push based on MTV
        this.mesh.position.addScaledVector(mtv, pushAmount);

        // Adjust velocity: Remove component pointing into the obstacle (along MTV)
        const velocityAlongNormal = this.velocity.dot(mtv);
        if (velocityAlongNormal < 0) { // Only adjust if moving towards the obstacle
            const correction = mtv.clone().multiplyScalar(velocityAlongNormal);
            this.velocity.sub(correction);
        }
        
        // Special handling for vertical collisions
        if (pushAxis === 'y') {
             // If pushed upwards (hit feet) and falling, ensure grounded state
             if (mtv.y > 0 && !this.isJumping) { 
                 this.isGrounded = true;
                 this.isFalling = false;
             } 
        }
      }
    });

    // Final hitbox update after all collisions are resolved for this frame
    this.hitbox.setFromObject(this.mesh);
  }
  
  checkCollectibles(levelManager) {
    // Get collectibles near player
    const collectibles = levelManager.getCollectiblesInRadius(
      this.mesh.position,
      this.collectionRadius
    );
    
    // Collect them if close enough
    collectibles.forEach(collectible => {
      const itemData = levelManager.collectItem(collectible.id);
      if (itemData) {
        this.collectedItemsThisFrame.push(itemData);
      }
    });
  }
  
  getCollectedItems() {
    return this.collectedItemsThisFrame || [];
  }
  
  interact(levelManager) {
    this.currentDialogue = null; // Also reset dialogue request

    // Check for NPCs first
    const npc = levelManager.getClosestNPC ? levelManager.getClosestNPC(this.mesh.position, 3) : null;
    // REMOVE: console.log(`[Player.interact] Found NPC:`, npc ? npc.name : 'None'); // Log NPC found
    if (npc) {
      const dialogueData = npc.interact(); 
      // REMOVE: console.log(`[Player.interact] Dialogue data from NPC:`, dialogueData);
      if (dialogueData) {
        // Store dialogue data AND the NPC reference
        this.currentDialogue = { ...dialogueData, npc }; // Include NPC reference
        // REMOVE: console.log(`[Player.interact] Stored dialogue:`, this.currentDialogue);
      }
      return; // Prioritize NPC interaction
    }
  }
  
  getCurrentDialogue() {
    const dialogue = this.currentDialogue;
    this.currentDialogue = null; // Clear after retrieving
    return dialogue;
  }
  
  useTelekinesis(levelManager) {
    // Cast a ray forward from player position
    const forwardRay = new THREE.Raycaster(
      this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), // Eye level
      new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion), // Forward direction
      0,
      10 // Range of telekinesis
    );
    
    // Find movable objects
    const objects = levelManager.getMovableObjects();
    const intersects = forwardRay.intersectObjects(objects);
    
    if (intersects.length > 0) {
      // Move the object
      const object = intersects[0].object;
      const force = new THREE.Vector3(0, 0, 1)
        .applyQuaternion(this.mesh.quaternion)
        .multiplyScalar(5);
      
      levelManager.applyForceToObject(object, force);
    }
  }
  
  enableTelekinesis() {
    if (this.canTelekinesis) return; // Already enabled
    
    this.canTelekinesis = true;
    // <<< MODIFY: Just make the existing indicator visible >>>
    if (this.telekinesisIndicator) {
      this.telekinesisIndicator.visible = true;
    }
    // REMOVE: Adding mesh dynamically
    /*
    const telekinesisMaterial = new THREE.MeshBasicMaterial({ color: 0x66ffff, transparent: true, opacity: 0.3 });
    const telekinesisGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const telekinesisIndicator = new THREE.Mesh(telekinesisGeometry, telekinesisMaterial);
    telekinesisIndicator.position.set(0, 0, 0);
    this.mesh.add(telekinesisIndicator);
    */
  }
  
  takeDamage(amount) {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    // REMOVE: console.log(`Player took ${amount} damage. Health: ${this.currentHealth}/${this.maxHealth}`);

    // Set isDead flag if health reaches 0
    if (this.currentHealth <= 0) {
      this.isDead = true;
      // REMOVE: console.log("Player has died.");
      // Optional: Play death sound? (Respawn sound might cover this)
    }

    // TODO: Add visual/audio feedback for taking damage (besides the fall sounds)
    // window.game?.audio.play('player_hurt'); // Already played above based on severity
  }
  
  resetSessionStats() {
    // Reset tracking stats for a new session (e.g., after game over)
    this.maxFallDistanceThisSession = 0;
    this.currentFallDistance = 0;
    this.isFalling = false;
    this.isJumping = false;
    this.hasHighJump = false; // Reset abilities if needed
    this.canTelekinesis = false;
    this.currentHealth = this.maxHealth; // Reset health
    this.isDead = false; // Reset dead flag
  }
  
  enableHighJump() {
      if (!this.hasHighJump) {
          // REMOVE: console.log("High Jump Enabled!");
          this.hasHighJump = true;
          // Optional: Add a UI notification or visual effect
      }
  }

  // Method to check if player is dead
  checkIfDead() {
    return this.isDead;
  }

  // Method to reset state specifically for respawn (keeps abilities etc)
  resetForRespawn() {
      this.velocity.set(0, 0, 0);
      this.isFalling = false;
      this.currentFallDistance = 0;
      this.isGrounded = true; // Assume respawn point is safe ground
      this.isJumping = false;
      this.currentHealth = this.maxHealth;
      this.isDead = false;
      
      // <<< ADD: Reset abilities on respawn >>>
      this.hasHighJump = false;
      this.canTelekinesis = false;
      if (this.telekinesisIndicator) {
          this.telekinesisIndicator.visible = false; // Hide indicator
      }
  }

  // <<< ADD: Method to get current health state >>>
  getHealthState() {
    return {
      current: this.currentHealth,
      max: this.maxHealth
    };
  }

  // <<< ADD: Method to heal the player >>>
  heal(percentage) {
    const healAmount = Math.floor(this.maxHealth * (percentage / 100));
    const oldHealth = this.currentHealth;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + healAmount);
    const actualHeal = this.currentHealth - oldHealth;

    if (actualHeal > 0) {
      // REMOVE: console.log(`Player healed for ${actualHeal} (${percentage}% of max). Health: ${this.currentHealth}/${this.maxHealth}`);
      window.game?.audio.play('health_pickup'); // Assuming sound 'health_pickup' exists
    } else {
      // REMOVE: console.log(`Player health already full.`);
    }
  }

  // <<< ADD: Separate method to create the indicator >>>
  createTelekinesisIndicator() {
    const telekinesisMaterial = new THREE.MeshBasicMaterial({ color: 0x66ffff, transparent: true, opacity: 0.3 });
    const telekinesisGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const indicator = new THREE.Mesh(telekinesisGeometry, telekinesisMaterial);
    indicator.position.set(0, 0, 0); // Position relative to player mesh group
    return indicator;
  }
} 