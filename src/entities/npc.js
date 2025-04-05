import * as THREE from 'three';

export class NPC {
  constructor(position, name = 'Mysterious Figure', dialogue = ["..."], appearance = {}) {
    this.position = position.clone();
    this.name = name;
    this.dialogue = Array.isArray(dialogue) ? dialogue : [dialogue]; // Ensure dialogue is an array
    this.currentDialogueIndex = 0;
    this.appearance = appearance;
    this.interactionRadius = 3; // How close the player needs to be
    this.desire = appearance.desire || null; // Store desire data
    this.offer = appearance.offer || null;   // Store offer data
    
    this.mesh = this.createMesh();
    this.mesh.position.copy(this.position);
    
    // Add reference to the NPC instance for interaction detection
    this.mesh.userData.npc = this;
  }

  createMesh() {
    // Simple placeholder mesh (e.g., a slightly taller, different colored capsule)
    const geometry = new THREE.CapsuleGeometry(0.6, 1.8, 4, 8);
    const material = new THREE.MeshStandardMaterial({
      color: this.appearance.color || 0x88aaff, // Default pale blue
      roughness: 0.8,
      metalness: 0.2
    });
    const npcMesh = new THREE.Mesh(geometry, material);
    npcMesh.position.y = 1.2; // Adjust pivot point
    npcMesh.castShadow = true;

    // Add a simple floating indicator above the head?
    const indicatorGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.y = 2.5; // Above the capsule
    npcMesh.add(indicator);

    return npcMesh;
  }

  interact() {
    const currentLineIndex = this.currentDialogueIndex;
    const currentLine = this.dialogue[currentLineIndex];
    let isComplete = false;
    let canTrade = false;

    // Advance dialogue index
    this.currentDialogueIndex = (this.currentDialogueIndex + 1);
    if (this.currentDialogueIndex >= this.dialogue.length) {
      this.currentDialogueIndex = 0; // Reset index
      isComplete = true; // Mark as complete for standard dialogue cycle
      
      // Check for trade possibility ONLY on the last line index
      if (this.desire) {
         // Check if player *could* fulfill desire (logic moved to Game)
         canTrade = true; // Signal that a trade prompt should be shown
         isComplete = false; // Don't automatically close if trade is possible
      }
    }
    
    console.log(`[NPC ${this.name}] says: ${currentLine}`);
    return {
        speaker: this.name,
        text: currentLine,
        isComplete: isComplete,
        canTrade: canTrade, // Add flag
        desire: this.desire, // Pass desire info
        offer: this.offer // Pass offer info
    }; 
  }

  update(deltaTime) {
    // Placeholder for idle animations or behavior later
    // Maybe slight bobbing or turning?
    if (this.mesh) {
        // Example: slight rotation
        // this.mesh.rotation.y += 0.1 * deltaTime;
    }
  }
} 