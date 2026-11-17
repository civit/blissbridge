import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ALLOWED_RADICALS = [
  "person","person_1","person_2","person_3","heart","mind","mouth","eye","ear",
  "water","food","drink","house","medical","legs","wheel","sun","moon","bed",
  "book","chair","arrow_up","arrow_down","arrow_right","arrow_left","negation",
  "question","hand","pain","fire","cold","plus","enclosure","music","time"
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { text, lang = "es", mode = "easy_read" } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Simplify this ${lang === "es" ? "Spanish" : "English"} text in mode "${mode}": "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            simplifiedText: { type: Type.STRING },
            secondaryTranslation: { type: Type.STRING },
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  secondaryWord: { type: Type.STRING },
                  grammarRole: {
                    type: Type.STRING,
                    enum: ["pronoun","verb","noun","adjective","time","place","negation","question","social"]
                  },
                  blissIndicator: {
                    type: Type.STRING,
                    enum: ["action","evaluation","thing","plural","past","future","none"]
                  },
                  primaryRadical: { type: Type.STRING, enum: ALLOWED_RADICALS },
                  secondaryRadical: { type: Type.STRING, enum: [...ALLOWED_RADICALS, "none"] },
                  blissExplanation: { type: Type.STRING }
                },
                required: ["word","secondaryWord","grammarRole","blissIndicator","primaryRadical","secondaryRadical","blissExplanation"]
              }
            }
          },
          required: ["simplifiedText", "secondaryTranslation", "concepts"]
        }
      }
    });

    return res.status(200).json(JSON.parse(response.text));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}