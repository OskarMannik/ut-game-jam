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
    
    this.isChatFocused = false; // <<< ADD Flag >>>
    
    // <<< ADD Joystick State >>>
    this.joystickX = 0;
    this.joystickY = 0;
    this.joystickThreshold = 0.35; // Dead zone threshold
  }
  
  init(chatInputElement = null) {
    this.chatInputElement = chatInputElement;
    this.isChatFocused = false; // Ensure flag is reset on init
    this.joystickX = 0; // Ensure joystick is reset on init
    this.joystickY = 0;
    
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
    if (this.isChatFocused) {
      // If chat input is focused, let browser handle typing normally.
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
    if (this.isChatFocused) {
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
    // Start with a copy of the base state (captures key presses and button touches)
    const state = { ...this.inputState }; 

    // <<< Derive movement from Joystick >>>
    // Reset joystick-derived movement flags first
    state.forward = false;
    state.backward = false;
    state.left = false;
    state.right = false;

    if (this.joystickY > this.joystickThreshold) {
        state.forward = true;
    } else if (this.joystickY < -this.joystickThreshold) {
        state.backward = true;
    }
    
    if (this.joystickX < -this.joystickThreshold) {
        state.left = true;
    } else if (this.joystickX > this.joystickThreshold) {
        state.right = true;
    }
    
    // Combine with keyboard state (allow keyboard to override/add)
    // If W is pressed OR joystick is up, forward should be true.
    state.forward = state.forward || this.inputState.forward;
    state.backward = state.backward || this.inputState.backward;
    state.left = state.left || this.inputState.left;
    state.right = state.right || this.inputState.right;
    
    // Keep jump/pause etc. from the base state (keys/buttons)
    state.jump = this.inputState.jump;
    state.pause = this.inputState.pause;
    state.action = this.inputState.action;
    state.interact = this.inputState.interact;
    state.down = this.inputState.down;

    // <<< ADD Raw Joystick values to state >>>
    state.joystickX = this.joystickX;
    state.joystickY = this.joystickY;

    return state; 
  }
  
  clearInputState() {
    // Reset all boolean inputs to false
    Object.keys(this.inputState).forEach(key => {
      this.inputState[key] = false;
    });
    // <<< Reset joystick state >>>
    this.joystickX = 0;
    this.joystickY = 0;
    // Also clear active button touches
    this.activeTouches = {};
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
  
  // <<< ADD Method to set focus state >>>
  setChatFocus(isFocused) {
    this.isChatFocused = isFocused;
    // console.log("Chat Focus set to:", this.isChatFocused); // Debug log
    if (isFocused) {
      // Optional: Clear any active game input state when chat gets focus
      // this.clearInputState(); 
    }
  }
  
  // <<< ADD Method to update Joystick state >>>
  updateJoystick(x, y) {
      // Clamp values between -1 and 1 just in case
      this.joystickX = Math.max(-1, Math.min(1, x));
      this.joystickY = Math.max(-1, Math.min(1, y));
  }
} 