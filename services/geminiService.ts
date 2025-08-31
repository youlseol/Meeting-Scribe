
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const summarizeText = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API key not configured. Please set the API_KEY environment variable.";
  }
  if (!text || text.trim().length < 20) {
    return "Please provide more content to generate a summary.";
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Summarize the following meeting notes. Focus on extracting key decisions and action items. Format the output cleanly using markdown. \n\n---MEETING NOTES---\n${text}`,
    });

    return response.text;
  } catch (error) {
    console.error("Error summarizing text with Gemini API:", error);
    return "An error occurred while generating the summary.";
  }
};
