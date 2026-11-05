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

/**
 * The last 53 calendar weeks (Sunday first) with GitHub-style levels:
 * quartiles of the non-zero days in the window.
 */
export function trailWeeks(days, today) {
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  const end = new Date(`${today}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 52 * 7 - start.getUTCDay());
  const window = [];
  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    window.push({ date, count: byDate.get(date) ?? 0 });
  }
  const nz = window.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))] ?? 0;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  const level = (c) => (c === 0 ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4);
  const weeks = [];
  for (let i = 0; i < window.length; i += 7) weeks.push(window.slice(i, i + 7).map((d) => ({ ...d, level: level(d.count) })));
  return { weeks, total: window.reduce((a, d) => a + d.count, 0) };
}

export function summarize(user, { today = new Date().toISOString().slice(0, 10), exclude = [] } = {}) {
  const days = allDays(user.years, today);
  const first = days.find((d) => d.count > 0)?.date ?? null;
  const last = days.findLast((d) => d.count > 0)?.date ?? null;
  const repos = user.repositories.nodes;
  return {
    login: user.login,
    generatedAt: today,
    firstContribution: first,
    lastContribution: last,
    totalContributions: user.years.reduce((acc, y) => acc + (y.contributionCalendar?.totalContributions ?? 0), 0),
    commits: user.years.reduce((acc, y) => acc + (y.totalCommitContributions ?? 0), 0),
    pullRequests: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    repositories: user.repositories.totalCount,
    stars: repos.reduce((acc, r) => acc + r.stargazerCount, 0),
    ...streaks(days, today),
    languages: languages(repos, { exclude }),
    ...(({ weeks, total }) => ({ trail: weeks, trailTotal: total }))(trailWeeks(days, today)),
  };
}
