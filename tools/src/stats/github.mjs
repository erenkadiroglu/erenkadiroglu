/** Thin GitHub GraphQL client. Only public data is requested. */

const ENDPOINT = 'https://api.github.com/graphql';

const QUERY = /* GraphQL */ `
  query ($login: String!, $after: String) {
    user(login: $login) {
      login
      createdAt
      followers { totalCount }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date contributionCount contributionLevel }
          }
        }
      }
      repositories(first: 100, after: $after, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes {
          name
          stargazerCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
    }
  }
`;

async function request(token, variables, attempt = 1) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'readme-activity-card',
    },
    body: JSON.stringify({ query: QUERY, variables }),
  });
  if (res.status >= 500 && attempt < 4) {
    await new Promise((done) => setTimeout(done, 2 ** attempt * 1000));
    return request(token, variables, attempt + 1);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors) {
    const detail = json.errors?.map((e) => e.message).join('; ') ?? res.statusText;
    throw new Error(`GitHub GraphQL request failed (${res.status}): ${detail}`);
  }
  return json.data;
}

/** Fetches the user and every public, non-fork repository they own. */
export async function fetchUser(login, token) {
  if (!token) throw new Error('A GitHub token is required (set GITHUB_TOKEN).');
  let after = null;
  let user = null;
  const repos = [];
  do {
    const data = await request(token, { login, after });
    if (!data.user) throw new Error(`User "${login}" not found.`);
    user ??= data.user;
    repos.push(...data.user.repositories.nodes);
    const { hasNextPage, endCursor } = data.user.repositories.pageInfo;
    after = hasNextPage ? endCursor : null;
  } while (after);
  user.repositories = { ...user.repositories, nodes: repos };
  return user;
}
