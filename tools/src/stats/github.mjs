/** Thin GitHub GraphQL client for the stats cards. */

const ENDPOINT = 'https://api.github.com/graphql';

const PROFILE = /* GraphQL */ `
  query ($login: String!, $after: String, $privacy: RepositoryPrivacy) {
    user(login: $login) {
      login
      createdAt
      pullRequests { totalCount }
      issues { totalCount }
      contributionsCollection { contributionYears }
      repositories(first: 100, after: $after, ownerAffiliations: OWNER, isFork: false, privacy: $privacy) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes {
          stargazerCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
    }
  }
`;

const yearsQuery = (years) => /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      ${years
        .map(
          (y) => `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
        totalCommitContributions
        restrictedContributionsCount
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
      }`,
        )
        .join('\n')}
    }
  }
`;

async function request(token, query, variables, attempt = 1) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'readme-stats-cards' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status >= 500 && attempt < 4) {
    await new Promise((done) => setTimeout(done, 2 ** attempt * 1000));
    return request(token, query, variables, attempt + 1);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors) {
    const detail = json.errors?.map((e) => e.message).join('; ') ?? res.statusText;
    throw new Error(`GitHub GraphQL request failed (${res.status}): ${detail}`);
  }
  return json.data;
}

/**
 * Fetches profile totals, owned non-fork repositories and every contribution
 * year. `includePrivate` widens repositories to private ones (needs a PAT).
 */
export async function fetchUser(login, token, { includePrivate = false } = {}) {
  if (!token) throw new Error('A GitHub token is required (set GITHUB_TOKEN).');
  const privacy = includePrivate ? null : 'PUBLIC';
  let after = null;
  let user = null;
  const repos = [];
  do {
    const data = await request(token, PROFILE, { login, after, privacy });
    if (!data.user) throw new Error(`User "${login}" not found.`);
    user ??= data.user;
    repos.push(...data.user.repositories.nodes);
    const { hasNextPage, endCursor } = data.user.repositories.pageInfo;
    after = hasNextPage ? endCursor : null;
  } while (after);
  user.repositories = { totalCount: user.repositories.totalCount, nodes: repos };

  const years = [...user.contributionsCollection.contributionYears].sort();
  const data = years.length ? await request(token, yearsQuery(years), { login }) : { user: {} };
  user.years = years.map((y) => ({ year: y, ...data.user[`y${y}`] }));
  return user;
}
