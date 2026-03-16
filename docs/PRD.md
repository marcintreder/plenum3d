# PRD: Sculpt3D AI Refine Feature

## Objective
Enable users to perform iterative modifications on 3D models using AI-driven prompts.

## Features
1. **Model Selection**: Click to select a 3D model on the canvas.
2. **AI Refine UI**: Inspector-integrated prompt field and 'Refine' button.
3. **Geometry Patching**: Connect prompt to `aiService.js`, update canvas state via `useStore`.
4. **History**: Ensure all refinements are undoable.
