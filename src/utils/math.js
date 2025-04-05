import * as THREE from 'three';

export const MathUtils = {
  // Linear interpolation
  lerp: (a, b, t) => {
    return a + (b - a) * t;
  },
  
  // Clamp a value between min and max
  clamp: (value, min, max) => {
    return Math.max(min, Math.min(max, value));
  },
  
  // Convert degrees to radians
  degToRad: (degrees) => {
    return degrees * Math.PI / 180;
  },
  
  // Convert radians to degrees
  radToDeg: (radians) => {
    return radians * 180 / Math.PI;
  },
  
  // Get a random float between min and max
  randomFloat: (min, max) => {
    return min + Math.random() * (max - min);
  },
  
  // Get a random integer between min and max (inclusive)
  randomInt: (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  // Get a random point within a sphere
  randomPointInSphere: (radius) => {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * Math.cbrt(Math.random()); // Cube root for uniform distribution
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z);
  },
  
  // Get a random point on a sphere
  randomPointOnSphere: (radius) => {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z);
  },
  
  // Get a random color with optional hue, saturation, and lightness ranges
  randomColor: (hueMin = 0, hueMax = 1, satMin = 0.5, satMax = 1, lightMin = 0.3, lightMax = 0.7) => {
    const hue = MathUtils.randomFloat(hueMin, hueMax);
    const saturation = MathUtils.randomFloat(satMin, satMax);
    const lightness = MathUtils.randomFloat(lightMin, lightMax);
    
    return new THREE.Color().setHSL(hue, saturation, lightness);
  },
  
  // Ease in-out function
  easeInOut: (t) => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },
  
  // Map a value from one range to another
  map: (value, fromMin, fromMax, toMin, toMax) => {
    return toMin + (toMax - toMin) * ((value - fromMin) / (fromMax - fromMin));
  },
  
  // Get the distance between two THREE.Vector3 objects
  distance: (v1, v2) => {
    return v1.distanceTo(v2);
  }
};

// Perlin noise for terrain/water generation (simplified implementation)
export class PerlinNoise {
  constructor(seed = Math.random()) {
    this.seed = seed;
    this.gradients = {};
  }
  
  // This is a simplified perlin noise implementation
  // In a real application, you'd use a more robust implementation
  noise2D(x, y) {
    // Convert coordinates to grid cell coordinates
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    
    // Compute interpolation weights
    const sx = x - x0;
    const sy = y - y0;
    
    // Interpolate between grid point gradients
    let n0, n1, ix0, ix1, value;
    
    n0 = this.dotGridGradient(x0, y0, x, y);
    n1 = this.dotGridGradient(x1, y0, x, y);
    ix0 = this.smoothstep(n0, n1, sx);
    
    n0 = this.dotGridGradient(x0, y1, x, y);
    n1 = this.dotGridGradient(x1, y1, x, y);
    ix1 = this.smoothstep(n0, n1, sx);
    
    value = this.smoothstep(ix0, ix1, sy);
    
    // Return a value between -1 and 1
    return value;
  }
  
  smoothstep(a, b, t) {
    // Hermite cubic interpolation
    const t2 = t * t;
    const t3 = t2 * t;
    return (a * (1 - 3 * t2 + 2 * t3) + b * (3 * t2 - 2 * t3));
  }
  
  dotGridGradient(ix, iy, x, y) {
    // Get gradient from integer coordinates
    const key = `${ix},${iy}`;
    
    if (!this.gradients[key]) {
      // Random gradient
      const angle = this.random(ix, iy) * Math.PI * 2;
      this.gradients[key] = [Math.cos(angle), Math.sin(angle)];
    }
    
    // Distance vector
    const dx = x - ix;
    const dy = y - iy;
    
    // Dot product
    return dx * this.gradients[key][0] + dy * this.gradients[key][1];
  }
  
  random(x, y) {
    // Simple hash function
    const dot = x * 12.9898 + y * 78.233;
    return Math.abs(Math.sin(dot * this.seed) * 43758.5453) % 1;
  }
  
  // Generate terrain heights using multiple octaves of noise
  generateTerrain(width, depth, scale, octaves, persistence, lacunarity) {
    const heights = new Float32Array(width * depth);
    
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        let amplitude = 1;
        let frequency = 1;
        let noiseHeight = 0;
        
        for (let i = 0; i < octaves; i++) {
          const sampleX = x / scale * frequency;
          const sampleZ = z / scale * frequency;
          
          const noiseValue = this.noise2D(sampleX, sampleZ) * 2 - 1;
          noiseHeight += noiseValue * amplitude;
          
          amplitude *= persistence;
          frequency *= lacunarity;
        }
        
        heights[z * width + x] = noiseHeight;
      }
    }
    
    return heights;
  }
}

/**
 * Formats seconds into MM:SS format.
 * @param {number} totalSeconds - The total number of seconds.
 * @returns {string} The formatted time string.
 */
export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/**
 * Linearly interpolates between two values.
 * @param {number} a - The start value.
 * @param {number} b - The end value.
 * @param {number} t - The interpolation factor (0 to 1).
 * @returns {number} The interpolated value.
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
} 