# Ideaspace

Ideaspace is a generative 3D knowledge explorer. It tests whether abstract concepts can be expanded into an explorable spatial map with visual, structural, and ambient feedback.

View the AI Studio prototype: https://ai.studio/apps/32462237-deee-4600-abca-168aa79ce859

## What It Explores

- Turning prompts and abstract ideas into interactive concept maps.
- 3D navigation as an alternative to flat text output.
- Visual and audio feedback for exploration state.
- Structured generation with enough affordance for a user to keep thinking.

## Technical Notes

- React and Vite frontend.
- Three.js through React Three Fiber and drei.
- Gemini API integration through `@google/genai`.
- Zustand, immer, lodash, p-limit, Tailwind, and Tone for state, generation flow, styling, and sound.

## Current Status

This is a prototype source repo. The core idea is promising, but production use would require clearer navigation, saved maps, performance budgets, generation retry controls, and stronger grounding for generated relationships.

## Run Locally

Prerequisite: Node.js.

1. Install dependencies:
   `npm install`
2. Create `.env.local` and add your own Gemini API key.
3. Run the app:
   `npm run dev`

## API Key Boundary

Do not deploy this Vite app with a private Gemini key embedded into browser JavaScript. If deploying outside AI Studio, use a server-side API route or an explicit visitor-provided key flow.

## AI-Assisted Build Note

This prototype was built with AI assistance. The engineering value is in shaping a fuzzy idea into a navigable product surface, then identifying where interaction, performance, and factual grounding need more work.

## Related Public Notes

See the combined prototype overview repo: https://github.com/brycejohnson1417/ai-studio-prototype-overviews
