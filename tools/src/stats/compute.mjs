/** Pure functions that turn the raw GraphQL payload into card-ready numbers. */

/** Every calendar day across all contribution years, sorted, never past `today`. */
export function allDays(years, today) {
  const seen = new Map();
  for (const y of years) {
    for (const w of y.contributionCalendar?.weeks ?? []) {
      for (const d of w.contributionDays) {
        if (d.date <= today) seen.set(d.date, d.contributionCount);
      }
    }
  }
  return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
}

const shift = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * Longest run and the run ending today. A quiet *today* does not break the
 * current streak (the day is not over yet), so it may end yesterday.
 */
export function streaks(days, today) {
  let longest = { length: 0, start: null, end: null };
  let run = null;
  for (const d of days) {
    if (d.count > 0) {
      run = run ? { ...run, length: run.length + 1, end: d.date } : { length: 1, start: d.date, end: d.date };
      if (run.length > longest.length) longest = run;
    } else {
      run = null;
    }
  }
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  let end = byDate.get(today) ? today : shift(today, -1);
  let current = { length: 0, start: null, end: null };
  if (byDate.get(end)) {
    let start = end;
    while (byDate.get(shift(start, -1))) start = shift(start, -1);
    const length = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
    current = { length, start, end };
  }
  return { current, longest };
}

/**
 * Language share across repositories. Each repository contributes
 * sqrt(bytes) per language, which keeps one large or generated codebase
 * from drowning out everything else.
 */
export function languages(repos, { limit = 8, exclude = [] } = {}) {
  const totals = new Map();
  for (const repo of repos) {
    for (const { size, node } of repo.languages?.edges ?? []) {
      if (exclude.includes(node.name) || size <= 0) continue;
      const prev = totals.get(node.name) ?? { name: node.name, color: node.color ?? null, score: 0 };
      prev.score += Math.sqrt(size);
      totals.set(node.name, prev);
    }
  }
  const sorted = [...totals.values()].sort((a, b) => b.score - a.score);
  const sum = sorted.reduce((acc, l) => acc + l.score, 0) || 1;
  const top = sorted.slice(0, limit).map((l) => ({ ...l, share: l.score / sum }));
  const rest = sorted.slice(limit).reduce((acc, l) => acc + l.score, 0);
  if (rest > 0) top.push({ name: 'Other', color: null, score: rest, share: rest / sum });
  return top;
}

/** Quartile levels like GitHub's, for days that do not carry one. */
function levelFor(days) {
  const nz = days.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))] ?? 0;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  return (c) => (c === 0 ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4);
}

/** Days from `from` to `to` (inclusive) grouped into Sunday-first calendar columns. */
export function calendarWeeks(days, from, to) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const span = [];
  for (const d = new Date(`${from}T00:00:00Z`); d.toISOString().slice(0, 10) <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    const known = byDate.get(date);
    span.push({ date, count: known?.count ?? 0, level: known?.level });
  }
  const level = levelFor(span);
  const weeks = [];
  let week = [];
  for (const d of span) {
    week.push({ ...d, level: d.level ?? level(d.count) });
    if (new Date(`${d.date}T00:00:00Z`).getUTCDay() === 6) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push(week);
  return { weeks, total: span.reduce((a, d) => a + d.count, 0) };
}

/** The last 53 calendar weeks ending today, as on the profile. */
export function trailWeeks(days, today) {
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 52 * 7 - start.getUTCDay());
  return calendarWeeks(days, start.toISOString().slice(0, 10), today);
}

/**
 * `calendar` — days scraped from the profile (see calendar.mjs). When present it
 * is the source of truth for every contribution number, so the cards match the
 * graph GitHub shows; otherwise the GraphQL calendar is used. `recent` — the
 * profile's default last-12-months view, whose levels drive the main trail card.
 */
export function summarize(user, { today = new Date().toISOString().slice(0, 10), exclude = [], calendar = null, recent = null } = {}) {
  const days = calendar ? calendar.filter((d) => d.date <= today) : allDays(user.years, today);
  const first = days.find((d) => d.count > 0)?.date ?? null;
  const last = days.findLast((d) => d.count > 0)?.date ?? null;
  const repos = user.repositories.nodes;
  return {
    login: user.login,
    generatedAt: today,
    firstContribution: first,
    lastContribution: last,
    totalContributions: calendar
      ? days.reduce((acc, d) => acc + d.count, 0)
      : user.years.reduce((acc, y) => acc + (y.contributionCalendar?.totalContributions ?? 0), 0),
    source: calendar ? 'profile' : 'graphql',
    commits: user.years.reduce((acc, y) => acc + (y.totalCommitContributions ?? 0), 0),
    pullRequests: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    repositories: user.repositories.totalCount,
    stars: repos.reduce((acc, r) => acc + r.stargazerCount, 0),
    ...streaks(days, today),
    languages: languages(repos, { exclude }),
    ...(({ weeks, total }) => ({ trail: weeks, trailTotal: total }))(trailWeeks(recent ?? days, today)),
    years: [...new Set(days.map((d) => d.date.slice(0, 4)))]
      .sort()
      .reverse()
      .map((year) => {
        const end = `${year}-12-31` < today ? `${year}-12-31` : today;
        const { weeks, total } = calendarWeeks(days, `${year}-01-01`, end);
        return { year: Number(year), weeks, total };
      }),
  };
}
