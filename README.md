# Deep Dive

An exploration game about descending into the depths, created for a game jam with the theme "Depths".

## Description

In Deep Dive, players take on the role of a mysterious explorer venturing through increasingly deeper layers of reality - physical, emotional, and metaphysical. As players descend further, they collect artifacts that grant special abilities and uncover memory fragments that reveal the story.

The game features:
- Exploration across 5 distinct depth layers (Surface, Underwater, Caves, Ruins, Subconscious, and Cosmic Void)
- Oxygen management system that becomes more challenging at deeper levels
- Collection of artifacts that grant special abilities
- Memory fragments that reveal the backstory
- Different movement physics between land and underwater sections
- Atmospheric environments with unique visuals and audio

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or higher)
- A modern web browser

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/deep-dive.git
cd deep-dive
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Controls

- **W/↑**: Move Forward
- **S/↓**: Move Backward
- **A/←**: Turn Left
- **D/→**: Turn Right
- **Space**: Jump (on land) / Swim Up (underwater)
- **E**: Interact with objects
- **F**: Use artifact ability (when available)

## Game Structure

The game is built using a modular architecture:

```
/src
  /core         - Core game systems
  /entities     - Game entities (player, collectibles, etc.)
  /world        - Level and environment systems
  /ui           - User interface components
  /utils        - Utility functions and helpers
```

## Technology

- Built with [Three.js](https://threejs.org/) for 3D rendering
- Uses [Vite](https://vitejs.dev/) for fast development and building
- Pure JavaScript with ES modules for code organization

## Credits

- Game concept and development: [Your Name]
- Theme: Depths (Game Jam Theme)

## License

This project is licensed under the MIT License - see the LICENSE file for details.