const ttlMs = Number(process.env.CHAT_CACHE_TTL_MS ?? 60 * 60 * 1000);
const maxEntries = Number(process.env.CHAT_CACHE_MAX ?? 500);
const similarityThreshold = Number(
  process.env.CHAT_CACHE_SIMILARITY ?? 0.85,
);

const cache = new Map();

const normalize = (text) =>
  text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const stopwords = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "what",
  "whats",
  "how",
  "why",
  "when",
  "where",
  "who",
  "which",
  "do",
  "does",
  "did",
  "can",
  "could",
  "should",
  "would",
  "will",
  "to",
  "of",
  "in",
  "on",
  "for",
  "and",
  "or",
  "it",
  "this",
  "that",
  "me",
  "my",
  "i",
  "you",
  "your",
  "please",
]);

const tokenize = (text) =>
  new Set(
    normalize(text)
      .split(" ")
      .filter((token) => token && !stopwords.has(token)),
  );

const jaccard = (a, b) => {
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }

  return intersection / (a.size + b.size - intersection);
};

const prune = () => {
  const now = Date.now();

  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }

  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
};

const touch = (key, entry) => {
  cache.delete(key);
  cache.set(key, entry);
};

const describe = (messages) => {
  const last = messages[messages.length - 1];
  const prefix = messages
    .slice(0, -1)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  return {
    prefix: normalize(prefix),
    question: normalize(last?.content ?? ""),
    questionTokens: tokenize(last?.content ?? ""),
  };
};

export const getCachedResponse = (userId, messages) => {
  if (ttlMs <= 0 || maxEntries <= 0) return null;

  prune();

  const { prefix, question, questionTokens } = describe(messages);
  const key = `${userId}::${prefix}::${question}`;

  const exact = cache.get(key);
  if (exact) {
    touch(key, exact);
    return { content: exact.content, score: 1, exact: true };
  }

  if (similarityThreshold <= 0) return null;

  let bestKey = null;
  let bestEntry = null;
  let bestScore = 0;

  for (const [entryKey, entry] of cache) {
    if (entry.userId !== userId || entry.prefix !== prefix) continue;

    const score = jaccard(questionTokens, entry.questionTokens);
    if (score >= similarityThreshold && score > bestScore) {
      bestKey = entryKey;
      bestEntry = entry;
      bestScore = score;
    }
  }

  if (!bestEntry) return null;

  touch(bestKey, bestEntry);
  return { content: bestEntry.content, score: bestScore, exact: false };
};

export const setCachedResponse = (userId, messages, content) => {
  if (ttlMs <= 0 || maxEntries <= 0 || !content) return;

  const { prefix, question, questionTokens } = describe(messages);
  const key = `${userId}::${prefix}::${question}`;

  cache.delete(key);
  cache.set(key, {
    userId,
    prefix,
    questionTokens,
    content,
    expiresAt: Date.now() + ttlMs,
  });

  prune();
};
