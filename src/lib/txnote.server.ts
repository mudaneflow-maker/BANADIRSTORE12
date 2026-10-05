import { GoogleGenAI } from "@google/genai";

export type TxAnalysis = {
  category: string;
  kind: "income" | "expense" | "sale" | "transfer" | "other";
  amount: number | null;
  targetEffect: "helps" | "hurts" | "neutral";
  impact: string;
};

export async function analyzeTxNote(note: string, ctx: string): Promise<TxAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is not configured.");

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: `Context:\n${ctx}\n\nTransaction note:\n${note}`,
    config: {
      systemInstruction:
        "You classify a single business transaction note for a Somali retail shop and explain its effect on the monthly NET PROFIT target. " +
        "Rules: the target is measured against NET PROFIT: sale profit and other income help; expenses hurt; transfers are neutral. " +
        "Use only the numbers given; never invent figures. Reply ONLY with a JSON object with keys: " +
        'category (short Somali/English label), kind ("income"|"expense"|"sale"|"transfer"|"other"), amount (number or null), ' +
        'targetEffect ("helps"|"hurts"|"neutral"), impact (2-3 short sentences in Somali explaining the effect on today\'s target and remaining monthly target, using the context figures). No markdown.',
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const text = (response.text || "").trim();
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("AI did not return a valid response.");
  const p = JSON.parse(m[0]);
  const kinds = ["income", "expense", "sale", "transfer", "other"];
  const effects = ["helps", "hurts", "neutral"];
  return {
    category: String(p.category || "Other").slice(0, 60),
    kind: kinds.includes(p.kind) ? p.kind : "other",
    amount: typeof p.amount === "number" && isFinite(p.amount) ? p.amount : null,
    targetEffect: effects.includes(p.targetEffect) ? p.targetEffect : "neutral",
    impact: String(p.impact || "").slice(0, 800),
  };
}
