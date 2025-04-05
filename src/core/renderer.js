import * as THREE from 'three';

export class Renderer {
  constructor() {
    this.renderer = null;
    this.camera = null;
    this.followTarget = null;
    this.cameraOffset = new THREE.Vector3(0, 5, -10);
    this.nightVisionEnabled = false;
    this.postProcessing = {
      enabled: false,
      composer: null
    };
    this.scene = null;
    this.ambientLight = null;
    this.directionalLight = null;
    this.fog = null;
    this.enablePostProcessing = false;
    this.composer = null;
    this.nightVisionPass = null;

    // Bind methods
    this.onWindowResize = this.onWindowResize.bind(this);
  }

  init() {
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0x404040, 1.0);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.directionalLight.position.set(5, 10, 7.5);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 20;
    this.directionalLight.shadow.camera.bottom = -20;

    // Fog
    this.fog = new THREE.Fog(0x000020, 10, 150);
    
    window.addEventListener('resize', this.onWindowResize, false);
  }

  setFollowTarget(target) {
    this.followTarget = target;
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    console.log(`Window resized: ${window.innerWidth}x${window.innerHeight}`);
  }

  updateCamera() {
    if (!this.followTarget) return;

    const targetPosition = new THREE.Vector3();
    this.followTarget.getWorldPosition(targetPosition);

    const playerQuaternion = new THREE.Quaternion();
    this.followTarget.getWorldQuaternion(playerQuaternion);

    // Apply the offset based on the player's rotation
    const rotatedOffset = this.cameraOffset.clone().applyQuaternion(playerQuaternion);
    const cameraTargetPosition = targetPosition.clone().add(rotatedOffset);

    // Smooth camera movement (lerp)
    this.camera.position.lerp(cameraTargetPosition, 0.1);

    // Look at the player's position
    this.camera.lookAt(targetPosition);
  }

  enableNightVision() {
    this.nightVisionEnabled = true;
    
    // Apply night vision effect (green tint, brightness boost)
    if (!this.postProcessing.enabled) {
      this.setupNightVisionEffect();
    }
  }

  disableNightVision() {
    this.nightVisionEnabled = false;
    
    // Remove night vision effect
    if (this.postProcessing.enabled) {
      // Reset post-processing
      this.postProcessing.enabled = false;
    }
  }

  setupNightVisionEffect() {
    // This would normally use THREE.js post-processing
    // For simplicity, we'll just modify the renderer output
    this.renderer.outputEncoding = THREE.GammaEncoding;
    this.renderer.gammaFactor = 2.2;
    this.renderer.toneMappingExposure = 1.5;
    
    // Add a subtle green overlay
    document.body.style.backgroundColor = 'rgba(0, 50, 0, 0.2)';
    this.renderer.domElement.style.mixBlendMode = 'multiply';
    
    this.postProcessing.enabled = true;
  }

  setEnvironmentLighting(scene, type) {
    // Clear existing lights
    scene.children.forEach(child => {
      if (child.isLight) {
        scene.remove(child);
      }
    });
    
    // Add appropriate lighting based on environment type
    switch (type) {
      case 'surface':
        // Bright daylight
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        scene.add(sunLight);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        // Sky color
        scene.background = new THREE.Color(0x7db6d5);
        scene.fog = new THREE.Fog(0x7db6d5, 50, 200);
        break;
        
      case 'underwater':
        // Bluish underwater lighting
        const waterLight = new THREE.DirectionalLight(0x0077ff, 0.5);
        waterLight.position.set(0, 100, 0);
        waterLight.castShadow = true;
        scene.add(waterLight);
        
        const waterAmbient = new THREE.AmbientLight(0x001e3d, 0.7);
        scene.add(waterAmbient);
        
        // Add point lights for bioluminescence
        for (let i = 0; i < 10; i++) {
          const color = new THREE.Color();
          color.setHSL(0.5 + Math.random() * 0.2, 0.9, 0.7);
          
          const light = new THREE.PointLight(color, 1, 20, 2);
          light.position.set(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 100
          );
          scene.add(light);
        }
        
        // Underwater effect
        scene.background = new THREE.Color(0x0a4a80);
        scene.fog = new THREE.FogExp2(0x0a4a80, 0.03);
        break;
        
      case 'cave':
        // Dark cave with sparse lighting
        const dimAmbient = new THREE.AmbientLight(0x222222, 0.5);
        scene.add(dimAmbient);
        
        // Add a few point lights to represent torches/crystals
        const torch1 = new THREE.PointLight(0xff6633, 1, 20, 2);
        torch1.position.set(10, 5, 5);
        scene.add(torch1);
        
        const torch2 = new THREE.PointLight(0xff6633, 1, 20, 2);
        torch2.position.set(-10, 5, -5);
        scene.add(torch2);
        
        const crystal = new THREE.PointLight(0x66ffff, 1, 30, 2);
        crystal.position.set(0, 10, -20);
        scene.add(crystal);
        
        // Dark environment
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.FogExp2(0x000000, 0.05);
        break;
        
      case 'cosmic':
        // Surreal cosmic environment
        const cosmicAmbient = new THREE.AmbientLight(0x330066, 0.8);
        scene.add(cosmicAmbient);
        
        // Strange otherworldly lights
        for (let i = 0; i < 5; i++) {
          const color = new THREE.Color();
          color.setHSL(Math.random(), 0.9, 0.7);
          
          const cosmicLight = new THREE.PointLight(color, 2, 50, 1);
          cosmicLight.position.set(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
          );
          scene.add(cosmicLight);
        }
        
        // Cosmic background
        scene.background = new THREE.Color(0x110022);
        scene.fog = new THREE.FogExp2(0x110022, 0.01);
        break;
    }
  }

  render(scene, deltaTime) {
    // Update camera position
    this.updateCamera();
    
    // Update billboards
    scene.traverse((object) => {
        if (object.userData.isBillboard && this.camera) {
            // Make the object face the camera
            object.quaternion.copy(this.camera.quaternion);
        }
    });

    // Render the scene
    if (this.postProcessing.enabled && this.postProcessing.composer) {
      this.postProcessing.composer.render(deltaTime);
    } else {
      this.renderer.render(scene, this.camera);
    }
  }
} 