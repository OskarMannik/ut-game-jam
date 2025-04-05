export class StorageManager {
  constructor(prefix = 'deep_dive_') {
    this.prefix = prefix;
    this.isAvailable = this.checkStorageAvailability();
  }
  
  /**
   * Check if localStorage is available
   * @returns {boolean} Whether localStorage is available
   */
  checkStorageAvailability() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('localStorage is not available, game progress will not be saved');
      return false;
    }
  }
  
  /**
   * Save data to localStorage
   * @param {string} key - Key to save under
   * @param {any} data - Data to save
   * @returns {boolean} Whether save was successful
   */
  save(key, data) {
    if (!this.isAvailable) return false;
    
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.prefix + key, serialized);
      return true;
    } catch (e) {
      console.error('Error saving data:', e);
      return false;
    }
  }
  
  /**
   * Load data from localStorage
   * @param {string} key - Key to load
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} The loaded data or defaultValue
   */
  load(key, defaultValue = null) {
    if (!this.isAvailable) return defaultValue;
    
    try {
      const serialized = localStorage.getItem(this.prefix + key);
      if (serialized === null) return defaultValue;
      return JSON.parse(serialized);
    } catch (e) {
      console.error('Error loading data:', e);
      return defaultValue;
    }
  }
  
  /**
   * Delete data from localStorage
   * @param {string} key - Key to delete
   * @returns {boolean} Whether delete was successful
   */
  delete(key) {
    if (!this.isAvailable) return false;
    
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (e) {
      console.error('Error deleting data:', e);
      return false;
    }
  }
  
  /**
   * Clear all game data from localStorage
   * @returns {boolean} Whether clear was successful
   */
  clearAll() {
    if (!this.isAvailable) return false;
    
    try {
      // Only clear items with our prefix
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (e) {
      console.error('Error clearing data:', e);
      return false;
    }
  }
  
  /**
   * Save the player's progress
   * @param {Object} gameState - Current game state
   * @returns {boolean} Whether save was successful
   */
  saveProgress(gameState) {
    return this.save('player_progress', {
      level: gameState.currentLevel,
      oxygen: gameState.oxygen,
      artifacts: gameState.artifacts,
      memories: gameState.memories,
      depth: gameState.depth,
      timestamp: Date.now()
    });
  }
  
  /**
   * Load the player's progress
   * @returns {Object|null} The player's progress or null if not found
   */
  loadProgress() {
    return this.load('player_progress', null);
  }
  
  /**
   * Save player settings
   * @param {Object} settings - Player settings
   * @returns {boolean} Whether save was successful
   */
  saveSettings(settings) {
    return this.save('settings', settings);
  }
  
  /**
   * Load player settings
   * @returns {Object} The player's settings
   */
  loadSettings() {
    return this.load('settings', {
      soundVolume: 0.8,
      musicVolume: 0.5,
      invertControls: false,
      showTutorials: true
    });
  }
  
  /**
   * Save collected memory IDs
   * @param {Array<string>} memoryIds - Array of collected memory IDs
   * @returns {boolean} Whether save was successful
   */
  saveCollectedMemories(memoryIds) {
    return this.save('collected_memories', memoryIds);
  }
  
  /**
   * Load collected memory IDs
   * @returns {Array<string>} Array of collected memory IDs
   */
  loadCollectedMemories() {
    return this.load('collected_memories', []);
  }
  
  /**
   * Save collected artifact IDs
   * @param {Array<string>} artifactIds - Array of collected artifact IDs
   * @returns {boolean} Whether save was successful
   */
  saveCollectedArtifacts(artifactIds) {
    return this.save('collected_artifacts', artifactIds);
  }
  
  /**
   * Load collected artifact IDs
   * @returns {Array<string>} Array of collected artifact IDs
   */
  loadCollectedArtifacts() {
    return this.load('collected_artifacts', []);
  }
}

// Create a global instance for convenience
export const Storage = new StorageManager(); 