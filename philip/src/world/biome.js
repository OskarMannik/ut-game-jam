import * as THREE from 'three';

export class Biome {
  constructor(type) {
    this.type = type; // 'surface', 'underwater', 'cave', 'cosmic'
    this.groundObjects = [];
    this.decorativeObjects = [];
    this.particleSystems = [];
    this.environmentalEffects = [];
  }
  
  createEnvironment(scene) {
    // Set up scene background, fog, and base geometry based on environment type
    switch (this.type) {
      case 'surface':
        this.createSurfaceEnvironment(scene);
        break;
      case 'underwater':
        this.createUnderwaterEnvironment(scene);
        break;
      case 'cave':
        this.createCaveEnvironment(scene);
        break;
      case 'cosmic':
        this.createCosmicEnvironment(scene);
        break;
      default:
        console.warn(`Unknown biome type: ${this.type}`);
        this.createSurfaceEnvironment(scene); // Default to surface
    }
    
    // Return ground objects for collision detection and ground checks
    return {
        groundObjects: this.groundObjects,
        collisionObjects: this.decorativeObjects // Assuming decorations are also collision obstacles for now
    };
  }
  
  createSurfaceEnvironment(scene) {
    // Sky background
    scene.background = new THREE.Color(0x7db6d5);
    scene.fog = new THREE.Fog(0x7db6d5, 50, 200);
    
    // Ground
    this.createGround(scene, new THREE.Color(0x55aa55), 250, true);
    
    // Add some trees and rocks
    this.addSurfaceDecorations(scene);
    
    // Add lighting (directional sunlight)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
  }
  
  createUnderwaterEnvironment(scene) {
    console.log("[Biome] Creating Underwater Environment...");
    // Underwater blue
    scene.background = new THREE.Color(0x0a4a80);
    scene.fog = new THREE.FogExp2(0x0a4a80, 0.03);
    console.log("[Biome] Background and Fog set.");
    
    // Sandy bottom
    this.createGround(scene, new THREE.Color(0xddcc88), 300, false);
    console.log("[Biome] Ground created. Ground objects count:", this.groundObjects.length);
    
    // Add coral, rocks, underwater plants
    this.addUnderwaterDecorations(scene);
    console.log("[Biome] Underwater decorations added.");
    
    // Add caustics effect (simulated light patterns)
    this.addCausticsEffect(scene);
    console.log("[Biome] Caustics effect added.");
    
    // Add underwater particles (bubbles, floating debris)
    this.addUnderwaterParticles(scene);
    console.log("[Biome] Underwater particles added.");
    
    // Underwater lighting
    const waterLight = new THREE.DirectionalLight(0x0077ff, 0.5);
    waterLight.position.set(0, 100, 0);
    waterLight.castShadow = true;
    scene.add(waterLight);
    
    const waterAmbient = new THREE.AmbientLight(0x001e3d, 0.7);
    scene.add(waterAmbient);
    
    // Add some bioluminescent light sources
    for (let i = 0; i < 10; i++) {
      const color = new THREE.Color();
      color.setHSL(0.5 + Math.random() * 0.2, 0.9, 0.7); // Blue-green hues
      
      const light = new THREE.PointLight(color, 1, 20, 2);
      light.position.set(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 20 + 10,
        (Math.random() - 0.5) * 100
      );
      scene.add(light);
    }
    console.log("[Biome] Underwater lighting added.");
    console.log("[Biome] Underwater Environment Creation COMPLETE.");
  }
  
