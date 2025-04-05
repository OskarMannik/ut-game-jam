// Ensure Three.js is loaded
import * as THREE from 'three';

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7db6d5); // Sky blue background
scene.fog = new THREE.Fog(0x7db6d5, 50, 200); // Add fog for depth

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const cameraOffset = new THREE.Vector3(0, 5, -10); // Offset from the car

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
document.body.appendChild(renderer.domElement);

// --- CLOCK ---
const clock = new THREE.Clock();

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Sun light
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
// Configure shadow properties
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);
// Optional: Add a light helper to visualize direction
// const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
// scene.add(lightHelper);
// const shadowCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
// scene.add(shadowCameraHelper);


// --- GROUND ---
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide }); // Grey ground
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
ground.receiveShadow = true; // Allow ground to receive shadows
scene.add(ground);

// --- CAR ---
const car = createCar();
scene.add(car);

function createCar() {
    const carGroup = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red car
    const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.y = 0.4; // Lift body slightly off the ground
    carBody.castShadow = true;
    carGroup.add(carBody);

    // Wheels (simple cylinders)
    const wheelRadius = 0.4;
    const wheelThickness = 0.3;
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 24);
    wheelGeometry.rotateX(Math.PI / 2); // Rotate to stand upright
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Dark grey wheels

    const wheelPositions = [
        new THREE.Vector3(1, 0, 1.5),  // Front Right
        new THREE.Vector3(-1, 0, 1.5), // Front Left
        new THREE.Vector3(1, 0, -1.5), // Back Right
        new THREE.Vector3(-1, 0, -1.5) // Back Left
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos.x, wheelRadius, pos.z); // Position relative to car center
        wheel.castShadow = true;
        carGroup.add(wheel);
    });

    carGroup.position.y = 0; // Place car on the ground initially (wheels touch)
    return carGroup;
}

// --- CITY GENERATION ---
function createCity() {
    const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa }); // Grey buildings
    const cityGridSize = 20; // How many blocks across/deep
    const blockSize = 15; // Size of each block (including spacing)
    const buildingMaxHeight = 25;
    const buildingMinHeight = 5;
    const spacing = 5; // Spacing between buildings

    for (let i = -cityGridSize / 2; i < cityGridSize / 2; i++) {
        for (let j = -cityGridSize / 2; j < cityGridSize / 2; j++) {
            // Avoid placing buildings too close to the center start area
            if (Math.abs(i) < 2 && Math.abs(j) < 2) continue;

            if (Math.random() > 0.3) { // Chance to place a building
                const buildingWidth = Math.random() * (blockSize - spacing * 2) + spacing;
                const buildingDepth = Math.random() * (blockSize - spacing * 2) + spacing;
                const buildingHeight = Math.random() * (buildingMaxHeight - buildingMinHeight) + buildingMinHeight;

                const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
                const building = new THREE.Mesh(buildingGeometry, buildingMaterial);

                const xPos = i * blockSize + (Math.random() - 0.5) * spacing;
                const zPos = j * blockSize + (Math.random() - 0.5) * spacing;
                const yPos = buildingHeight / 2; // Position base at ground level

                building.position.set(xPos, yPos, zPos);
                building.castShadow = true;
                building.receiveShadow = true;
                scene.add(building);
            }
        }
    }
}
createCity();

// --- CAR PHYSICS & CONTROLS ---
const carState = {
    speed: 0,
    steering: 0,
    acceleration: 15.0, // units per second^2
    braking: 30.0,
    maxSpeed: 40.0,
    maxReverseSpeed: -15.0,
    friction: 0.98, // Multiplier per frame (closer to 1 = less friction)
    steeringSpeed: 1.5, // radians per second
    maxSteeringAngle: Math.PI / 6, // Max turn angle (30 degrees)
    steeringReturnSpeed: 2.0 // How fast steering returns to center
};

