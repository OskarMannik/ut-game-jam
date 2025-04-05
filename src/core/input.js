export class InputManager {
  constructor() {
    this.inputState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      action: false,
      interact: false
    };
    
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
      'e': 'interact',
      'f': 'action'
    };
    
    // Bind event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }
  
  init() {
    // Register event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    console.log('Input manager initialized');
  }
  
  handleKeyDown(event) {
    const key = event.key;
    
    // Check if the key is mapped
    if (this.keyMappings[key] !== undefined) {
      this.inputState[this.keyMappings[key]] = true;
      event.preventDefault(); // Prevent default browser actions
    }
  }
  
  handleKeyUp(event) {
    const key = event.key;
    
    // Check if the key is mapped
    if (this.keyMappings[key] !== undefined) {
      this.inputState[this.keyMappings[key]] = false;
      event.preventDefault(); // Prevent default browser actions
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
} 