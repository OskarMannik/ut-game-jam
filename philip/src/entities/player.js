import * as THREE from 'three';

export class Player {
  constructor(startPosition = new THREE.Vector3(0, 2, 0)) {
    // Player properties
    this.moveSpeed = 10;
    this.turnSpeed = 2.5;
    this.jumpForce = 15;
    this.gravity = 30;
    this.swimSpeed = 5;
    this.isUnderwater = false;
    this.canTelekinesis = false;
    
    // Player state
    this.velocity = new THREE.Vector3();
    this.isGrounded = false;
    this.isJumping = false;
    this.isFalling = false;
    this.isSwimming = false;
    
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
    const light = new THREE.PointLight(0xffffcc, 1, 10);
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
    
    // Check if player is underwater
    this.isUnderwater = levelManager.isPositionUnderwater ? 
      levelManager.isPositionUnderwater(this.mesh.position) : false;
    
    // Handle player movement based on environment
    if (this.isUnderwater) {
      this.updateUnderwaterMovement(deltaTime, inputState);
    } else {
      this.updateLandMovement(deltaTime, inputState);
    }
    
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
    
    // Check for interactive objects
    if (inputState.interact && levelManager.getClosestInteractiveObject) {
      this.interact(levelManager);
    }
    
    // Use telekinesis ability if available
    if (inputState.action && this.canTelekinesis && levelManager.getMovableObjects) {
      this.useTelekinesis(levelManager);
    }
  }
  
  updateLandMovement(deltaTime, inputState) {
    // Check if player is grounded
    this.checkGrounded();
    
    // Reset horizontal velocity
    this.velocity.x = 0;
    this.velocity.z = 0;
    
    // Calculate forward direction based on player rotation
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(this.mesh.quaternion);
    
    // Calculate right direction based on player rotation
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.mesh.quaternion);
    
    // Apply movement based on input
    if (inputState.forward) {
      this.velocity.add(forward.multiplyScalar(this.moveSpeed));
    }
    if (inputState.backward) {
      this.velocity.add(forward.multiplyScalar(-this.moveSpeed * 0.7)); // Slower backward movement
    }
    if (inputState.left) {
      this.mesh.rotation.y += this.turnSpeed * deltaTime;
    }
    if (inputState.right) {
      this.mesh.rotation.y -= this.turnSpeed * deltaTime;
    }
    
    // Handle jumping
    if (inputState.jump && this.isGrounded && !this.isJumping) {
      this.velocity.y = this.jumpForce;
      this.isJumping = true;
      this.isGrounded = false;
    }
    
    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * deltaTime;
    } else {
      this.velocity.y = 0;
      this.isJumping = false;
    }
  }
  
  updateUnderwaterMovement(deltaTime, inputState) {
    // Different physics underwater (smoother movement, lower gravity)
    this.velocity.multiplyScalar(0.9); // Water resistance
    
    // Calculate forward direction based on player rotation
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(this.mesh.quaternion);
    
    // Calculate right direction based on player rotation
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.mesh.quaternion);
    
    // Underwater movement
    if (inputState.forward) {
      this.velocity.add(forward.multiplyScalar(this.swimSpeed));
    }
    if (inputState.backward) {
      this.velocity.add(forward.multiplyScalar(-this.swimSpeed * 0.7));
    }
    if (inputState.left) {
      this.mesh.rotation.y += this.turnSpeed * 0.7 * deltaTime;
    }
    if (inputState.right) {
      this.mesh.rotation.y -= this.turnSpeed * 0.7 * deltaTime;
    }
    
    // Swim up/down
    if (inputState.jump) {
      this.velocity.y += this.swimSpeed * 0.8 * deltaTime;
    } else {
      // Slight downward drift when not actively swimming up
      this.velocity.y -= this.gravity * 0.1 * deltaTime;
    }
  }
  
  checkGrounded() {
    // Update ray origin to match player position
    this.groundRay.ray.origin.copy(this.mesh.position);
    
    // Default to not grounded if no ground objects available
    this.isGrounded = false;
    
    // Skip raycasting if we don't have any ground objects
    // This will be replaced later when we have proper ground objects
    return;
    
    // Cast ray downwards to check for ground
    // const intersects = this.groundRay.intersectObjects(/* ground objects would be passed here */);
    
    // if (intersects.length > 0) {
    //   this.isGrounded = true;
    // } else {
    //   this.isGrounded = false;
    // }
  }
  
  handleCollisions(levelManager) {
    // Check for collisions with level geometry
    const collisions = levelManager.checkCollisions ? levelManager.checkCollisions(this.hitbox) : [];
    
    if (collisions && collisions.length > 0) {
      // Resolve collisions by adjusting player position
      collisions.forEach(collision => {
        if (collision && collision.normal && typeof collision.depth === 'number') {
          // Move player away from collision
          this.mesh.position.add(collision.normal.multiplyScalar(collision.depth));
        }
      });
      
      // Update hitbox
      this.hitbox.setFromObject(this.mesh);
    }
  }
  
  checkCollectibles(levelManager) {
    // Get collectibles near player
    const collectibles = levelManager.getCollectiblesInRadius(
      this.mesh.position,
      this.collectionRadius
    );
    
    // Collect them if close enough
    collectibles.forEach(collectible => {
      levelManager.collectItem(collectible.id);
    });
  }
  
  interact(levelManager) {
    // Check for interactive objects near player
    const interactiveObject = levelManager.getClosestInteractiveObject(
      this.mesh.position,
      3 // Interaction radius
    );
    
    if (interactiveObject) {
      interactiveObject.interact();
    }
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
    this.canTelekinesis = true;
    // Visual indicator that telekinesis is active
    const telekinesisMaterial = new THREE.MeshBasicMaterial({ color: 0x66ffff, transparent: true, opacity: 0.3 });
    const telekinesisGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const telekinesisIndicator = new THREE.Mesh(telekinesisGeometry, telekinesisMaterial);
    telekinesisIndicator.position.set(0, 0, 0);
    this.mesh.add(telekinesisIndicator);
  }
  
  takeDamage(amount) {
    // Placeholder for damage system
    console.log(`Player takes ${amount} damage`);
  }
} 