import * as THREE from 'three';

export class InteractiveObject {
  constructor(position, name, interactCallback) {
    this.position = position.clone();
    this.name = name;
    this.interactCallback = interactCallback;
    this.interactionRadius = 3; // How close the player needs to be to interact
    this.isHighlighted = false;
    this.pulseIntensity = 0;
    this.pulseDirection = 1;
    this.pulseSpeed = 3;
    
    // Create the mesh
    this.mesh = this.createMesh();
    this.mesh.position.copy(this.position);
    
    // Text label
    this.label = this.createLabel();
    this.mesh.add(this.label);
    
    // Trigger box for detecting player proximity
    this.triggerBox = new THREE.Box3().setFromObject(this.mesh);
    this.triggerBox.expandByScalar(this.interactionRadius);
  }
  
  createMesh() {
    // Create a glowing portal/interactive object
    const portalGroup = new THREE.Group();
    
    // Base structure
    const baseGeometry = new THREE.SphereGeometry(1, 16, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      emissive: 0x0044ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    portalGroup.add(base);
    
    // Inner core
    const coreGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    portalGroup.add(core);
    
    // Glow effect (point light)
    const light = new THREE.PointLight(0x4488ff, 1, 5);
    light.position.set(0, 0, 0);
    portalGroup.add(light);
    
    // Store references to modify during updates
    this.baseMesh = base;
    this.coreMesh = core;
    this.light = light;
    
    return portalGroup;
  }
  
  createLabel() {
    // This would normally use HTML or THREE.js text geometry
    // For now, we'll just create a placeholder
    const labelGeometry = new THREE.PlaneGeometry(2, 0.5);
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.y = 2; // Position above the object
    label.rotation.x = Math.PI / 2; // Face upward
    
    return label;
  }
  
  update(deltaTime, playerPosition) {
    // Calculate distance to player
    const distance = this.position.distanceTo(playerPosition);
    
    // Check if player is within interaction range
    const inRange = distance <= this.interactionRadius;
    
    // Update highlighting based on player proximity
    if (inRange !== this.isHighlighted) {
      this.isHighlighted = inRange;
      this.updateHighlight();
    }
    
    // Animate portal
    this.animatePortal(deltaTime);
  }
  
  updateHighlight() {
    if (this.isHighlighted) {
      // Show highlight effect
      this.baseMesh.material.emissiveIntensity = 1.0;
      this.light.intensity = 2.0;
      
      // Show label
      this.label.material.opacity = 1.0;
    } else {
      // Reset to normal appearance
      this.baseMesh.material.emissiveIntensity = 0.5;
      this.light.intensity = 1.0;
      
      // Hide label
      this.label.material.opacity = 0;
    }
  }
  
  animatePortal(deltaTime) {
    // Pulse animation
    this.pulseIntensity += this.pulseDirection * this.pulseSpeed * deltaTime;
    
    if (this.pulseIntensity >= 1) {
      this.pulseIntensity = 1;
      this.pulseDirection = -1;
    } else if (this.pulseIntensity <= 0) {
      this.pulseIntensity = 0;
      this.pulseDirection = 1;
    }
    
    // Apply pulse to inner core
    const scale = 0.6 + (this.pulseIntensity * 0.1);
    this.coreMesh.scale.set(scale, scale, scale);
    
    // Subtle rotation
    this.baseMesh.rotation.y += 0.5 * deltaTime;
    this.coreMesh.rotation.y -= 0.3 * deltaTime;
  }
  
  interact() {
    if (this.interactCallback) {
      // Execute the callback and return its result
      return this.interactCallback();
    } 
    return null; // Return null if no callback
  }
  
  // Method to change the portal's appearance based on destination
  setDestinationType(type) {
    switch (type) {
      case 'underwater':
        this.baseMesh.material.color.set(0x0088ff);
        this.baseMesh.material.emissive.set(0x0044aa);
        this.light.color.set(0x0088ff);
        break;
        
      case 'cave':
        this.baseMesh.material.color.set(0x884400);
        this.baseMesh.material.emissive.set(0x442200);
        this.light.color.set(0x884400);
        break;
        
      case 'ruins':
        this.baseMesh.material.color.set(0xaa8844);
        this.baseMesh.material.emissive.set(0x554422);
        this.light.color.set(0xaa8844);
        break;
        
      case 'subconscious':
        this.baseMesh.material.color.set(0xaa44ff);
        this.baseMesh.material.emissive.set(0x5522aa);
        this.light.color.set(0xaa44ff);
        break;
        
      case 'void':
        this.baseMesh.material.color.set(0x220044);
        this.baseMesh.material.emissive.set(0x110022);
        this.light.color.set(0x220044);
        break;
        
      default:
        // Default portal appearance
        this.baseMesh.material.color.set(0x4488ff);
        this.baseMesh.material.emissive.set(0x0044ff);
        this.light.color.set(0x4488ff);
    }
  }
  
  // Play special effects when the player uses this portal
  playActivationEffect() {
    // Expand the portal
    const duration = 1.0; // seconds
    let progress = 0;
    
    const animate = (timestamp) => {
      progress += 1/60; // approximately 60fps
      const t = Math.min(progress / duration, 1);
      
      // Scale up
      const scale = 1 + t;
      this.baseMesh.scale.set(scale, scale, scale);
      this.coreMesh.scale.set(scale, scale, scale);
      
      // Increase brightness
      this.baseMesh.material.emissiveIntensity = 0.5 + (t * 0.5);
      this.light.intensity = 1 + (t * 3);
      
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        // Reset after animation
        setTimeout(() => {
          this.baseMesh.scale.set(1, 1, 1);
          this.coreMesh.scale.set(0.6, 0.6, 0.6);
          this.updateHighlight(); // Reset material based on highlight state
        }, 500);
      }
    };
    
    requestAnimationFrame(animate);
  }
} 