import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { TEXT_GENERATION_MODEL, IMAGE_GENERATION_MODEL } from '../constants';
import { GeneratedPanelPrompt, COMIC_PANEL_SCHEMA } from '../types';

/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 The base64 string to decode.
 * @returns A Uint8Array representing the decoded binary data.
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes a Uint8Array into a base64 string.
 * @param bytes The Uint8Array to encode.
 * @returns A base64 string representation of the binary data.
 */
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const getGenerativeAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Generates a text-based story outline and panel prompts based on an input image.
 *
 * @param imageBase64 The base64 encoded string of the input image.
 * @param mimeType The MIME type of the input image (e.g., 'image/png', 'image/jpeg').
 * @param panelCount The number of comic panels to generate.
 * @returns A promise that resolves to an array of GeneratedPanelPrompt.
 */
export async function generateComicPrompts(
  imageBase64: string,
  mimeType: string,
  panelCount: number,
): Promise<GeneratedPanelPrompt[]> {
  const ai = getGenerativeAI();

  const prompt = `Based on this image, create a short, engaging ${panelCount}-panel comic story for kids. For each panel, provide:
  1. A visual \`imagePrompt\` (max 50 words) that describes the scene and characters in that panel, suitable for an image generation model.
  2. A concise \`caption\` (max 15 words) that tells part of the story.
  Return the output as a JSON array of objects, where each object has a \`panelNumber\` (1 to ${panelCount}), an \`imagePrompt\`, and a \`caption\`. The comic should have a clear beginning, middle, and end.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_GENERATION_MODEL,
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: COMIC_PANEL_SCHEMA as { type: Type, items: { type: Type, properties: { [key: string]: { type: Type, description: string } }, required: string[], propertyOrdering: string[] } } // Cast to fit the Type definition precisely
      },
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) {
      throw new Error("Empty response or no text content from Gemini API for comic prompts.");
    }
    const parsedData: GeneratedPanelPrompt[] = JSON.parse(jsonStr);
    return parsedData;
  } catch (error) {
    console.error("Error generating comic prompts:", error);
    throw new Error(`Failed to generate comic prompts: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generates an image from a given text prompt using the Gemini image generation model.
 *
 * @param imagePrompt The text prompt to generate the image.
 * @returns A promise that resolves to the base64 encoded string of the generated image.
 */
export async function generateImageFromPrompt(imagePrompt: string): Promise<string> {
  const ai = getGenerativeAI();

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: IMAGE_GENERATION_MODEL,
      contents: {
        parts: [{ text: imagePrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1", // Square aspect ratio for comic panels
          // imageSize: "1K" // Uncomment for gemini-3-pro-image-preview
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data found in the Gemini API response.");
  } catch (error) {
    console.error("Error generating image from prompt:", error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const base64Helpers = {
  decode,
  encode,
};
