# Isometric Grid Explorer

## Overview

The Isometric Grid Explorer is a minimal browser-based application that displays an infinite isometric grid with draggable navigation and a center marker. It provides the core functionality for exploring a 2D isometric space.

## Architecture

### File Structure
```
/
├── index.html          # Main HTML page with canvas and UI
├── grid.js             # Isometric grid system implementation
└── styles.css          # Basic styling for UI elements
```

### Core Components

#### Grid System (`grid.js`)
- Implements isometric projection using diamond-shaped tiles
- Handles canvas rendering with HTML5 Canvas API  
- Manages panning/dragging of the view
- Draws center marker at the middle of the grid
- Provides return-to-center functionality
- Automatically fills screen with grid tiles

#### Main Logic (`main.js`)
- Minimal implementation that relies on grid.js for all functionality

#### UI/Styles (`index.html` + `styles.css`) 
- Header with title
- Canvas element for grid display
- Return to center button
- Basic responsive styling

## Technical Details

### Isometric Projection
- Uses diamond-shaped tiles (60px wide, 30px tall)
- Implements standard isometric projection mathematics
- Calculates tile positions based on 2D coordinates

### Interaction Model
1. **Navigation**: Click and drag to pan around the grid
2. **Centering**: Click "Return to Center" button to re-center view
3. **Visual Feedback**: Red center marker at grid's middle point

### Performance Considerations
- Grid tiles are dynamically calculated based on viewport
- Only visible tiles are rendered
- Efficient canvas rendering with proper clearing between frames