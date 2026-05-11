export function normalizeRef(ref: string): string {
  return ref
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

export function extractRefFromText(text: string): string | null {
  const matches = text.match(/[A-Za-z0-9-]{4,}/g);
  if (!matches) {
    return null;
  }

  for (const token of matches) {
    if (/\d/.test(token) && /[A-Za-z]/.test(token)) {
      return normalizeRef(token);
    }
  }

  for (const token of matches) {
    if (/\d/.test(token)) {
      return normalizeRef(token);
    }
  }

  return null;
}

export function extractRefFromSlug(slug: string): string | null {
  const cleanSlug = slug.replace(/\/+$/, "").split("/").filter(Boolean).pop() || "";
  if (!cleanSlug) {
    return null;
  }

  const parts = cleanSlug.split(/[-_]+/).filter(Boolean);
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (/\d/.test(part) && /[A-Za-z]/.test(part)) {
      return normalizeRef(part);
    }

    if (/\d/.test(part)) {
      if (/^\d{4,}$/.test(part)) {
        return normalizeRef(part);
      }
      const next = parts[i + 1];
      if (next && /^[A-Za-z]{2,6}$/.test(next)) {
        return normalizeRef(`${part}${next}`);
      }
    }
  }

  return null;
}
