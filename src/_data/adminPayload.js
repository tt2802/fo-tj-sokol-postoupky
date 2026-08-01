function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeParseJson(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function collectArrayCandidates(payload, key, candidates, depth, seen) {
  if (!isObject(payload) || seen.has(payload)) return;
  seen.add(payload);

  if (Array.isArray(payload[key])) {
    candidates.push({ items: payload[key], depth, source: key });
  }

  if (isObject(payload.data)) {
    if (Array.isArray(payload.data[key])) {
      candidates.push({ items: payload.data[key], depth: depth + 1, source: `data.${key}` });
    }
    collectArrayCandidates(payload.data, key, candidates, depth + 1, seen);
  }

  const parsedRaw = safeParseJson(payload.raw);
  if (parsedRaw) {
    collectArrayCandidates(parsedRaw, key, candidates, depth + 1, seen);
  }
}

function extractArrayPayload(payload, key) {
  const candidates = [];
  collectArrayCandidates(payload, key, candidates, 0, new Set());

  if (!candidates.length) return [];

  const firstNonEmpty = candidates.find((candidate) => Array.isArray(candidate.items) && candidate.items.length > 0);
  if (firstNonEmpty) return firstNonEmpty.items;

  return candidates[0].items;
}

module.exports = {
  extractArrayPayload
};
