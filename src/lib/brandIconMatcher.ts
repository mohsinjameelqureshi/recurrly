function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const aliases: Record<string, string> = {
  spoitify: "spotify",
  chatgpt: "openai",
  gmail: "google-gmail",
  gdrive: "google-drive",
  gemini: "google-gemini",
  gsuite: "google-gsuite",
};

export function createBrandIconMatcher(slugs: string[]) {
  const names = new Map<string, string>();
  // Prefer compact symbols over wide wordmarks for square subscription cards.
  for (const slug of slugs) {
    if (!slug.endsWith("-icon")) names.set(normalize(slug), slug);
  }
  for (const slug of slugs) {
    if (slug.endsWith("-icon")) names.set(normalize(slug.slice(0, -5)), slug);
  }

  return (name: string): string | undefined => {
    const exactKey = normalize(name);
    const exact = names.get(normalize(aliases[exactKey] ?? exactKey));
    if (exact) return exact;
    const withoutPlan = name
      .trim()
      .replace(
        /(?:\s+(?:pro|premium|plus|personal|business|teams?|family|individual|monthly|yearly|annual|plan|subscription))+$/i,
        "",
      );
    const key = normalize(withoutPlan);
    if (!key) return undefined;
    const alias = aliases[key];
    return (alias ? names.get(normalize(alias)) : undefined) ?? names.get(key);
  };
}
