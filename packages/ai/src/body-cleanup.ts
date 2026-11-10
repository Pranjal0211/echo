/**
 * Removes fact-id citations a model wrote into the body, e.g. "React apps [fact-react]".
 * Ids belong in factIdsUsed; left in the body they'd look like unfilled placeholders.
 */
export function stripFactIds(body: string, factIds: readonly string[]): string {
  if (factIds.length === 0) return body;
  const escaped = factIds.map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`[ \\t]*\\[(?:${escaped.join("|")})(?:\\s*,\\s*(?:${escaped.join("|")}))*\\]`, "g");
  return body.replace(pattern, "");
}