const inputState = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// Event Listeners
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w': case 'W': case 'ArrowUp':    inputState.forward = true; break;
        case 's': case 'S': case 'ArrowDown':  inputState.backward = true; break;
        case 'a': case 'A': case 'ArrowLeft':  inputState.left = true; break;
        case 'd': case 'D': case 'ArrowRight': inputState.right = true; break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w': case 'W': case 'ArrowUp':    inputState.forward = false; break;
        case 's': case 'S': case 'ArrowDown':  inputState.backward = false; break;
        case 'a': case 'A': case 'ArrowLeft':  inputState.left = false; break;
        case 'd': case 'D': case 'ArrowRight': inputState.right = false; break;
    }
});

function updateCar(deltaTime) {
    // --- Steering ---
    let steerDirection = 0;
    if (inputState.left) steerDirection = 1;
    if (inputState.right) steerDirection = -1;

    // Gradually change steering angle
    if (steerDirection !== 0) {
        carState.steering += steerDirection * carState.steeringSpeed * deltaTime;
        carState.steering = THREE.MathUtils.clamp(carState.steering, -carState.maxSteeringAngle, carState.maxSteeringAngle);
    } else {
        // Return steering to center
        if (Math.abs(carState.steering) > 0.01) {
            carState.steering *= (1 - carState.steeringReturnSpeed * deltaTime);
        } else {
            carState.steering = 0;
        }
    }

    // --- Acceleration / Braking ---
    let acceleration = 0;
    if (inputState.forward) {
        acceleration = carState.acceleration;
    } else if (inputState.backward) {
        // Apply braking force if moving forward, else reverse acceleration
        if (carState.speed > 0.1) {
            acceleration = -carState.braking;
        } else {
            acceleration = -carState.acceleration / 2; // Slower reverse
        }
    }

    // Update speed based on acceleration
    carState.speed += acceleration * deltaTime;

    // Apply friction/drag only when not accelerating significantly
    if (Math.abs(acceleration) < 0.1) {
         carState.speed *= Math.pow(carState.friction, deltaTime * 60); // Frame-rate independent friction
         // Stop completely if speed is very low
         if (Math.abs(carState.speed) < 0.05) {
            carState.speed = 0;
         }
    }


    // Clamp speed
    carState.speed = THREE.MathUtils.clamp(carState.speed, carState.maxReverseSpeed, carState.maxSpeed);

    // --- Apply Movement ---
    const distance = carState.speed * deltaTime;

    // Only allow turning if the car is moving (prevents spinning in place)
    if (Math.abs(distance) > 0.01) {
        const turnAngle = carState.steering * (distance / 4); // Turning circle depends on speed/distance
        car.rotation.y += turnAngle;
    }

    // Calculate forward vector based on car's rotation
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(car.quaternion); // Use quaternion for proper rotation

    // Update car position
    car.position.addScaledVector(forward, distance);

     // --- Wheel Rotation (Visual) ---
     const wheelRotationSpeed = distance / 0.4; // Based on wheel radius
     car.children.forEach(child => {
         if (child.geometry.type === 'CylinderGeometry') { // Check if it's a wheel
             child.rotation.z -= wheelRotationSpeed; // Rotate around local Z axis (since we rotated geometry)

             // // Optional: Steer front wheels visually (approximate)
             // if (child.position.z > 0) { // Front wheels
             //     child.rotation.y = carState.steering * 0.5; // Apply some steering angle visually
             // }
         }
     });
}

function updateCamera() {
    // Calculate the desired camera position based on car's position and rotation + offset
    const desiredPosition = car.position.clone().add(cameraOffset.clone().applyQuaternion(car.quaternion));

    // Smoothly interpolate camera position (lerp)
    camera.position.lerp(desiredPosition, 0.1); // Adjust 0.1 for faster/slower follow

    // Make the camera look at the car's position
    const lookAtPosition = car.position.clone();
    lookAtPosition.y += 1.0; // Look slightly above the car's base
    camera.lookAt(lookAtPosition);
}


// --- RESIZE HANDLING ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta(); // Get time difference between frames

    updateCar(deltaTime);
    updateCamera();

    renderer.render(scene, camera);
}

// Start the simulation
animate();