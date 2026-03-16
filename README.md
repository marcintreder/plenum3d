# Plenum3D

AI-powered 3D modeling in the browser. Describe what you want, Claude builds it in Three.js geometry.

**Live:** [plenum3d.vercel.app](https://plenum3d.vercel.app)

---

## Features

- **AI model generation** — Describe anything in natural language, the AI writes Three.js code and renders it as a 3D mesh. Supports Anthropic, OpenAI, Gemini, and local Ollama models.
- **Agent mode** — Natural language commands to modify your scene: "make the wheels 30% bigger", "paint the body red", "group the engine parts".
- **Primitive sculpting** — Add cubes, spheres, cylinders, cones, toruses, planes, pyramids, capsules. Drag vertices to sculpt.
- **Multi-scene projects** — Multiple scene tabs per project. Projects saved to your account.
- **GLB export** — Export your model for use in Blender, Unity, Unreal, or any 3D pipeline.
- **R3F code export** — View and copy the React Three Fiber JSX for any scene.
- **BYOK** — Bring your own API keys for Anthropic, OpenAI, or Gemini. Keys stored in your browser only.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 6, Tailwind CSS v4 |
| 3D | Three.js r183, React Three Fiber v9.5, @react-three/drei v10.7 |
| State | Zustand v5 |
| Auth | Google OAuth (`@react-oauth/google`, access token flow) |
| Backend | Vercel serverless functions |
| Database | Neon PostgreSQL (`@neondatabase/serverless`) |
| Deploy | Vercel |

---

## Local Development

```bash
npm install
```

Create `.env.local`:
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
DATABASE_URL=your_neon_connection_string
```

```bash
npm run dev
```

The app runs at `http://localhost:5173`. Backend API routes (`/api/*`) are served by Vite's proxy in development or Vercel in production.

---

## Deployment

```bash
vercel deploy --prod
```

Set these environment variables in the Vercel dashboard:
- `VITE_GOOGLE_CLIENT_ID`
- `DATABASE_URL` (Neon connection string)

---

## AI Generation Notes

The AI generation uses a **single-pass approach**: the model writes raw JavaScript code using the Three.js API, which is executed directly in the browser. This produces higher-quality geometry than JSON-based approaches because the model can use `LatheGeometry`, `ExtrudeGeometry`, `TubeGeometry`, etc.

Models are connected by requiring the code to define dimensions as variables and derive all positions mathematically — no magic numbers.

---

## Feedback & Issues

[github.com/marcintreder/plenum3d/issues](https://github.com/marcintreder/plenum3d/issues)
