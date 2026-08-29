import { GoogleGenAI } from '@google/genai';

const apiKey = 
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY)) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
  'AQ.Ab8RN6J-2DFhIqmaHjncFptq_ZhmTZfgeSeemUwOy6R4aWEuBA';

const ai = new GoogleGenAI({ apiKey });

export interface JourneyContext {
  activeScheme?: string;
  currentStep?: string;
  requiredDocuments?: string[];
  userLocale?: string;
}

export const UNIVERSAL_JANSETU_SYSTEM_PROMPT = `
You are SetuSahayak (सेतुसहायक) — the sovereign AI civic copilot for Project JanSetu.
Your mission is to provide accurate, step-by-step guidance on public welfare schemes, legal procedures, property verification, and citizen rights across India.

CAPABILITIES & SCOPE:
1. Answer ANY question asked by the citizen regarding:
   - Central & State government welfare schemes (eligibility, benefits, registration).
   - Legal, property, land records, and revenue procedures across all Indian states (7/12, Patta, RTC, Jamabandi, EC, Mutation).
   - Identity & documentation procedures (Aadhaar, PAN, Voter ID, Passport, DigiLocker, Ration Cards, Caste/Income certificates).
   - Civic processes (RTI filing, consumer complaints, municipal services, utility connections, tax filing/TDS).
   - General knowledge and step-by-step citizen empowerment workflows.

RESPONSE RULES:
- Full Exhaustive Answers: NEVER truncate or stop mid-explanation. Deliver complete, end-to-end guidance categorized into structured bullet points or numbered steps.
- Active Context Awareness: If active journey context (scheme, milestone) is provided and relevant, prioritize it. If the user asks a broad or unrelated question, answer it fully without forcing it into the active journey context.
- Language Fluency: Automatically detect and respond in whatever language the citizen uses (English, Hindi, Devanagari, Hinglish, or any of the 22 Eighth Schedule regional Indian languages).
- Formatting: Use bold headers and clean bulleted lists for immediate scannability.
`;

export async function streamCivicHelp(
  userQuery: string,
  context: JourneyContext | undefined,
  onChunk: (textChunk: string) => void
): Promise<string> {
  let fullResponse = '';

  const contextualContext = context && context.activeScheme
    ? `\n[OPTIONAL CONTEXT - Active Scheme: ${context.activeScheme}, Current Step: ${context.currentStep || 'None'}, Required Docs: ${context.requiredDocuments?.join(', ') || 'None'}]\n`
    : '';

  const fullPrompt = `${contextualContext}[CITIZEN QUERY]\n${userQuery}`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.6-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: UNIVERSAL_JANSETU_SYSTEM_PROMPT,
        maxOutputTokens: 2500, // Provides full headroom for multi-section answers
        temperature: 0.3,      // Ensures deterministic, grounded legal/civic accuracy
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text || '';
      fullResponse += text;
      onChunk(fullResponse);
    }

    return fullResponse;
  } catch (error) {
    console.error('Error in SetuSahayak AI Stream:', error);
    const fallbackMsg = 'Service is temporarily unable to retrieve this data. Please verify your connection or retry.';
    onChunk(fallbackMsg);
    return fallbackMsg;
  }
}
