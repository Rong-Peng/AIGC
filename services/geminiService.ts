
import { GoogleGenAI } from "@google/genai";

// 稳健获取 API 实例，防止在 process.env 未定义的非构建环境下崩溃
const getAI = () => {
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  if (!apiKey) {
    console.warn("Gemini API Key 尚未配置，AI 功能将暂时失效。");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const polishDescription = async (title: string, roughDescription: string, prompt: string) => {
  try {
    const ai = getAI();
    if (!ai) return roughDescription;

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
    return response.text || roughDescription;
  } catch (error) {
    console.error("Gemini Error:", error);
    return roughDescription;
  }
};

export const generateCreativeFeedback = async (workDescription: string) => {
  try {
    const ai = getAI();
    if (!ai) return "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `请根据这段作品描述提供一段简短的“AI 技术洞察”或“创作难点解析”：${workDescription}。字数在100字以内，语气要专业且前瞻。`,
      config: {
        temperature: 0.8,
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};
