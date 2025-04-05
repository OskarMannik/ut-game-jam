import * as THREE from 'three';

export class InteractiveObject {
  constructor(position, name, interactCallback, options = {}) {
    this.position = position.clone();
    this.name = name;
    this.interactCallback = interactCallback;
    this.interactionRadius = 3; // How close the player needs to be to interact
    this.isHighlighted = false;
    this.pulseIntensity = 0;
    this.pulseDirection = 1;
    this.pulseSpeed = 3;
    this.alwaysVisible = options.alwaysVisible || false;
    
    // Create the mesh
    this.mesh = this.createMesh();
    this.mesh.position.copy(this.position);
    
    // Text label
    this.label = this.createLabel(name);
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
    
    if (this.alwaysVisible) {
      // Slightly less prominent if always visible but not highlighted
      this.baseMesh.material.opacity = 0.8;
      this.light.intensity = 1.0;
      this.coreMesh.material.opacity = 0.85;
    } else {
      // Default appearance for objects that highlight on approach
      this.baseMesh.material.opacity = 0.7;
      this.light.intensity = 1.0;
      this.coreMesh.material.opacity = 0.8;
    }
    
    return portalGroup;
  }
  
  createLabel(name) {
    // Use a canvas texture for better text rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const fontSize = 48; // Use a larger font size for better texture quality
    context.font = `Bold ${fontSize}px Arial`;
    const textWidth = context.measureText(name).width;

    // Scale canvas to fit text, power of 2 dimensions often preferred for textures
    canvas.width = THREE.MathUtils.ceilPowerOfTwo(textWidth + 40); // Add padding
    canvas.height = THREE.MathUtils.ceilPowerOfTwo(fontSize + 20); // Add padding

    // Re-apply font and draw text after resize
    context.font = `Bold ${fontSize}px Arial`;
    context.fillStyle = 'rgba(255, 255, 255, 0.95)'; // Slightly less transparent
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0, // Start hidden unless alwaysVisible
      side: THREE.DoubleSide,
      depthWrite: false // Prevent z-fighting issues with transparent text
    });

    // Adjust plane size based on canvas aspect ratio to avoid stretching
    const planeHeight = 1.0; // Make label a bit bigger
    const planeWidth = planeHeight * (canvas.width / canvas.height);
    const labelGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.y = 2.5; // Position slightly higher above the object
    label.userData.isBillboard = true; // Flag for renderer to make it face camera

    // Set initial opacity based on alwaysVisible flag
    label.material.opacity = this.alwaysVisible ? 1.0 : 0;

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
      // Brighter highlight effect
      this.baseMesh.material.emissiveIntensity = 1.5; 
      this.light.intensity = 2.5;
      // Ensure label is visible when highlighted (even if alwaysVisible)
      this.label.material.opacity = 1.0; 
    } else {
      // Reset to normal (potentially always visible) appearance
      this.baseMesh.material.emissiveIntensity = this.alwaysVisible ? 0.8 : 0.5;
      this.light.intensity = this.alwaysVisible ? 1.5 : 1.0;
      
      // Hide label only if not alwaysVisible
      if (!this.alwaysVisible) {
        this.label.material.opacity = 0;
      }
      // If alwaysVisible, label opacity is already 1 from createLabel/highlight
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