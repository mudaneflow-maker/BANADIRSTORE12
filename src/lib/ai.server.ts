import { GoogleGenAI } from "@google/genai";

export async function generateProductDescription(input: {
  name: string;
  details?: string;
  category?: string;
  brand?: string;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is not configured.");

  const ai = new GoogleGenAI({ apiKey });

  const facts = [
    `Magaca alaabta: ${input.name}`,
    input.category ? `Category: ${input.category}` : "",
    input.brand && input.brand !== "General" ? `Brand: ${input.brand}` : "",
    input.details ? `Faahfaahin kale: ${input.details}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: facts,
    config: {
      systemInstruction:
        "Waxaad tahay qoraa sharaxaad alaab oo u qoran dukaan e-commerce Soomaali ah. " +
        "Qor sharaxaad kooban, iibin leh, oo Soomaali saafi ah — 2 ilaa 4 weerood oo keliya. " +
        "Ha isticmaalin markdown, liis, ama cinwaan. Kaliya qoraal cad oo diyaar u ah in si toos ah loogu dhaco field-ka description. " +
        "Ha been sheegin tirooyin ama astaamaha aan la siin.",
      temperature: 0.7,
    },
  });

  const text = (response.text || "").trim();
  if (!text) throw new Error("AI-ma soo saarin sharaxaad — isku day mar kale.");
  return text;
}
