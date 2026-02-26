export interface ProjectPick {
  name: string;
  description: string;
  why: string;
  url: string;
  category: string;
}

export function parseProjectPicks(raw: string): ProjectPick[] {
  try {
    const picks = JSON.parse(raw);
    if (Array.isArray(picks)) return picks.slice(0, 3);
  } catch {
    // ignore
  }
  return [];
}
