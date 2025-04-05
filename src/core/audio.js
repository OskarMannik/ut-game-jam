export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {}; // Stores loaded AudioBuffers
    this.music = {}; // Keep for future music implementation
    this.currentMusic = null;
    
    this.masterGain = null;
    this.soundGain = null;
    this.musicGain = null; // Keep for future music
    this.activeLoops = {}; // To store references to looping sounds { id: sourceNode }

    this.masterVolume = 1.0;
    this.soundVolume = 0.8;
    this.musicVolume = 0.5; // Keep for future music
    this.muted = false;
    this.prePauseMasterVolume = 1.0; // <<< ADD: Store volume before pausing

    // Sound definitions
    this.soundFiles = {
      'player_step': '/sounds/step.mp3',
      'player_jump': '/sounds/jump.mp3',
      'artifact_collect': '/sounds/artifact.mp3',
      'memory_collect': '/sounds/memory.mp3',
      'game_over': '/sounds/game_over.mp3',
    };

    // Music definitions (placeholder)
    this.musicFiles = {
      'surface': '/music/surface.mp3',
      'underwater': '/music/underwater.mp3'
    };
  }
  
  async init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create Gain Nodes
      this.masterGain = this.audioContext.createGain();
      this.soundGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain(); // For future use

      // Connect nodes: Sound/Music -> Master -> Destination
      this.soundGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      // Set initial volumes
      this.updateVolumes();

      // Load all sounds
      const soundPromises = Object.entries(this.soundFiles).map(([id, path]) => 
        this.loadSound(id, path)
      );
      
      await Promise.all(soundPromises);
      console.log('Audio manager initialized and sounds loaded');
      
      // TODO: Load music later
      // console.log('Audio manager would load music files:', Object.keys(this.musicFiles));
      // <<< ADD: Load music files
      const musicPromises = Object.entries(this.musicFiles).map(([id, path]) => 
        this.loadMusic(id, path)
      );
      await Promise.all(musicPromises);
      console.log('Music files loaded');

    } catch (error) {
      console.error("Error initializing Web Audio API:", error);
      // Fallback or disable audio
      this.audioContext = null; 
    }
  }

  async loadSound(id, path) {
    if (!this.audioContext) return; // Don't load if context failed

    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${path}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds[id] = audioBuffer;
      console.log(`Loaded sound: ${id}`);
    } catch (error) {
      console.error(`Error loading sound ${id} from ${path}:`, error);
      this.sounds[id] = null; // Mark as failed to load
    }
  }

  // <<< ADD: loadMusic method
  async loadMusic(id, path) {
    if (!this.audioContext) return;

    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${path}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      // Decode as music (potential differences in decoding options later)
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.music[id] = audioBuffer;
      console.log(`Loaded music: ${id}`);
    } catch (error) {
      console.error(`Error loading music ${id} from ${path}:`, error);
      this.music[id] = null; // Mark as failed to load
    }
  }

  play(soundId, options = {}) {
    const { loop = false, volume = 1.0 } = options;

    if (!this.audioContext || !this.sounds[soundId]) {
      // Log if sound not loaded or context missing
      if (!this.sounds[soundId] && soundId !== 'ambient_bubbles') { 
         console.warn(`Sound not loaded or audio context unavailable: ${soundId}`);
      }
      return;
    }

    // Stop existing loop if trying to play the same looping sound again
    if (loop && this.activeLoops[soundId]) {
        this.stopLoop(soundId);
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[soundId];
    source.loop = loop;
    
    // Apply specific sound volume (relative to category gain)
    const individualGain = this.audioContext.createGain();
    individualGain.gain.value = volume;
    
    // Connect through gain nodes: Source -> Individual Gain -> Sound Category Gain -> ...
    source.connect(individualGain);
    individualGain.connect(this.soundGain);
    
    source.start(0);

    // Store reference if it's a loop
    if (loop) {
        this.activeLoops[soundId] = source;
    }
  }

  stopLoop(soundId) {
    if (this.activeLoops[soundId]) {
      try {
        this.activeLoops[soundId].stop();
      } catch (e) {
        // Ignore errors if stopping already stopped source
      }
      delete this.activeLoops[soundId];
      console.log(`Stopped loop: ${soundId}`);
    }
  }

  // Stop all active loops (e.g., on level transition)
  stopAllLoops() {
    Object.keys(this.activeLoops).forEach(soundId => {
        this.stopLoop(soundId);
    });
  }

  // Methods to control volume (can be called from UI/settings later)
  setMasterVolume(value) {
    this.masterVolume = value;
    // Store this value as the target volume if not currently paused
    if (!window.game || !window.game.isUserPaused) { 
      this.prePauseMasterVolume = value; 
    }
    this.updateVolumes();
  }

  setSoundVolume(value) {
    this.soundVolume = value;
    this.updateVolumes();
  }

  setMusicVolume(value) {
    this.musicVolume = value;
    this.updateVolumes();
  }

  updateVolumes() {
    if (!this.audioContext) return;
    const effectiveMaster = this.muted ? 0 : this.masterVolume;
    this.masterGain.gain.setValueAtTime(effectiveMaster, this.audioContext.currentTime);
    this.soundGain.gain.setValueAtTime(this.soundVolume, this.audioContext.currentTime);
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
  }

  toggleMute() {
    this.muted = !this.muted;
    this.updateVolumes();
  }

  // Methods for pause handling
  pauseAudio() {
    if (this.audioContext && this.masterGain) {
      this.prePauseMasterVolume = this.masterVolume; // Store current volume
      // Set gain to 0 immediately
      this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      // // Smoothly ramp down to a lower volume (e.g., 30%)
      // this.masterGain.gain.linearRampToValueAtTime(
      //   this.prePauseMasterVolume * 0.3, 
      //   this.audioContext.currentTime + 0.2 // Ramp over 0.2 seconds
      // );
      // Consider suspending the context if completely silent needed
      // this.audioContext.suspend(); 
    }
  }

  resumeAudio() {
    if (this.audioContext && this.masterGain) {
      // Restore the volume before pausing immediately
      this.masterGain.gain.setValueAtTime(this.prePauseMasterVolume, this.audioContext.currentTime);
      // // Restore the volume before pausing
      // this.masterGain.gain.linearRampToValueAtTime(
      //   this.prePauseMasterVolume, 
      //   this.audioContext.currentTime + 0.2 // Ramp back up
      // );
      // Resume context if suspended
      // if (this.audioContext.state === 'suspended') {
      //   this.audioContext.resume();
      // }
    }
  }

  // TODO: Implement music playback methods (playMusic, stopMusic, crossfade, etc.)
  playMusic(trackId, options = {}) {
     const { volume = 1.0 } = options;

     if (!this.audioContext || !this.music[trackId]) {
         console.warn(`Music not loaded or audio context unavailable: ${trackId}`);
         return;
     }
     
     // Stop currently playing music first
     this.stopMusic(); 
     
     const source = this.audioContext.createBufferSource();
     source.buffer = this.music[trackId];
     source.loop = true;
     
     // Connect to the music gain node
     const individualGain = this.audioContext.createGain();
     individualGain.gain.value = volume;
     
     source.connect(individualGain);
     individualGain.connect(this.musicGain);
     
     source.start(0);
     this.currentMusic = {
         source: source,
         trackId: trackId
     }; // Store reference
     console.log(`Playing music: ${trackId}`);
  }

  stopMusic() {
    if (this.currentMusic && this.currentMusic.source) {
        try {
            this.currentMusic.source.stop();
        } catch (e) {
            // Ignore error if already stopped
        }
        console.log(`Stopped music: ${this.currentMusic.trackId}`);
        this.currentMusic = null;
    }
  }

  // Method to play ambient sounds based on environment - MODIFY TO USE PLAY
  playAmbientSounds(environmentType) {
    this.stopAllLoops(); // Stop previous ambient sounds
    console.log("Ambient sounds not implemented for descent.");
  }
} 