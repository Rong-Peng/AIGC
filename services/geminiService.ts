
import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const polishDescription = async (title: string, roughDescription: string) => {
  try {
    const ai = getAI();
    if (!ai) return roughDescription;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一位专业的内容策展人。请优化以下 AIGC 作品的描述，使其更适合放在求职作品集中。
      
      标题：${title}
      描述：${roughDescription}

      要求：语言专业、简洁，重点突出创意愿景。请直接返回优化后的中文文本。`,
      config: { temperature: 0.7 }
    });
    return response.text || roughDescription;
  } catch (error) {
    return roughDescription;
  }
};

export const generateCreativeFeedback = async (workDescription: string) => {
  try {
    const ai = getAI();
    if (!ai) return "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `请根据这段作品描述提供一段简短的“AI 技术洞察”：${workDescription}。100字以内，语气专业且前瞻。`,
      config: { temperature: 0.8 }
    });
    return response.text || "";
  } catch (error) {
    return "";
  }
};
