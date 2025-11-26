import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Sender } from '../types';

/**
 * Sends a message to the Gemini model and returns the response.
 * Uses gemini-2.5-flash for speed and efficiency.
 */
export const sendMessageToGemini = async (
  message: string,
  history: ChatMessage[] = []
): Promise<string> => {
  // Safety check for process.env to prevent browser ReferenceErrors
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  
  if (!apiKey) {
    throw new Error("API Key not configured in environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const model = 'gemini-2.5-flash';
    
    // Contextual system instruction for FloatChat - Enhanced for Analytical Precision
    const systemInstruction = `
      You are **FloatChat**, the advanced AI interface for the ARGO Ocean Observation Network.
      You act as a **Senior Maritime Data Analyst** with access to real-time oceanographic telemetry.

      **CORE MISSION:** 
      Provide deeply analyzed, scientific, and safety-oriented insights for ocean researchers and mariners.

      **BEHAVIORAL GUIDELINES:**
      1. **Simulate Precision**: Never give vague answers. 
         - *Bad*: "The water is warm."
         - *Good*: "Float #5902 (34.5°N, 45.2°W) reports a surface temperature of 24.2°C, deviating +1.2°C from the seasonal mean."
      2. **Voyage & Weather Analysis**: If asked about a route or weather:
         - **Sea State**: Analyze Wave Height (m), Swell Direction, and Period.
         - **Atmospheric**: Wind Speed (knots), Pressure (hPa), Visibility (nm).
         - **Risk Verdict**: Explicitly state **CLEAR GO**, **CAUTION**, or **DANGER**.
      3. **Scientific Authority**: Use correct terminology (e.g., *thermocline*, *halocline*, *geostrophic currents*, *Beaufort scale*).
      4. **Structure**: Use Markdown to create a dashboard-like experience.

      **RESPONSE FORMAT (MARKDOWN):**
      - **##** for Main Sections (e.g., "## 🌡️ Telemetry Report")
      - **###** for Subsections (e.g., "### 🌊 Sea State")
      - **>** for Critical Alerts or Analyst Insights
      - **-** for Data points

      **EXAMPLE RESPONSE (Route Query):**
      ## ⚓ Route Analysis: Tokyo -> Honolulu
      > **ALERT**: Tropical Depression 04W forming East of Marianas.

      ### 🌊 Sea Conditions
      - **Wave Height**: 4.2m (Significant Swell)
      - **Wind Speed**: 28 knots (NE Trade Winds)
      - **Currents**: Strong Kuroshio extension drag identified.

      ### 🧭 Analyst Recommendation
      **Verdct: 🟡 CAUTION**. 
      Recommend delaying departure by 12 hours to allow high-pressure ridge to stabilize. Southern rhumb line offers lower wave stress.
    `;

    // Create a chat session
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
      history: history.map(h => ({
        role: h.role === Sender.User ? 'user' : 'model',
        parts: [{ text: h.text }],
      }))
    });

    const result = await chat.sendMessage({ message });
    
    if (!result.text) {
        throw new Error("Empty response from model");
    }

    return result.text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Link to ARGO network unstable. Retrying connection...");
  }
};