export class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Function to call when event is emitted
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(callback);
    
    // Return a function to unsubscribe
    return () => {
      this.off(event, callback);
    };
  }
  
  /**
   * Subscribe to an event once
   * @param {string} event - Event name
   * @param {Function} callback - Function to call when event is emitted
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    const unsubscribe = this.on(event, (...args) => {
      unsubscribe();
      callback(...args);
    });
    
    return unsubscribe;
  }
  
  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Function to remove
   */
  off(event, callback) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    
    // Clean up empty event arrays
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }
  
  /**
   * Emit an event with data
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to callbacks
   */
  emit(event, ...args) {
    if (!this.events[event]) return;
    
    for (const callback of this.events[event]) {
      callback(...args);
    }
  }
  
  /**
   * Remove all event listeners
   * @param {string} [event] - Optional event name, if omitted all events are cleared
   */
  clear(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
  
  /**
   * Get the number of listeners for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this.events[event]?.length || 0;
  }
}

// Global event bus for game-wide communication
export const GameEvents = new EventEmitter();

// Event types constants
export const EVENT_TYPES = {
  // Player events
  PLAYER_MOVE: 'player:move',
  PLAYER_JUMP: 'player:jump',
  PLAYER_DAMAGE: 'player:damage',
  PLAYER_ABILITY_USE: 'player:ability_use',
  
  // Game state events
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_OVER: 'game:over',
  
  // Level events
  LEVEL_LOAD: 'level:load',
  LEVEL_COMPLETE: 'level:complete',
  LEVEL_TRANSITION: 'level:transition',
  
  // Collection events
  ARTIFACT_COLLECTED: 'collect:artifact',
  MEMORY_COLLECTED: 'collect:memory',
  
  // Environment events
  ENVIRONMENT_CHANGE: 'environment:change',
  ENTER_WATER: 'environment:enter_water',
  EXIT_WATER: 'environment:exit_water',
  
  // UI events
  UI_SHOW_MESSAGE: 'ui:show_message',
  UI_HIDE_MESSAGE: 'ui:hide_message',
  UI_SHOW_MEMORY: 'ui:show_memory',
  UI_OXYGEN_WARNING: 'ui:oxygen_warning',
  
  // Audio events
  AUDIO_PLAY_SOUND: 'audio:play_sound',
  AUDIO_PLAY_MUSIC: 'audio:play_music',
  AUDIO_STOP_MUSIC: 'audio:stop_music'
}; 