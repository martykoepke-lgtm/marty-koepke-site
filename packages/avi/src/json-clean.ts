/**
 * Strip markdown fences and other LLM-output noise before JSON.parse.
 * Models occasionally wrap JSON in ```json ... ``` despite being asked not to.
 */
export function cleanJson(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}
