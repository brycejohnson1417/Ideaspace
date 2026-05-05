import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface KnowledgeGraph {
  topic: string;
  nodes: { id: string; label: string; summary: string; color: string; scale: number }[];
  edges: { source: string; target: string }[];
  audioParams: {
    baseNote: string;
    scaleType: string;
    bpm: number;
    synthType: "sine" | "square" | "triangle" | "sawtooth";
    mood: string;
  };
  visualParams: {
    backgroundColor: string;
    particleSpeed: number;
    particleCount: number;
  };
}

export async function generateKnowledgeGraph(topic: string): Promise<KnowledgeGraph> {
  const prompt = `You are a hyper-intelligent knowledge synthesizer. The user wants to explore the concept of "${topic}".
Generate a fascinating, multi-layered 3D knowledge graph for this topic.

Requirements:
- Create 8 to 15 distinct nodes (sub-topics, concepts, historical figures, or theories related to the topic).
- 'scale' should be between 0.5 (minor detail) and 3.0 (core central concept). At least one node should be the core concept.
- Create edges that logically connect these nodes.
- Generate 'audioParams' to create a generative ambient soundtrack reflecting the mood of the topic (e.g. dark and slow for 'black holes', fast and bright for 'pop culture').
- Generate 'visualParams' representing the overall aesthetic of the space.

Return ONLY valid JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                summary: { type: Type.STRING },
                color: { type: Type.STRING, description: "A valid CSS hex color string" },
                scale: { type: Type.NUMBER }
              },
              required: ["id", "label", "summary", "color", "scale"]
            }
          },
          edges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING }
              },
              required: ["source", "target"]
            }
          },
          audioParams: {
            type: Type.OBJECT,
            properties: {
              baseNote: { type: Type.STRING, description: "e.g., C4, F3, A2" },
              scaleType: { type: Type.STRING, description: "e.g., minor, major, dorian, phrygian, pentatonic" },
              bpm: { type: Type.NUMBER },
              synthType: { type: Type.STRING, enum: ["sine", "square", "triangle", "sawtooth"] },
              mood: { type: Type.STRING }
            },
            required: ["baseNote", "scaleType", "bpm", "synthType", "mood"]
          },
          visualParams: {
            type: Type.OBJECT,
            properties: {
              backgroundColor: { type: Type.STRING, description: "A highly atmospheric, dark CSS hex color." },
              particleSpeed: { type: Type.NUMBER },
              particleCount: { type: Type.NUMBER }
            },
            required: ["backgroundColor", "particleSpeed", "particleCount"]
          }
        },
        required: ["topic", "nodes", "edges", "audioParams", "visualParams"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from Gemini");
  }
  
  return JSON.parse(text) as KnowledgeGraph;
}
