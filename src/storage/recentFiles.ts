const STORAGE_KEY = "open-granular:recent-files";
const MAX_ENTRIES = 10;

export function getRecentFiles(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentFile(name: string): string[] {
  const list = getRecentFiles().filter((n) => n !== name);
  list.unshift(name);
  const trimmed = list.slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}
