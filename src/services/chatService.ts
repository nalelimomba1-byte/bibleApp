import Constants from 'expo-constants';

const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function chatWithOpenRouter(userPrompt: string): Promise<string> {
  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://example.com',
        'X-Title': 'Bible Chat',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant who answers in English with biblical faithfulness. When helpful, cite relevant Bible references and keep answers concise and clear.' },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    return content || 'No response.';
  } catch (e) {
    console.error('OpenRouter error', e);
    throw e;
  }
}


