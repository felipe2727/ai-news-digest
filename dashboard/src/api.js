const DATA_BASE = import.meta.env.VITE_DATA_URL || '/data';

let indexCache = null;
const digestCache = new Map();

export async function getDigests() {
  if (indexCache) return indexCache;
  const res = await fetch(`${DATA_BASE}/index.json`);
  if (!res.ok) return [];
  indexCache = await res.json();
  return indexCache;
}

export async function getDigest(id) {
  if (digestCache.has(id)) return digestCache.get(id);
  const res = await fetch(`${DATA_BASE}/digests/${id}.json`);
  if (!res.ok) return null;
  const data = await res.json();
  digestCache.set(id, data);
  return data;
}

export async function getAllDigests() {
  const index = await getDigests();
  const results = await Promise.all(
    index.map(entry => getDigest(entry.id))
  );
  return results.filter(Boolean);
}