  createCaveEnvironment(scene) {
    console.log("[Biome] Creating Cave Environment...");
    // Dark cave - Changed background/fog to greyish-blue
    const caveColor = new THREE.Color(0x1a2a3a);
    scene.background = caveColor;
    scene.fog = new THREE.FogExp2(caveColor, 0.025);
    console.log("[Biome] Cave Background and Fog set.");
    
    // Rocky ground
    this.createGround(scene, new THREE.Color(0x555555), 200, false);
    console.log("[Biome] Cave Ground created. Ground objects count:", this.groundObjects.length);
    
    // Add cave features (stalactites, stalagmites, rock formations)
    this.addCaveDecorations(scene);
    console.log("[Biome] Cave decorations added.");
    
    // Add minimal lighting (mostly from point lights)
    const dimAmbient = new THREE.AmbientLight(0x333340, 1.0);
    scene.add(dimAmbient);
    console.log("[Biome] Cave ambient light added.");
    
    // Add some glowing crystals for light
    this.addCaveCrystals(scene);
    console.log("[Biome] Cave crystals (with lights) added.");
    console.log("[Biome] Cave Environment Creation COMPLETE.");
  }
  
  createCosmicEnvironment(scene) {
    // Cosmic void
    scene.background = new THREE.Color(0x110022);
    scene.fog = new THREE.FogExp2(0x110022, 0.01);
    
    // Create abstract floating platforms
    this.createCosmicPlatforms(scene);
    
    // Add surreal objects and effects
    this.addCosmicDecorations(scene);
    
    // Add cosmic particles
    this.addCosmicParticles(scene);
    
    // Strange otherworldly lighting
    const cosmicAmbient = new THREE.AmbientLight(0x330066, 0.8);
    scene.add(cosmicAmbient);
    
    for (let i = 0; i < 5; i++) {
      const color = new THREE.Color();
      color.setHSL(Math.random(), 0.9, 0.7);
      
      const cosmicLight = new THREE.PointLight(color, 2, 50, 1);
      cosmicLight.position.set(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 50 + 20,
        (Math.random() - 0.5) * 100
      );
      scene.add(cosmicLight);
    }
  }
  
