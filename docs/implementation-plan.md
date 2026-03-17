# Implementation Plan - Task P3 (Remaining): Project Management UI

## Goal
Finish the project management UI by adding "New Project" and "Inline Rename" functionality.

## Requirements
- [x] Add "+ New project" button in `App.jsx` sidebar (within the Projects section).
- [x] Implement `addProject` logic: create a new project object with default name/scene, add to `projects` list, and switch to it.
- [x] Update `ProjectThumbnails.jsx` to show an input field when `renamingProjectId === proj.id`.
- [x] Ensure `onRename` in `App.jsx` correctly updates the project name in the state and persists it.

## Definition of Done
- Can create a new project.
- Can rename any project by double-clicking it.
- `npm run build` passes.
