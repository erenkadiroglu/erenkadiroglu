// Produces a deterministic, obviously synthetic GraphQL payload for tests and previews.
import { writeFileSync } from 'node:fs';
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const years = [];
for (const year of [2025, 2026]) {
  const weeks = [];
  let total = 0;
  let week = [];
  for (let d = new Date(`${year}-01-01T00:00:00Z`); d.getUTCFullYear() === year; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    // last 9 days are active so the fixture has a live streak
    const forced = date >= '2026-10-27' && date <= '2026-11-04';
    const count = date > '2026-11-04' ? 0 : forced ? 3 : rand() > 0.55 ? Math.floor(rand() * 9) + 1 : 0;
    total += count;
    week.push({ date, contributionCount: count });
    if (d.getUTCDay() === 6) {
      weeks.push({ contributionDays: week });
      week = [];
    }
  }
  if (week.length) weeks.push({ contributionDays: week });
  years.push({ year, totalCommitContributions: Math.round(total * 0.8), restrictedContributionsCount: 0, contributionCalendar: { totalContributions: total, weeks } });
}
const lang = (name, color, size) => ({ size, node: { name, color } });
const user = {
  login: 'octo-fixture',
  createdAt: '2024-01-01T00:00:00Z',
  pullRequests: { totalCount: 12 },
  issues: { totalCount: 5 },
  contributionsCollection: { contributionYears: [2026, 2025] },
  repositories: {
    totalCount: 4,
    nodes: [
      { stargazerCount: 3, languages: { edges: [lang('TypeScript', '#3178c6', 420000), lang('Python', '#3572A5', 60000)] } },
      { stargazerCount: 1, languages: { edges: [lang('C', '#555555', 12000)] } },
      { stargazerCount: 1, languages: { edges: [lang('Jupyter Notebook', '#DA5B0B', 900000), lang('Python', '#3572A5', 4000)] } },
      { stargazerCount: 0, languages: { edges: [lang('JavaScript', '#f1e05a', 90000), lang('CSS', '#663399', 30000), lang('HTML', '#e34c26', 20000), lang('Kotlin', '#A97BFF', 20000), lang('Java', '#b07219', 8000)] } },
    ],
  },
  years,
};
writeFileSync(new URL('./user.json', import.meta.url), JSON.stringify(user) + '\n');
console.log('totals', years.map((y) => y.contributionCalendar.totalContributions));
