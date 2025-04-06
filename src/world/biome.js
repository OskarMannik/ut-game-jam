import * as THREE from 'three';

export class Biome {
  constructor(type) {
    this.type = type; // 'surface', 'underwater', 'cave', 'cosmic', 'descent'
    this.groundObjects = [];
    this.decorativeObjects = [];
    this.collisionObjects = [];
    this.particleSystems = [];
    this.environmentalEffects = [];
  }
  
  createEnvironment(scene) {
    // Set up scene background, fog, and base geometry based on environment type
    let environmentData = {}; // Initialize return object
    switch (this.type) {
      case 'surface':
        environmentData = this.createSurfaceEnvironment(scene);
        break;
      case 'underwater':
        environmentData = this.createUnderwaterEnvironment(scene);
        break;
      case 'cave':
        environmentData = this.createCaveEnvironment(scene);
        break;
      case 'cosmic':
        environmentData = this.createCosmicEnvironment(scene);
        break;
      case 'descent':
        environmentData = this.createDescentEnvironment(scene);
        break;
      default:
        console.warn(`Unknown biome type: ${this.type}`);
        environmentData = this.createDescentEnvironment(scene);
    }
    
    // Return ground objects, collision objects, and potentially the first platform + platform list
    return {
        groundObjects: this.groundObjects,
        collisionObjects: this.collisionObjects,
        firstPlatform: environmentData.firstPlatform || null,
        platforms: environmentData.platforms || []
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
    
    // <<< Return object (no firstPlatform here) >>>
    return {};
  }
  
  createUnderwaterEnvironment(scene) {
    console.log("[Biome] Creating Underwater Environment...");
    // Underwater blue
    scene.background = new THREE.Color(0x0a4a80);
    scene.fog = new THREE.FogExp2(0x0a4a80, 0.015);
    console.log("[Biome] Background and Fog set.");
    
    // Define box dimensions
    const boxSize = 200;
    const boxHeight = 50;

    // Sandy bottom (Floor)
    const ground = this.createGround(scene, new THREE.Color(0xddcc88), boxSize, false);
    // ground is already added to this.groundObjects and scene in createGround
    this.collisionObjects.push(ground); // Add floor to collisions
    console.log("[Biome] Ground created and added to collisions. Ground objects count:", this.groundObjects.length);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(boxSize, boxSize);
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x052540, side: THREE.DoubleSide });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, boxHeight, 0); // Position ceiling at the top
    ceiling.rotation.x = Math.PI / 2; // Rotate to face down
    scene.add(ceiling);
    this.collisionObjects.push(ceiling);

    // Walls (using BoxGeometry for simplicity might be better, but let's use planes)
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x083860, side: THREE.DoubleSide });

    // Wall +Z
    const wallPosZGeometry = new THREE.PlaneGeometry(boxSize, boxHeight);
    const wallPosZ = new THREE.Mesh(wallPosZGeometry, wallMaterial);
    wallPosZ.position.set(0, boxHeight / 2, boxSize / 2);
    wallPosZ.rotation.y = Math.PI;
    scene.add(wallPosZ);
    this.collisionObjects.push(wallPosZ);

    // Wall -Z
    const wallNegZGeometry = new THREE.PlaneGeometry(boxSize, boxHeight);
    const wallNegZ = new THREE.Mesh(wallNegZGeometry, wallMaterial);
    wallNegZ.position.set(0, boxHeight / 2, -boxSize / 2);
    // No rotation needed
    scene.add(wallNegZ);
    this.collisionObjects.push(wallNegZ);

    // Wall +X
    const wallPosXGeometry = new THREE.PlaneGeometry(boxSize, boxHeight);
    const wallPosX = new THREE.Mesh(wallPosXGeometry, wallMaterial);
    wallPosX.position.set(boxSize / 2, boxHeight / 2, 0);
    wallPosX.rotation.y = -Math.PI / 2;
    scene.add(wallPosX);
    this.collisionObjects.push(wallPosX);

    // Wall -X
    const wallNegXGeometry = new THREE.PlaneGeometry(boxSize, boxHeight);
    const wallNegX = new THREE.Mesh(wallNegXGeometry, wallMaterial);
    wallNegX.position.set(-boxSize / 2, boxHeight / 2, 0);
    wallNegX.rotation.y = Math.PI / 2;
    scene.add(wallNegX);
    this.collisionObjects.push(wallNegX);

    console.log("[Biome] Ceiling and Walls created and added to collisions.");
    
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
    
    // <<< Return object (no firstPlatform here) >>>
    return {};
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
    
    // <<< Return object (no firstPlatform here) >>>
    return {};
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
    
    // <<< Return object (no firstPlatform here) >>>
    return {};
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
      const trunk = tree.getObjectByName('trunk');
      if (trunk) {
          this.collisionObjects.push(trunk);
      }
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
      this.collisionObjects.push(rock);
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
    trunk.name = 'trunk';
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
    const shapeType = Math.random() * 6;
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

  createDescentEnvironment(scene) {
    console.log("[Biome] Creating Descent Environment...");
    
    // <<< RE-ADD CubeTextureLoader >>>
    const loader = new THREE.CubeTextureLoader();
    const texture = loader
        .setPath('/textures/skybox/') // Path relative to the public folder
        .load([
            'px.png', // Positive X
            'nx.png', // Negative X
            'py.png', // Positive Y (Top)
            'ny.png', // Negative Y (Bottom)
            'pz.png', // Positive Z (Front)
            'nz.png'  // Negative Z (Back)
        ]);
    scene.background = texture;
   
    // Keep fog, it often helps blend the skybox with the scene
    scene.fog = new THREE.Fog(0x7db6d5, 50, 150); 
    console.log("[Biome] Skybox background and Fog set."); // Restored original log message

    // <<< Lighting remains the same >>>
    // Remove previous lights
    scene.remove(scene.getObjectByName('topLight')); // Remove if previously added by name
    scene.remove(scene.getObjectByName('ambientLight'));
    
    // Add lighting (directional sunlight)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(50, 100, 50); // Standard sun position
    sunLight.castShadow = true;
    // Configure shadows for better quality
    sunLight.shadow.mapSize.width = 2048; 
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500; // Adjust if needed for descent height
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.name = 'sunLight'; // Optional name
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Brighter ambient
    ambientLight.name = 'ambientLight'; // Optional name
    scene.add(ambientLight);
    console.log("[Biome] Lighting added.");

    // Generate floating platforms
    const platformCount = 30;
    const startY = 145; // <<< Restored original Y >>>
    const endY = 10;   
    const horizontalRange = 25;
    const playerStartY = 150; // <<< Restored original Y >>>

    let currentY = startY;
    let lastPlatformPos = new THREE.Vector3(0, playerStartY, 0); 
    let firstPlatform = null; // Variable to store the first platform
    const platforms = []; // Array to store platform meshes

    for (let i = 0; i < platformCount; i++) {
      let platform;
      let nextPos;
      let platformHeight = 1; 
      let platformSizeX = 0, platformSizeZ = 0; // <<< Keep track of platform size >>>
      
      if (i === 0) {
        // <<< CREATE Specific First Platform >>>
        const firstPlatformSize = 20;
        platformHeight = 1;
        platformSizeX = firstPlatformSize;
        platformSizeZ = firstPlatformSize;
        const firstPlatformGeometry = new THREE.BoxGeometry(platformSizeX, platformHeight, platformSizeZ);
        const firstPlatformMaterial = new THREE.MeshStandardMaterial({
          color: 0x778899, 
          roughness: 0.8,
          metalness: 0.1,
          transparent: true,
          opacity: 0.7
        });
        platform = new THREE.Mesh(firstPlatformGeometry, firstPlatformMaterial);
        platform.castShadow = true;
        platform.receiveShadow = true;
        nextPos = new THREE.Vector3(0, startY, 0); // Center the first platform below player start
        firstPlatform = platform; // Assign to firstPlatform variable
      } else {
        // <<< GENERATE Random Subsequent Platforms >>>
        // <<< Assign size variables inside createFloatingPlatform call context >>>
        const sizeX = Math.random() * 4 + 4;
        const sizeZ = Math.random() * 4 + 4;
        platformHeight = 0.5 + Math.random() * 0.5;
        platform = this.createFloatingPlatform(sizeX, sizeZ, platformHeight); 
        platformSizeX = sizeX;
        platformSizeZ = sizeZ;
        
        // Position platforms progressively lower and randomly horizontally
        const progress = i / (platformCount - 1); 
        const averageYDrop = (startY - endY) / (platformCount - 1);
        const yDrop = averageYDrop * (1 + progress * 0.5) * (1 + (Math.random() - 0.5) * 0.4); 
        currentY -= yDrop;
        
        // <<< ADD: Clamp minimum Y position >>>
        const minPlatformY = 5; // Minimum height above the final Y=0 platform
        currentY = Math.max(minPlatformY, currentY);
        
        let x = (Math.random() - 0.5) * horizontalRange * 2;
        let z = (Math.random() - 0.5) * horizontalRange * 2;

        // <<< ADD: Force offset for the second platform (i=1) >>>
        if (i === 1) {
            const minOffset = 8; // Minimum horizontal distance from center (0,0)
            let attempts = 0;
            // Keep generating random x, z until they are far enough from the center
            while (Math.sqrt(x*x + z*z) < minOffset && attempts < 10) {
                 x = (Math.random() - 0.5) * horizontalRange * 2;
                 z = (Math.random() - 0.5) * horizontalRange * 2;
                 attempts++;
            }
            console.log(`[Biome] Second platform (i=1) positioned at ${x.toFixed(1)}, ${currentY.toFixed(1)}, ${z.toFixed(1)}`);
        }
        
        nextPos = new THREE.Vector3(x, currentY, z);
        
        // Ensure subsequent platforms aren't *too* far horizontally from the *previous* one
        const horizontalDist = new THREE.Vector2(nextPos.x - lastPlatformPos.x, nextPos.z - lastPlatformPos.z).length();
        // <<< MODIFY: Allow slightly larger horizontal jumps lower down >>>
        const maxHorizontalDist = 18 + progress * 4; // Max dist increases from 18 to 22
        if (horizontalDist > maxHorizontalDist) { 
           const dir = new THREE.Vector2(nextPos.x - lastPlatformPos.x, nextPos.z - lastPlatformPos.z).normalize().multiplyScalar((maxHorizontalDist - 3) + Math.random() * 3); // Target near max distance
           nextPos.x = lastPlatformPos.x + dir.x;
           nextPos.z = lastPlatformPos.z + dir.y; 
        }
      }

      platform.position.set(nextPos.x, nextPos.y, nextPos.z);
      lastPlatformPos.copy(nextPos);
      
      platforms.push(platform);

      scene.add(platform);
      this.groundObjects.push(platform); 
      this.collisionObjects.push(platform); 

      // <<< ADD Obstacles >>>
      if (i > 0 && Math.random() < 0.4) { // Add obstacles to ~40% of platforms (not the first)
          const obstacleType = Math.random();
          let obstacle;
          if (obstacleType < 0.5) { // Add a rock
              obstacle = this.createRock();
              // Scale rock slightly
              obstacle.scale.set(0.5, 0.5, 0.5);
          } else { // Add a tree
              obstacle = this.createTree();
              // Scale tree slightly smaller
              obstacle.scale.set(0.4, 0.4, 0.4);
          }
          
          // Position obstacle randomly on the platform surface
          const halfWidth = platformSizeX / 2 * 0.8; // 80% of half-width
          const halfDepth = platformSizeZ / 2 * 0.8; // 80% of half-depth
          obstacle.position.set(
              platform.position.x + (Math.random() - 0.5) * halfWidth,
              platform.position.y + platformHeight / 2, // Place on top surface
              platform.position.z + (Math.random() - 0.5) * halfDepth
          );
          scene.add(obstacle);
          this.decorativeObjects.push(obstacle);
          // Add obstacle to collision objects as well
          // Need to add individual components if it's a group (like the tree)
          obstacle.traverse((child) => {
              if (child.isMesh) {
                  this.collisionObjects.push(child);
              }
          });
      }
    }
    console.log(`[Biome] Generated ${platformCount} platforms.`);

    // Final ground plane at the bottom
    const finalGround = this.createGround(scene, new THREE.Color(0x334455), 100, false);
    finalGround.position.y = 0; // Set ground at Y=0
    this.collisionObjects.push(finalGround); // Also add to collision
    console.log("[Biome] Final ground plane created.");

    console.log("[Biome] Descent Environment Creation COMPLETE.");
    return { firstPlatform: firstPlatform, platforms: platforms };
  }

  createFloatingPlatform(sizeX, sizeZ, platformHeight) {
    const platformGeometry = new THREE.BoxGeometry(sizeX, platformHeight, sizeZ);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.3, 0.4 + Math.random() * 0.2, 0.3 + Math.random() * 0.15), // Varying shades of green
      roughness: 0.9, // Make it look less shiny, more earthy
      metalness: 0.0
    });
    
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.castShadow = true;
    platform.receiveShadow = true;
    
    return platform;
  }
} 