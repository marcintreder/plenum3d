# UX Spec: 3D Figma

## 1. Design Philosophy
The interface should feel like a high-end engineering tool but with the approachability of a modern web app. We call this vibe **"Technical Minimalism."** It’s dark, high-contrast, and focuses on the 3D content.

## 2. Color Palette
| Role | Color Hex | Sample |
| :--- | :--- | :--- |
| **Workspace BG** | `#0F0F0F` | Deep Black |
| **Panel Surface** | `#1A1A1A` | Dark Grey |
| **Accent (Primary)** | `#7C3AED` | Electric Violet |
| **Accent (Selection)** | `#06B6D4` | Cyan |
| **Success/Connected**| `#10B981` | Emerald |
| **Text (Primary)** | `#F8FAFC` | Off-White |
| **Text (Secondary)**| `#94A3B8` | Muted Blue/Grey |

## 3. Typography
- **UI Text:** `Inter` - Clean, highly legible at small sizes.
- **Data/Code:** `JetBrains Mono` or `Fira Code` - Used for the prompt bar and any visible R3F code exports.

## 4. UI Components & Layout
- **The "Infinite Grid":** The 3D canvas uses a subtle, dark grid with a slight fog effect at the horizon to give a sense of scale.
- **Floating Prompt Bar:** Located at the top-center, semi-transparent backdrop with a glowing border when active.
- **Glassmorphism Panels:** Sidebars use a slight background blur (`backdrop-filter: blur(8px)`) to feel layered over the 3D scene.
- **Transform Gizmos:** Custom-designed X (Red), Y (Green), Z (Blue) handles that are thinner and more modern than default Three.js gizmos.

## 5. Visual "Vibe" Markers
- **F1 Car Example:** The default "demo" should be a high-fidelity F1 car with metallic materials, carbon fiber textures, and visible suspension joints to showcase precision.
- **Motion:** 
  - Panels slide in/out with `ease-out-expo`.
  - The AI-generated code renders parts with a "wireframe-to-solid" transition effect.
  - Hovering over a part in the Scene Tree highlights the 3D object with a pulsing cyan outline.

## 6. Iconography
- **Style:** Thin-line icons (e.g., Lucide-react or Phosphor Icons).
- **Specifics:** Use "Node" and "Link" icons for joint management to lean into the "Vector" design language.
