
import { GoogleGenAI } from "@google/genai";

// Function to create a fresh Gemini client instance using the latest process.env.API_KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const polishDescription = async (title: string, roughDescription: string, prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一位专业的内容策展人。请优化以下 AIGC 作品的描述，使其更适合放在求职作品集中。
      
      标题：${title}
      原始描述：${roughDescription}
      使用的提示词 (Prompt)：${prompt}

      要求：语言专业、简洁，重点突出创意愿景和技术执行力。请直接返回优化后的中文文本。`,
      config: {
        temperature: 0.7,
      }
    });
    // Access property .text (not a method) and fallback to rough description
    return response.text || roughDescription;
  } catch (error) {
    console.error("Gemini Error:", error);
    return roughDescription;
  }
};

export const generateCreativeFeedback = async (workDescription: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `请根据这段作品描述提供一段简短的“AI 技术洞察”或“创作难点解析”：${workDescription}。字数在100字以内，语气要专业且前瞻。`,
      config: {
        temperature: 0.8,
      }
    });
    // Ensure string return for React state compatibility (aiInsight expects string)
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};
