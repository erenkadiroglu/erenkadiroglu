/**
 * Reads the contribution calendar exactly as GitHub draws it on the profile
 * (https://github.com/users/<login>/contributions). Unlike the GraphQL API with
 * a repository token, this includes private contributions whenever the owner
 * has "Include private contributions on my profile" turned on, and it carries
 * GitHub's own intensity level for every day — so the boxes match the real graph.
 */

const UA = 'readme-stats-cards (+https://github.com/erenkadiroglu/erenkadiroglu)';

/**
 * Parses the calendar fragment. Each day is a <td data-date data-level id>, and
 * its count lives in a <tool-tip for="<id>"> such as "5 contributions on May 3rd."
 * or "No contributions on May 4th.".
 */
export function parseCalendar(html) {
  const cells = new Map();
  for (const m of html.matchAll(/<td\b[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g)) {
    const tag = m[0];
    const id = /\bid="([^"]+)"/.exec(tag)?.[1] ?? m[1];
    const level = Number(/\bdata-level="(\d)"/.exec(tag)?.[1] ?? 0);
    cells.set(id, { date: m[1], level, count: null });
  }
  for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g)) {
    const cell = cells.get(m[1]);
    if (!cell) continue;
    const n = /(\d[\d,]*)\s+contributions?/i.exec(m[2]);
    cell.count = n ? Number(n[1].replace(/,/g, '')) : 0;
  }
  const days = [...cells.values()].map((d) => ({ ...d, count: d.count ?? (d.level > 0 ? d.level : 0) }));
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchCalendarYear(login, year, today, attempt = 1) {
  const to = `${year}-12-31` < today ? `${year}-12-31` : today;
  const url = `https://github.com/users/${encodeURIComponent(login)}/contributions?from=${year}-01-01&to=${to}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
  if (res.status >= 500 && attempt < 4) {
    await new Promise((done) => setTimeout(done, 2 ** attempt * 1000));
    return fetchCalendarYear(login, year, today, attempt + 1);
  }
  if (!res.ok) throw new Error(`calendar ${year}: HTTP ${res.status}`);
  const days = parseCalendar(await res.text());
  if (!days.length) throw new Error(`calendar ${year}: no days found — page format changed?`);
  return days.filter((d) => d.date.startsWith(String(year)));
}

/** Every day of the given years, as GitHub's profile shows them. */
export async function fetchCalendar(login, years, today) {
  const all = [];
  for (const y of years) all.push(...(await fetchCalendarYear(login, y, today)));
  return all.filter((d) => d.date <= today);
}

/** The default profile view: the last 12 months, with that view's own levels. */
export async function fetchRecent(login, today, attempt = 1) {
  const res = await fetch(`https://github.com/users/${encodeURIComponent(login)}/contributions`, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
  });
  if (res.status >= 500 && attempt < 4) {
    await new Promise((done) => setTimeout(done, 2 ** attempt * 1000));
    return fetchRecent(login, today, attempt + 1);
  }
  if (!res.ok) throw new Error(`calendar (recent): HTTP ${res.status}`);
  const days = parseCalendar(await res.text());
  if (!days.length) throw new Error('calendar (recent): no days found — page format changed?');
  return days.filter((d) => d.date <= today);
}
