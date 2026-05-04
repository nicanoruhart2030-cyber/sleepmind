import OpenAI from 'openai'

/** Kimi (Moonshot) uses an OpenAI-compatible HTTP API. */
export function createKimiClient() {
  const apiKey = process.env.KIMI_API_KEY ?? process.env.MOONSHOT_API_KEY ?? ''
  const baseURL = process.env.KIMI_BASE_URL ?? 'https://api.moonshot.ai/v1'
  return new OpenAI({ apiKey, baseURL })
}

/** Override with `KIMI_MODEL` (e.g. kimi-k2-0711-preview, moonshot-v1-8k). */
export function kimiModel() {
  return process.env.KIMI_MODEL ?? 'moonshot-v1-8k'
}
