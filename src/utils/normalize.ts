export function normalizeRef(ref: string): string {
  return ref
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

export function extractRefFromText(text: string): string | null {
  const totalMatch = text.match(/\b([A-Za-z0-9-]{4,})\s*,?\s*total\b/i);
  if (totalMatch && totalMatch[1]) {
    return normalizeRef(totalMatch[1]);
  }

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
  const candidates: string[] = [];

  const isRefSuffix = (value: string): boolean => {
    if (/^\d{2,4}$/.test(value)) {
      return true;
    }
    if (/^[A-Za-z]{2,6}$/.test(value)) {
      return true;
    }
    if (/^[A-Za-z0-9]{2,6}$/.test(value) && /\d/.test(value) && /[A-Za-z]/.test(value)) {
      return true;
    }
    return false;
  };

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (!/\d/.test(part)) {
      continue;
    }

    let combined = part;
    let appended = 0;
    for (let j = i + 1; j < parts.length && appended < 2; j += 1) {
      const next = parts[j];
      if (!isRefSuffix(next)) {
        break;
      }
      combined += next;
      appended += 1;
    }

    const normalized = normalizeRef(combined);
    const digitCount = (normalized.match(/\d/g) || []).length;
    if (digitCount >= 4) {
      candidates.push(normalized);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  let best = candidates[0];
  for (const candidate of candidates) {
    if (candidate.length > best.length) {
      best = candidate;
    }
  }

  return best;
}