  createGround(scene, color, size, hasTexture = true) {
    // Create ground plane
    const groundGeometry = new THREE.PlaneGeometry(size, size, 20, 20);
    let groundMaterial;
    
    if (hasTexture) {
      // In a real implementation, we would load and apply textures here
      groundMaterial = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide,
        wireframe: false
      });
    } else {
      groundMaterial = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide,
        wireframe: false
      });
    }
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Horizontal
    ground.receiveShadow = true;
    scene.add(ground);
    
    this.groundObjects.push(ground);
    
    return ground;
  }
  
  // DECORATIONS FOR EACH ENVIRONMENT
  
  addSurfaceDecorations(scene) {
    // Add trees
    for (let i = 0; i < 20; i++) {
      const tree = this.createTree();
      tree.position.set(
        (Math.random() - 0.5) * 200,
        0,
        (Math.random() - 0.5) * 200
      );
      scene.add(tree);
      this.decorativeObjects.push(tree);
    }
    
    // Add rocks
    for (let i = 0; i < 30; i++) {
      const rock = this.createRock();
      rock.position.set(
        (Math.random() - 0.5) * 200,
        0,
        (Math.random() - 0.5) * 200
      );
      scene.add(rock);
      this.decorativeObjects.push(rock);
    }
  }
  
  addUnderwaterDecorations(scene) {
    console.log("[Biome] addUnderwaterDecorations START");
    // Add coral formations
    for (let i = 0; i < 30; i++) {
      const coral = this.createCoral();
      coral.position.set(
        (Math.random() - 0.5) * 200,
        0,
        (Math.random() - 0.5) * 200
      );
      scene.add(coral);
      this.decorativeObjects.push(coral);
    }
    
    // Add seaweed
    for (let i = 0; i < 40; i++) {
      const seaweed = this.createSeaweed();
      seaweed.position.set(
        (Math.random() - 0.5) * 200,
        0,
        (Math.random() - 0.5) * 200
      );
      scene.add(seaweed);
      this.decorativeObjects.push(seaweed);
    }
    
    // Add underwater rocks
    for (let i = 0; i < 20; i++) {
      const rock = this.createRock();
      rock.position.set(
        (Math.random() - 0.5) * 200,
        0,
        (Math.random() - 0.5) * 200
      );
      rock.scale.set(
        Math.random() * 2 + 1,
        Math.random() * 2 + 1,
        Math.random() * 2 + 1
      );
      scene.add(rock);
      this.decorativeObjects.push(rock);
    }
    console.log("[Biome] addUnderwaterDecorations END");
  }
  
  addCaveDecorations(scene) {
    // Add stalactites (hanging from ceiling)
    for (let i = 0; i < 50; i++) {
      const stalactite = this.createStalactite();
      stalactite.position.set(
        (Math.random() - 0.5) * 150,
        20 + Math.random() * 10,
        (Math.random() - 0.5) * 150
      );
      scene.add(stalactite);
      this.decorativeObjects.push(stalactite);
    }
    
    // Add stalagmites (rising from floor)
    for (let i = 0; i < 50; i++) {
      const stalagmite = this.createStalagmite();
      stalagmite.position.set(
        (Math.random() - 0.5) * 150,
        0,
        (Math.random() - 0.5) * 150
      );
      scene.add(stalagmite);
      this.decorativeObjects.push(stalagmite);
    }
    
    // Add rock formations
    for (let i = 0; i < 20; i++) {
      const rockFormation = this.createRockFormation();
      rockFormation.position.set(
        (Math.random() - 0.5) * 150,
        0,
        (Math.random() - 0.5) * 150
      );
      scene.add(rockFormation);
      this.decorativeObjects.push(rockFormation);
    }
  }
  
  addCosmicDecorations(scene) {
    // Add floating crystals
    for (let i = 0; i < 30; i++) {
      const crystal = this.createCosmicCrystal();
      crystal.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 100 + 50,
        (Math.random() - 0.5) * 200
      );
      scene.add(crystal);
      this.decorativeObjects.push(crystal);
    }
    
    // Add abstract shapes
    for (let i = 0; i < 20; i++) {
      const shape = this.createAbstractShape();
      shape.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 100 + 50,
        (Math.random() - 0.5) * 200
      );
      scene.add(shape);
      this.decorativeObjects.push(shape);
    }
  }
  
  // OBJECT CREATION METHODS
  
  createTree() {
    const treeGroup = new THREE.Group();
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Foliage (simple cone for now)
    const foliageGeometry = new THREE.ConeGeometry(3, 8, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228822 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 8;
    foliage.castShadow = true;
    treeGroup.add(foliage);
    
    return treeGroup;
  }
  
  createRock() {
    // Create a simple rock
    const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 2 + 0.5, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    // Random rotation
    rock.rotation.x = Math.random() * Math.PI;
    rock.rotation.y = Math.random() * Math.PI;
    rock.rotation.z = Math.random() * Math.PI;
    
    return rock;
  }
  
  createCoral() {
    const coralGroup = new THREE.Group();
    
    // Random coral color
    const hue = 0.8 + Math.random() * 0.2; // Reddish to purplish
    const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
    
    // Base
    const baseGeometry = new THREE.CylinderGeometry(0.5, 1, 1.5, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: color });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    coralGroup.add(base);
    
    // Branches
    const branchCount = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < branchCount; i++) {
      const branchGeometry = new THREE.ConeGeometry(0.3, 2, 8);
      const branchMaterial = new THREE.MeshStandardMaterial({ color: color });
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      
      // Position branches around the base
      const angle = (i / branchCount) * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.2;
      branch.position.x = Math.cos(angle) * radius;
      branch.position.z = Math.sin(angle) * radius;
      branch.position.y = 1 + Math.random() * 0.5;
      
      // Rotate branches outward
      branch.rotation.x = Math.random() * 0.5 - 0.25;
      branch.rotation.y = angle;
      branch.rotation.z = Math.PI / 2 - Math.random() * 0.3;
      
      branch.castShadow = true;
      coralGroup.add(branch);
    }
    
    return coralGroup;
  }
  
  createSeaweed() {
    const seaweedGroup = new THREE.Group();
    
    // Create several stalks
    const stalkCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < stalkCount; i++) {
      const height = 3 + Math.random() * 5;
      const segmentCount = Math.floor(height * 1.5);
      
      let prevSegment = null;
      for (let j = 0; j < segmentCount; j++) {
        const segmentGeometry = new THREE.CylinderGeometry(0.1, 0.1, height / segmentCount, 5);
        const segmentMaterial = new THREE.MeshStandardMaterial({ color: 0x00aa44 });
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        
        if (!prevSegment) {
          // Position the first segment at the base
          segment.position.set(
            (Math.random() - 0.5) * 0.5,
            height / segmentCount / 2,
            (Math.random() - 0.5) * 0.5
          );
          seaweedGroup.add(segment);
        } else {
          // Stack segments
          segment.position.y = height / segmentCount;
          // Add some randomness to the orientation
          segment.rotation.x = (Math.random() - 0.5) * 0.2;
          segment.rotation.z = (Math.random() - 0.5) * 0.2;
          prevSegment.add(segment);
        }
        
        prevSegment = segment;
      }
    }
    
    return seaweedGroup;
  }
  
  createStalactite() {
    // Hanging from ceiling
    const height = 2 + Math.random() * 5;
    const geometry = new THREE.ConeGeometry(0.5, height, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0x777777 });
    const stalactite = new THREE.Mesh(geometry, material);
    stalactite.rotation.x = Math.PI; // Flip upside down
    stalactite.castShadow = true;
    
    return stalactite;
  }
  
  createStalagmite() {
    // Rising from floor
    const height = 1 + Math.random() * 3;
    const geometry = new THREE.ConeGeometry(0.5, height, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0x777777 });
    const stalagmite = new THREE.Mesh(geometry, material);
    stalagmite.castShadow = true;
    
    return stalagmite;
  }
  
  createRockFormation() {
    const formationGroup = new THREE.Group();
    
    // Add several rocks in a cluster
    const rockCount = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < rockCount; i++) {
      const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 2 + 0.5, 0);
      const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      
      rock.position.set(
        (Math.random() - 0.5) * 3,
        Math.random() * 2,
        (Math.random() - 0.5) * 3
      );
      
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      rock.castShadow = true;
      formationGroup.add(rock);
    }
    
    return formationGroup;
  }
  
  addCaveCrystals(scene) {
    console.log("[Biome] addCaveCrystals START");
    // Add glowing crystals for light
    for (let i = 0; i < 30; i++) {
      const crystalGroup = this.createCrystal();
      
      crystalGroup.position.set(
        (Math.random() - 0.5) * 150,
        Math.random() * 20,
        (Math.random() - 0.5) * 150
      );
      
      scene.add(crystalGroup);
      this.decorativeObjects.push(crystalGroup);
    }
    console.log("[Biome] addCaveCrystals END");
  }
  
  createCrystal() {
    const crystalGroup = new THREE.Group();
    
    // Random crystal color
    const hue = Math.random(); // Random color
    const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
    const emissiveColor = new THREE.Color().setHSL(hue, 0.9, 0.3);
    
    // Crystal mesh
    const geometry = new THREE.OctahedronGeometry(0.5 + Math.random() * 0.5, 0);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissiveColor,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8
    });
    
    const crystal = new THREE.Mesh(geometry, material);
    crystal.castShadow = true;
    crystalGroup.add(crystal);
    
    // Add point light inside crystal
    const light = new THREE.PointLight(color, 1.5, 25);
    crystalGroup.add(light);
    
    return crystalGroup;
  }
  
  createCosmicPlatforms(scene) {
    // Create floating platforms
    for (let i = 0; i < 20; i++) {
      const platform = this.createCosmicPlatform();
      platform.position.set(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 100 + 50,
        (Math.random() - 0.5) * 150
      );
      scene.add(platform);
      this.groundObjects.push(platform); // Platforms are ground objects for player collision
    }
  }
  
  createCosmicPlatform() {
    // Create abstract platform
    const size = 10 + Math.random() * 15;
    let geometry;
    
    // Random platform shapes
    const shapeType = Math.floor(Math.random() * 4);
    switch (shapeType) {
      case 0:
        geometry = new THREE.CircleGeometry(size / 2, 8);
        break;
      case 1:
        geometry = new THREE.RingGeometry(size / 3, size / 2, 8);
        break;
      case 2:
        geometry = new THREE.PlaneGeometry(size, size);
        break;
      case 3:
        geometry = new THREE.TorusGeometry(size / 2, size / 6, 8, 8);
        break;
    }
    
    // Random color with cosmic theme
    const hue = Math.random();
    const saturation = 0.7;
    const lightness = 0.5;
    const color = new THREE.Color().setHSL(hue, saturation, lightness);
    
    // Create material with glow
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide,
    });
    
    const platform = new THREE.Mesh(geometry, material);
    platform.rotation.x = -Math.PI / 2; // Make horizontal
    platform.receiveShadow = true;
    
    return platform;
  }
  
  createCosmicCrystal() {
    const crystalGroup = new THREE.Group();
    
    // Random crystal color with cosmic theme
    const hue = Math.random();
    const color = new THREE.Color().setHSL(hue, 0.9, 0.7);
    
    // Create crystal
    const geometry = new THREE.TetrahedronGeometry(1 + Math.random() * 2, 0);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8
    });
    
    const crystal = new THREE.Mesh(geometry, material);
    crystal.castShadow = true;
    crystalGroup.add(crystal);
    
    // Add light
    const light = new THREE.PointLight(color, 1, 10);
    crystalGroup.add(light);
    
    // Slow rotation animation
    const rotationSpeed = {
      x: (Math.random() - 0.5) * 0.01,
      y: (Math.random() - 0.5) * 0.01,
      z: (Math.random() - 0.5) * 0.01
    };
    
    crystal.userData.rotate = true;
    crystal.userData.rotationSpeed = rotationSpeed;
    
    return crystalGroup;
  }
  
  createAbstractShape() {
    const shapeGroup = new THREE.Group();
    
    // Random shape type
    const shapeType = Math.floor(Math.random() * 6);
    let geometry;
    
    switch (shapeType) {
      case 0:
        geometry = new THREE.TorusKnotGeometry(2, 0.5, 64, 8, 2, 3);
        break;
      case 1:
        geometry = new THREE.IcosahedronGeometry(2, 0);
        break;
      case 2:
        geometry = new THREE.OctahedronGeometry(2, 0);
        break;
      case 3:
        geometry = new THREE.TetrahedronGeometry(2, 0);
        break;
      case 4:
        geometry = new THREE.SphereGeometry(2, 8, 8);
        break;
      case 5:
        geometry = new THREE.TorusGeometry(2, 0.5, 8, 16);
        break;
    }
    
    // Cosmic material
    const hue = Math.random();
    const color = new THREE.Color().setHSL(hue, 0.9, 0.7);
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.7,
      wireframe: Math.random() > 0.7 // Sometimes make wireframe
    });
    
    const shape = new THREE.Mesh(geometry, material);
    shape.castShadow = true;
    shapeGroup.add(shape);
    
    return shapeGroup;
  }
  
  // ENVIRONMENTAL EFFECTS
  
  addCausticsEffect(scene) {
    console.log("[Biome] addCausticsEffect START (Placeholder)");
    // Placeholder - Implement actual caustics effect later
    console.log("[Biome] addCausticsEffect END (Placeholder)");
  }
  
  addUnderwaterParticles(scene) {
    console.log("[Biome] addUnderwaterParticles START (Placeholder)");
    // Placeholder - Implement particle systems later
    console.log("[Biome] addUnderwaterParticles END (Placeholder)");
  }
  
  addCosmicParticles(scene) {
    // In a real implementation, this would use THREE.js particle systems
    // For this demo, we'll just log that we would add these particles
    console.log('Would add cosmic particle systems');
  }
} 