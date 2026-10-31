// Match dashboard.js scheduleIcon and the website's default schedule categories.
const websiteIcons: Record<string, string> = {
  trash: '🗑️',
  recycle: '♻️',
  leaf: '🌿',
  warning: '⚠️',
};

export function scheduleIcon(icon: string | null | undefined, wasteType: string): string {
  const value = icon?.trim() ?? '';
  if (websiteIcons[value]) return websiteIcons[value];
  if (value && !/[?\uFFFD]/u.test(value)) return value;
  const type = wasteType.toLowerCase();
  if (type.includes('recyclab')) return websiteIcons.recycle;
  if (type.includes('organic')) return websiteIcons.leaf;
  if (type.includes('hazardous')) return websiteIcons.warning;
  if (type.includes('general')) return websiteIcons.trash;
  return '♻️';
}