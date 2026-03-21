import { stitch_design } from '/Users/samwise/.openclaw/workspace/skills/stitch/stitch_design.js';
import fs from 'fs';

const prompt = `
Generate a full website content structure for 'Plenum3D', an AI 3D Editor for Three.js. 
Structure:
1. Hero: Headline 'AI 3D Editor for Three.js', Subheadline 'Build complex scenes faster with AI-assisted generation and procedural editing.', CTA 'Launch Editor'.
2. Features Section: 3-4 feature cards with icons and descriptions (e.g., 'Intelligent Layer Management', 'AI-Driven Shape Refinement', 'Real-time Canvas Panning').
3. Benefits Section: Why choose Plenum3D (speed, browser-native, procedural efficiency).
Design Tokens: Minimalist sci-fi aesthetic, dark theme (#0A0A0A), primary violet (#7C3AED).
`;

const design = await stitch_design(prompt);
fs.writeFileSync('/Users/samwise/factory-projects/sculpt3d/src/docs/plenum3d_content_v2.json', JSON.stringify(design, null, 2));
