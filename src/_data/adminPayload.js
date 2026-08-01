function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

const WRAPPER_KEYS = new Set([
  "partial",
  "path",
  "meta",
  "isModification",
  "raw",
  "data",
  "author",
  "slug",
  "newRecord",
  "status",
  "mediaFiles",
  "label",
  "updatedOn",
  "i18n",
  "collection"
]);

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

function collectObjectCandidates(payload, candidates, depth, seen) {
  if (!isObject(payload) || seen.has(payload)) return;
  seen.add(payload);
  candidates.push({ payload, depth });

  if (isObject(payload.data)) {
    collectObjectCandidates(payload.data, candidates, depth + 1, seen);
  }

  const parsedRaw = safeParseJson(payload.raw);
  if (parsedRaw) {
    collectObjectCandidates(parsedRaw, candidates, depth + 1, seen);
  }
}

function scoreObjectCandidate(payload, preferredKeys = []) {
  if (!isObject(payload)) return Number.NEGATIVE_INFINITY;

  const keys = Object.keys(payload);
  if (!keys.length) return Number.NEGATIVE_INFINITY;

  const nonMetaKeys = keys.filter((key) => !WRAPPER_KEYS.has(key));
  const metaKeys = keys.length - nonMetaKeys.length;

  let score = nonMetaKeys.length * 20 - metaKeys * 6;

  preferredKeys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) return;
    score += 120;

    const value = payload[key];
    if (Array.isArray(value)) {
      score += value.length > 0 ? 800 + Math.min(value.length, 25) : 10;
      return;
    }

    if (isObject(value)) {
      score += Object.keys(value).length > 0 ? 220 : 15;
      return;
    }

    if (value !== undefined && value !== null && value !== "") {
      score += 40;
    }
  });

  if (typeof payload.raw === "string" && payload.raw.trim()) {
    score -= 8;
  }

  return score;
}

function extractArrayPayload(payload, key) {
  const candidates = [];
  collectArrayCandidates(payload, key, candidates, 0, new Set());

  if (!candidates.length) return [];

  const firstNonEmpty = candidates.find((candidate) => Array.isArray(candidate.items) && candidate.items.length > 0);
  if (firstNonEmpty) return firstNonEmpty.items;

  return candidates[0].items;
}

function extractObjectPayload(payload, preferredKeys = []) {
  const candidates = [];
  collectObjectCandidates(payload, candidates, 0, new Set());

  if (!candidates.length) return {};

  return candidates
    .map((candidate) => ({
      payload: candidate.payload,
      depth: candidate.depth,
      score: scoreObjectCandidate(candidate.payload, preferredKeys)
    }))
    .sort((a, b) => b.score - a.score || a.depth - b.depth)[0].payload;
}

module.exports = {
  extractArrayPayload,
  extractObjectPayload
};
