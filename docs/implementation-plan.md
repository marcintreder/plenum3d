# Implementation Plan - Task 12: UI Polish (Thumbnails + Sidebar)

- [x] Added `ScreenshotHelper` callback ref in `App.jsx`.
- [x] Updated `Inspector.jsx` to receive `onScreenshot` and include the trigger button.
- [x] Need to implement the sidebar thumbnail display.

## Sidebar Improvement
- Add a new component `ProjectThumbnails` that renders the list of projects with a thumbnail image.
- We need to capture the canvas state, save it, and associate it with a project.
- For now, will add a placeholder in the sidebar.
