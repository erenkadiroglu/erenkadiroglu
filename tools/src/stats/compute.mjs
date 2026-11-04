/** Pure functions that turn the raw GraphQL payload into card-ready numbers. */

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

export function flattenDays(calendar) {
  return calendar.weeks.flatMap((w) => w.contributionDays).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Current streak counts back from `today`. A quiet *today* does not break the
 * streak (the day is not over yet), so counting may start from yesterday.
 */
export function streaks(days, today) {
  const byDate = new Map(days.map((d) => [d.date, d.contributionCount]));
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  const cursor = new Date(`${today}T00:00:00Z`);
  if (!byDate.get(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let current = 0;
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!byDate.get(key)) break;
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return { current, longest };
}

/**
 * Language share across repositories. Each repository contributes
 * sqrt(bytes) per language, which keeps one large or generated codebase
 * (e.g. notebooks with embedded output) from drowning out everything else.
 */
export function languages(repos, { limit = 6, exclude = [] } = {}) {
  const totals = new Map();
  for (const repo of repos) {
    for (const { size, node } of repo.languages?.edges ?? []) {
      if (exclude.includes(node.name) || size <= 0) continue;
      const prev = totals.get(node.name) ?? { name: node.name, color: node.color ?? '#8b949e', score: 0 };
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

export function level(day) {
  if (day.contributionLevel in LEVELS) return LEVELS[day.contributionLevel];
  return day.contributionCount === 0 ? 0 : Math.min(4, Math.ceil(day.contributionCount / 3));
}

export function summarize(user, { today = new Date().toISOString().slice(0, 10), exclude = [] } = {}) {
  const cc = user.contributionsCollection;
  const days = flattenDays(cc.contributionCalendar);
  const repos = user.repositories.nodes;
  return {
    login: user.login,
    generatedAt: today,
    contributions: cc.contributionCalendar.totalContributions,
    commits: cc.totalCommitContributions,
    pullRequests: cc.totalPullRequestContributions,
    issues: cc.totalIssueContributions,
    repositories: user.repositories.totalCount,
    stars: repos.reduce((acc, r) => acc + r.stargazerCount, 0),
    ...streaks(days, today),
    languages: languages(repos, { exclude }),
    weeks: cc.contributionCalendar.weeks.map((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: level(d) })),
    ),
  };
}
