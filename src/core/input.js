export class InputManager {
  constructor() {
    this.keys = {};
    this.inputState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      down: false,
      action: false,
      interact: false,
      pause: false
    };
    
    // Track active touches on buttons
    this.activeTouches = {}; // Store touch identifiers mapped to action names
    
    // Reference to chat input
    this.chatInputElement = null;
    
    // Key mappings (can be customized later)
    this.keyMappings = {
      'w': 'forward',
      'ArrowUp': 'forward',
      's': 'backward',
      'ArrowDown': 'backward',
      'a': 'left',
      'ArrowLeft': 'left',
      'd': 'right',
      'ArrowRight': 'right',
      ' ': 'jump',
      'z': 'down',
      'e': 'interact',
      'f': 'action',
      'p': 'pause'
    };
    
    // Bind event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }
  
  init(chatInputElement = null) {
    this.chatInputElement = chatInputElement;
    
    // Register event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Touch event listeners
    const touchTarget = document.body; // Listen on body to catch events bubbled from buttons
    touchTarget.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    touchTarget.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    touchTarget.addEventListener('touchcancel', this.onTouchEnd.bind(this), { passive: false }); // Treat cancel like end
  }
  
  handleKeyDown(event) {
    if (this.chatInputElement && document.activeElement === this.chatInputElement) {
      // If chat input is focused, let browser handle typing normally.
      // Only potentially intercept 'Enter' if needed elsewhere, but chat UI handles it.
      return; // Don't process game keys
    }
    
    const key = event.key;
    
    // Check if the key is mapped
    if (this.keyMappings[key] !== undefined) {
      this.inputState[this.keyMappings[key]] = true;
      event.preventDefault(); // Prevent default ONLY when using key for game action
    }
  }
  
  handleKeyUp(event) {
    if (this.chatInputElement && document.activeElement === this.chatInputElement) {
      // If chat input is focused, let browser handle typing normally.
      return; // Don't process game keys
    }
    
    const key = event.key;
    
    // Check if the key is mapped
    if (this.keyMappings[key] !== undefined) {
      this.inputState[this.keyMappings[key]] = false;
      event.preventDefault(); // Prevent default ONLY when using key for game action
    }
  }
  
  getInputState() {
    return { ...this.inputState }; // Return a copy of the input state
  }
  
  clearInputState() {
    // Reset all inputs to false
    Object.keys(this.inputState).forEach(key => {
      this.inputState[key] = false;
    });
  }
  
  // Method to add touch/mobile controls in the future
  setupMobileControls() {
    // TODO: Implement touch controls for mobile devices
  }
  
  // Method to clean up event listeners
  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
  
  // Touch Start Handler
  onTouchStart(event) {
    const changedTouches = event.changedTouches;
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i];
      const targetElement = touch.target;

      // Check if the touch started on one of our buttons
      if (targetElement.classList.contains('touch-button')) {
        event.preventDefault(); // Prevent default ONLY for touch buttons
        const action = targetElement.dataset.action;
        if (action && !this.activeTouches[touch.identifier]) {
           this.inputState[action] = true;
           this.activeTouches[touch.identifier] = action; // Track this touch
        }
      }
    }
    // Update state immediately (useful for single-press actions like pause/interact)
    this.updateInputState(); 
  }
  
  // Touch End/Cancel Handler
  onTouchEnd(event) {
    const changedTouches = event.changedTouches;
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i];
      const action = this.activeTouches[touch.identifier];

      if (action) {
        event.preventDefault(); // Prevent default ONLY if ending a button touch
        this.inputState[action] = false;
        delete this.activeTouches[touch.identifier]; // Stop tracking this touch
      }
    }
    this.updateInputState();
  }
  
  updateInputState() {
    // Implement the logic to update the input state based on touch events
  }
} 