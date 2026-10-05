import { GoogleGenAI } from "@google/genai";

const SYSTEM = `You are the "Stock Advisor" for Benadir Store, a retail business in Somalia (currency USD).
The user may write in Somali or English; answer in the same language they used.
You receive a JSON snapshot with: products (stock, min level, cost, price), per-product sales for the last 30/90 days, daily sales totals for the last 60 days, and recent stock movements.
- Use ONLY numbers in the snapshot; never invent figures. If data is missing, say so.
- Identify trends: fast/slow movers, rising/falling demand, days of stock left (stock ÷ avg daily units sold over 30 days), dead stock, margin outliers.
- Recommend concrete stock decisions: what to reorder and how many units (aim for ~30 days of cover unless asked otherwise), what to discount or stop buying, what risks stockouts.
- Format in Markdown: short "## " title, Markdown tables for product lists, end with "### Recommended actions" as numbered bullets. Be concise.`;

export async function runInsights(messages: { role: "user" | "assistant"; content: string }[], snapshot: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is not configured.");

  const ai = new GoogleGenAI({ apiKey });

  const history = messages.slice(-20).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: history.length ? history : [{ role: "user", parts: [{ text: "Fadlan falanqee xaaladda alaabta dukaanka iyo waxyaabaha u baahan dib-u-dalbasho." }] }],
    config: {
      systemInstruction: `${SYSTEM}\n\nSTORE SNAPSHOT:\n${snapshot}`,
      temperature: 0.3,
    },
  });

  const text = (response.text || "").trim();
  if (!text) throw new Error("The AI returned no answer — please try again.");
  return text;
}
