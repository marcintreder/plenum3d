# Critical User Journeys (CUJs)

## CUJ 1: The Privacy-First Onboarding
**User Goal:** Start using the tool without creating an account or trusting a server with my keys.
1. User lands on the site.
2. User is prompted to enter an API key (OpenAI, Anthropic, or Ollama).
3. User selects "Ollama" for local execution.
4. User confirms the key/endpoint.
5. **Success:** The UI shows "Connected" and the key icon turns green. Nothing is sent to our servers.

## CUJ 2: Prompt-to-Component Generation
**User Goal:** Quickly generate a base model to start working with.
1. User types "An F1 car with a large rear wing and aerodynamic sidepods" into the prompt bar.
2. User hits Enter.
3. The AI streams R3F code; the 3D scene builds the car piece-by-piece in real-time.
4. **Success:** A stylized, editable F1 car appears in the center of the grid.

## CUJ 3: Deep Selection & Modification
**User Goal:** Modify a specific part of a complex generated model.
1. User clicks on the "Front Wing" of the generated F1 car.
2. The wing is highlighted, and the right-hand panel shows "Part: Front Wing".
3. User drags the "Width" slider or uses the Transform Gizmo to extend the wing.
4. **Success:** Only the selected wing part is modified; the rest of the car remains intact.

## CUJ 4: Vector Joint Manipulation
**User Goal:** Create a mechanical relationship between two parts.
1. User selects the "Wheel" and the "Suspension Arm".
2. User clicks the "Joint" tool.
3. User clicks an edge on the arm to define the pivot point.
4. User moves the arm; the wheel follows according to the joint constraint.
5. **Success:** A "Hinge" joint is established, visible in the scene tree.

## CUJ 5: Exporting for Production
**User Goal:** Take the design into a real-world application.
1. User clicks the "Export" button in the top right.
2. User selects "React Component (.jsx)".
3. The browser downloads a file containing the clean, modular R3F code.
4. User also selects "GLB" for use in a 3D viewer.
5. **Success:** User has both the source code for development and the asset for rendering.
