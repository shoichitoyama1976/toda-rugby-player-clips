const SHEET_HOSTS = new Set(["docs.google.com", "spreadsheets.google.com"]);

export function isAllowedSheetUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return SHEET_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

export function spreadsheetIdFromUrl(input: string): string | null {
  const id = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!id || id[1] === "e") return null;
  return id[1];
}

export function gvizCsvUrl(id: string, sheetName: string): string {
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

export function csvExportByGid(id: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

export function gidsFromUrl(input: string): string[] {
  const found = [...input.matchAll(/[?&#]gid=([0-9]+)/g)].map((m) => m[1]);
  return [...new Set(found)];
}

export function toCsvExportUrl(input: string): string {
  const raw = input.trim();
  if (!raw) return raw;
  if (/output=csv|format=csv|tqx=out:csv/i.test(raw)) return raw;

  const published = raw.match(/\/spreadsheets\/d\/e\/([^/]+)/);
  if (published) {
    return `https://docs.google.com/spreadsheets/d/e/${published[1]}/pub?output=csv`;
  }

  const id = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (id) {
    const gid = raw.match(/[?&#]gid=([0-9]+)/)?.[1] ?? "0";
    return `https://docs.google.com/spreadsheets/d/${id[1]}/export?format=csv&gid=${gid}`;
  }

  return raw;
}
