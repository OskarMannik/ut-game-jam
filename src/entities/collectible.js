import * as THREE from 'three';

export class Collectible {
  constructor(position, type, id, data = {}) {
    this.position = position.clone();
    this.type = type; // 'artifact' or 'memory'
    this.id = id;
    this.data = data; // Additional data (effect type, memory content, etc.)
    this.mesh = this.createMesh();
    this.collected = false;
    this.bobHeight = 0.5; // How high the item bobs
    this.bobSpeed = 1.5; // Speed of bobbing animation
    this.rotationSpeed = 1; // Speed of rotation animation
    this.startY = position.y; // Starting Y position for bobbing
    
    // Add to scene at specified position
    this.mesh.position.copy(this.position);
  }
  
  createMesh() {
    let geometry, material;
    
    if (this.type === 'artifact') {
      // Create artifact mesh (a glowing crystal/relic)
      switch (this.data.effect?.type) {
        case 'oxygen_efficiency':
          // Blue crystal
          geometry = new THREE.OctahedronGeometry(0.5, 1);
          material = new THREE.MeshStandardMaterial({
            color: 0x00aaff,
            emissive: 0x0044aa,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
          });
          break;
          
        case 'night_vision':
          // Green crystal
          geometry = new THREE.IcosahedronGeometry(0.5, 0);
          material = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            emissive: 0x00aa44,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
          });
          break;
          
        case 'telekinesis':
          // Purple crystal
          geometry = new THREE.TetrahedronGeometry(0.5, 1);
          material = new THREE.MeshStandardMaterial({
            color: 0xaa44ff,
            emissive: 0x662299,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
          });
          break;
          
        default:
          // Default artifact (golden relic)
          geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8);
          material = new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            emissive: 0xaa7700,
            emissiveIntensity: 0.5,
            metalness: 1.0,
            roughness: 0.3
          });
      }
    } else if (this.type === 'memory') {
      // Create memory mesh (a glowing orb/fragment)
      geometry = new THREE.SphereGeometry(0.3, 16, 16);
      material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xaaccff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.7
      });
    } else {
      // Default unknown collectible
      geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add a point light to make it glow
    const light = new THREE.PointLight(material.color, 0.5, 3);
    light.position.set(0, 0, 0);
    mesh.add(light);
    
    return mesh;
  }
  
  update(deltaTime) {
    if (this.collected) return;
    
    // Bob up and down
    this.mesh.position.y = this.startY + Math.sin(performance.now() / 1000 * this.bobSpeed) * this.bobHeight;
    
    // Rotate
    this.mesh.rotation.y += this.rotationSpeed * deltaTime;
  }
  
  collect() {
    if (this.collected) return false;
    
    this.collected = true;
    
    // Play collection animation
    this.playCollectionAnimation();
    
    return {
      type: this.type,
      id: this.id,
      data: this.data
    };
  }
  
  playCollectionAnimation() {
    // Scale down and fade out
    const duration = 0.5; // Animation duration in seconds
    let progress = 0;
    
    const animate = (timestamp) => {
      if (!this.mesh) return; // Stop if mesh has been removed
      
      progress += 1/60; // Roughly 60fps
      const t = Math.min(progress / duration, 1);
      
      // Scale down
      this.mesh.scale.set(1 - t, 1 - t, 1 - t);
      
      // Fade out (if material supports opacity)
      if (this.mesh.material.transparent) {
        this.mesh.material.opacity = 1 - t;
      }
      
      // Move upward slightly
      this.mesh.position.y += 1 * (1/60);
      
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete, can now safely remove from scene
        if (this.mesh.parent) {
          this.mesh.parent.remove(this.mesh);
        }
        this.mesh = null;
      }
    };
    
    requestAnimationFrame(animate);
  }
}

// Factory method to create different types of collectibles
export function createCollectible(position, type, id, effectType = null) {
  let data = {};
  
  if (type === 'artifact') {
    if (effectType) {
      data.effect = { type: effectType };
    }
  } else if (type === 'memory') {
    // Assign resonance and image based on ID (example structure)
    switch (id) {
      // Surface Memories
      case 'surface_memory_1':
        data.content = "A faded photograph... sunshine, laughter. A feeling of warmth.";
        data.resonance = 'Hope';
        data.imagePath = '/images/memories/surface_hope.png'; // Placeholder path
        break;
      case 'surface_memory_2':
        data.content = "Footprints in the sand, leading away. A sense of departure.";
        data.resonance = 'Sorrow';
        data.imagePath = '/images/memories/surface_sorrow.png'; // Placeholder path
        break;
      // Underwater Memories
      case 'underwater_memory_1':
        data.content = "A swirling current pulling downwards. The pressure increases...";
        data.resonance = 'Fear';
        data.imagePath = '/images/memories/underwater_fear.png'; // Placeholder path
        break;
      case 'underwater_memory_2':
        data.content = "Strange glowing plants swaying rhythmically. A hidden beauty.";
        data.resonance = 'Curiosity';
        data.imagePath = '/images/memories/underwater_curiosity.png'; // Placeholder path
        break;
      // Cave Memories
      case 'cave_memory_1':
        data.content = "Echoes in the dark. Something ancient slumbers here.";
        data.resonance = 'Awe';
        data.imagePath = '/images/memories/cave_awe.png'; // Placeholder path
        break;
      case 'cave_memory_2':
        data.content = "A cracked stone tablet with unreadable symbols. A lost history.";
        data.resonance = 'Mystery';
        data.imagePath = '/images/memories/cave_mystery.png'; // Placeholder path
        break;
      // Add cases for other memories (ruins, subconscious, void) here later...
      default:
        data.content = `Memory Fragment ${id}: An indistinct flash of the past.`;
        data.resonance = 'Neutral';
        data.imagePath = '/images/memories/default.png'; // Placeholder path
    }
  }
  
  return new Collectible(position, type, id, data);
} 