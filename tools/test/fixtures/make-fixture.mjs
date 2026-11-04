// Produces a deterministic, obviously synthetic GraphQL payload for tests and previews.
import { writeFileSync } from 'node:fs';
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const end = new Date('2026-11-04T00:00:00Z');
const start = new Date(end);
start.setUTCDate(start.getUTCDate() - 364 - start.getUTCDay());
const weeks = [];
let total = 0;
for (const d = new Date(start); d <= end; ) {
  const contributionDays = [];
  for (let i = 0; i < 7 && d <= end; i++) {
    const n = rand();
    const count = n > 0.55 ? Math.floor(rand() * 9) + 1 : 0;
    total += count;
    const contributionLevel = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'][count === 0 ? 0 : Math.min(4, Math.ceil(count / 2.5))];
    contributionDays.push({ date: d.toISOString().slice(0, 10), contributionCount: count, contributionLevel });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  weeks.push({ contributionDays });
}
const lang = (name, color, size) => ({ size, node: { name, color } });
const user = {
  login: 'octo-fixture',
  createdAt: '2024-01-01T00:00:00Z',
  followers: { totalCount: 10 },
  contributionsCollection: {
    totalCommitContributions: Math.round(total * 0.8),
    totalPullRequestContributions: 12,
    totalIssueContributions: 5,
    restrictedContributionsCount: 0,
    contributionCalendar: { totalContributions: total, weeks },
  },
  repositories: {
    totalCount: 4,
    pageInfo: { hasNextPage: false, endCursor: null },
    nodes: [
      { name: 'mobile-app', stargazerCount: 3, languages: { edges: [lang('Kotlin', '#A97BFF', 180000), lang('PHP', '#4F5D95', 42000)] } },
      { name: 'game', stargazerCount: 1, languages: { edges: [lang('C', '#555555', 12000)] } },
      { name: 'notebooks', stargazerCount: 1, languages: { edges: [lang('Jupyter Notebook', '#DA5B0B', 900000), lang('Python', '#3572A5', 4000)] } },
      { name: 'site', stargazerCount: 0, languages: { edges: [lang('HTML', '#e34c26', 30000), lang('CSS', '#663399', 9000), lang('C#', '#178600', 7000), lang('TSQL', '#e38c00', 3000)] } },
    ],
  },
};
writeFileSync(new URL('./user.json', import.meta.url), JSON.stringify(user, null, 1) + '\n');
console.log('total', total);
