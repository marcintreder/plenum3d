# Implementation Plan

1. **Inspector UI (Task 1)**: Create `AIInspector.jsx` for model properties and AI prompt UI. (Complete)
2. **AI Service Hook (Task 2)**: Create a React hook to connect UI to `aiService.js`. (Complete)
3. **State Sync (Task 3)**: Update `useStore` to handle geometry patching reliably. (Complete)
4. **Verification (Task 4)**: Implement Vitest unit tests for AI Refine logic. (Complete)
5. **AI Object Refinement (Task 5)**: Select object(s), send structure to AI via prompt, and patch resulting geometry onto canvas. (Complete)
6. **Command+A (Select All) (Task 6)**: Implement keyboard shortcut (Cmd+A) to select all objects on the canvas for unified movement and deletion. (Complete)
7. **Marquee Selection Tool (Task 7)**: Implement a new canvas tool that allows users to drag a selection box (marquee) to select multiple objects at once, then perform movement or deletion actions on the entire selection group. (Complete)
8. **Persistent Auth (Task 8)**: Implement silent authentication refresh flow to handle Google OAuth token expiry (1 hour limit) without interrupting the user session or syncing. (Complete)
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI. (Complete)
10. **Multi-object select + bulk operations (Task 10)**: Implement Shift+click multi-selection in canvas, bulk color/material updates in Inspector, and "Delete" key support for all selected objects. (Complete)
11. **Copy/paste objects (Task 11)**: Implement Cmd+C/Cmd+V support for deep-cloning selected objects/groups with position offset.
12. **Project Management UI Polish (Task 12)**: Add project thumbnails using ScreenshotHelper and improve the project sidebar experience.
13. **AI Retry Logic (Task 13)**: Catch AI generation runtime errors and auto-retry once with the error message as feedback.
14. **Playwright E2E Smoke Tests (Task 14)**: Set up the Playwright test directory, fix the package.json scripts, and implement 5 core smoke tests.
