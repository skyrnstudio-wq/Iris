export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const FREE_MODELS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3.5-lightning:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'dots-studio/dots-3-note-preview:free',
];

/**
 * Multi-turn conversational chat with automatic model fallback
 */
export async function callAIChat(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number; preferredModel?: string }
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY not configured');
    return null;
  }

  const modelsToTry = options?.preferredModel 
    ? [options.preferredModel, ...FREE_MODELS.filter(m => m !== options.preferredModel)]
    : FREE_MODELS;

  for (const model of modelsToTry) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'IRIS Personal Assistant',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 1500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Model ${model} returned ${response.status}: ${errorText.slice(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && typeof content === 'string' && content.trim().length > 0) {
        return content.trim();
      }
    } catch (err: any) {
      console.warn(`Error calling model ${model}:`, err.message);
    }
  }

  console.error('All candidate OpenRouter models failed.');
  return null;
}

/**
 * Structured JSON completion with fallback and regex parsing
 */
export async function callAI(
  systemPrompt: string,
  userMessage: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<any | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY not found');
    return null;
  }

  for (const model of FREE_MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'IRIS',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: `${systemPrompt}\nOutput MUST be valid JSON only.` },
            { role: 'user', content: userMessage },
          ],
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? 1200,
        }),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      // Extract JSON if wrapped in markdown code fence
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const rawJson = jsonMatch ? jsonMatch[1] : content;

      try {
        return JSON.parse(rawJson);
      } catch {
        const firstBrace = rawJson.indexOf('{');
        const firstBracket = rawJson.indexOf('[');
        const startIdx = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket))
          ? firstBrace
          : firstBracket;
        
        if (startIdx !== -1) {
          const lastIdx = Math.max(rawJson.lastIndexOf('}'), rawJson.lastIndexOf(']'));
          if (lastIdx > startIdx) {
            return JSON.parse(rawJson.slice(startIdx, lastIdx + 1));
          }
        }
      }
    } catch (error) {
      console.warn(`JSON call failed for model ${model}:`, error);
    }
  }

  return null;
}
