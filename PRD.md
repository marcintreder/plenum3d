# PRD: 3D Figma

## 1. Product Vision
To create the most intuitive, web-native 3D design tool that combines the collaborative ease of Figma with the power of procedural and AI-driven 3D modeling. It’s "Vector Editing for the 3rd Dimension."

## 2. Problem Statement
Professional 3D tools (Blender, Maya) have steep learning curves. Modern web-based tools often lack the precision for detailed part-based modeling or the ability to generate complex structures via natural language.

## 3. Key Requirements & Features

### 3.1 AI-Powered Generation (Prompt-to-3D)
- **Code-First Generation:** The AI doesn't just output a mesh; it outputs React Three Fiber (R3F) code. This allows for parametric and editable results rather than "baked" meshes.
- **Iterative Refinement:** Users can prompt changes to specific parts of the generated model.

### 3.2 BYOK (Bring Your Own Key) Infrastructure
- **Provider Support:** OpenAI, Anthropic, Google (Gemini), and Local Ollama (running on `localhost:11434`).
- **Privacy:** All API keys are stored exclusively in the browser's `localStorage`. No server-side storage of user keys.

### 3.3 Precision Editing & Selection
- **Sub-object Selection:** Ability to select individual surfaces, faces, and parts of a complex model (e.g., selecting just the spoiler of an F1 car).
- **Vector-like Manipulation:** Editing joints and edges with the same familiarity as Pen tools in 2D vector software.

### 3.4 Export Capabilities
- **Standard Formats:** GLB, OBJ.
- **Developer-Ready:** Export as React Three Fiber (JS/JSX) code for direct integration into web projects.

### 3.5 High Fidelity Support
- Capability to handle detailed models with hierarchical structures (e.g., suspension systems, spoilers, interior components).

## 4. Technical Constraints
- **Runtime:** Browser-based (React + Three.js).
- **Performance:** Must maintain 60FPS during manipulation of moderately complex scenes.
- **Connectivity:** Must support offline-first local AI via Ollama.

## 5. Success Metrics
- Time to first generated 3D object < 10 seconds.
- Successful export rate (valid GLB/OBJ).
- Positive user feedback on "Joint/Edge" editing UX compared to traditional CAD.
