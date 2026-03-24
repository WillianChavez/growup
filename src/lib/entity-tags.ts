export function normalizeTagNames(tags: string[] | null | undefined): string[] {
  if (!tags || tags.length === 0) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const value = tag.trim();
    if (!value) continue;

    const key = value.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(value);
  }

  return normalized;
}
