
import { GoogleGenAI, Type } from "@google/genai";
import { Product, AIInsight } from "../types";

export const getProfitabilityInsights = async (products: Product[]): Promise<AIInsight[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT'! });
  
  const prompt = `Analyze the following digital products portfolio. 
  Each product has a fixed unit price and a history of daily logs containing salesCount (number of units sold) and adSpend (INR).
  The currency is Indian Rupee (INR / ÃÂ¢ÃÂÃÂ¹).
  
  Products Data: ${JSON.stringify(products)}
  
  Calculation Logic:
  - Daily Revenue = salesCount * product.price
  - Daily Profit = (salesCount * product.price) - adSpend
  
  Key Considerations for Analysis:
  1. Historical Trends: Evaluate if salesCount is growing or declining.
  2. Efficiency: ROAS analysis using (salesCount * price) / adSpend.
  3. Pricing Strategy: Does the current unit price optimize for total volume (salesCount) vs net profit?
  4. Growth Blueprint: Identify products with high sales counts but low ad spend as scale candidates.
  5. Indian Market Context: Provide advice relevant to the Indian digital creator/SaaS landscape.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              impact: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
              category: { type: Type.STRING, enum: ['Pricing', 'Marketing', 'Operations'] }
            },
            required: ["title", "recommendation", "impact", "category"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return [{
      title: "Insight Analysis Failed",
      recommendation: "Ensure you have enough daily log data for an accurate trend analysis.",
      impact: "Low",
      category: "Operations"
    }];
  }
};
