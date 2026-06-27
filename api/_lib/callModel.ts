/**
 * Provider abstraction — OpenAI (contract C-1).
 * Calls OpenAI chat completions via fetch only; no model SDK.
 * Key and model come exclusively from server-side env vars.
 */

export type ModelMessage = { role: 'system' | 'user'; content: string };

interface OpenAIChoice {
  message: { content: string | null };
}
interface OpenAIResponse {
  choices: OpenAIChoice[];
  model: string;
}

/**
 * Single-shot call to OpenAI chat completions.
 * Model from env (OPENAI_MODEL). Returns raw text.
 * Throws on non-2xx or unexpected response shape.
 */
export async function callModel(
  messages: ModelMessage[],
  opts?: { json?: boolean },
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set (server env only)');

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  const body: Record<string, unknown> = { model, messages };
  if (opts?.json) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '(unreadable)');
    throw new Error(`OpenAI ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Unexpected OpenAI response shape: no string content');
  }
  return content;
}
