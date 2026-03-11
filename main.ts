import Database from 'better-sqlite3';
import { execSync } from 'child_process';

const db = new Database('github-contributions.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS repositories (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    last_synced_at TEXT
  );
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    repo_id TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL,
    raw_data TEXT NOT NULL,
    FOREIGN KEY(repo_id) REFERENCES repositories(id)
  );
`);

const TARGET_USER = 'shuuji3';

function isMyActivity(data: any): boolean {
    if (data.author && data.author.login === TARGET_USER) return true;
    if (data.committer && data.committer.login === TARGET_USER) return true;
    if (data.user && data.user.login === TARGET_USER) return true;
    if (data.merged_by && data.merged_by.login === TARGET_USER) return true;
    if (data.assignee && data.assignee.login === TARGET_USER) return true;
    return false;
}

function saveActivity(repoId: string, type: string, activity: any, id: string, createdAt: string) {
    db.prepare('INSERT OR REPLACE INTO activities (id, repo_id, type, created_at, raw_data) VALUES (?, ?, ?, ?, ?)').run(
        id, repoId, type, createdAt, JSON.stringify(activity)
    );
}

function fetchActivities(owner: string, repo: string, repoId: string) {
  // Fetch Commits
  try {
      const commits = JSON.parse(execSync(`gh api repos/${owner}/${repo}/commits`, { encoding: 'utf8' }));
      for (const commit of commits) {
        if (isMyActivity(commit)) {
            saveActivity(repoId, 'commit', commit, commit.sha, commit.commit.author.date);
        }
      }
  } catch (e) { console.error(`Error fetching commits for ${owner}/${repo}: ${e}`); }

  // Fetch Issues
  try {
      const issues = JSON.parse(execSync(`gh api repos/${owner}/${repo}/issues?state=all`, { encoding: 'utf8' }));
      for (const issue of issues) {
          if (!issue.pull_request && isMyActivity(issue)) {
              saveActivity(repoId, 'issue', issue, issue.node_id, issue.created_at);
          }
      }
  } catch (e) { console.error(`Error fetching issues for ${owner}/${repo}: ${e}`); }

  // Fetch Pull Requests
  try {
      const pulls = JSON.parse(execSync(`gh api repos/${owner}/${repo}/pulls?state=all`, { encoding: 'utf8' }));
      for (const pull of pulls) {
          if (isMyActivity(pull)) {
              saveActivity(repoId, 'pull_request', pull, pull.node_id, pull.created_at);
          }
      }
  } catch (e) { console.error(`Error fetching pulls for ${owner}/${repo}: ${e}`); }

  // Fetch Issue Comments
  try {
      const comments = JSON.parse(execSync(`gh api repos/${owner}/${repo}/issues/comments`, { encoding: 'utf8' }));
      for (const comment of comments) {
          if (isMyActivity(comment)) {
              saveActivity(repoId, 'issue_comment', comment, comment.node_id, comment.created_at);
          }
      }
  } catch (e) { console.error(`Error fetching comments for ${owner}/${repo}: ${e}`); }
}

function getRepos() {
  const output = execSync(`gh api user/repos?sort=updated&per_page=100`, { encoding: 'utf8' });
  const repos = JSON.parse(output);
  return repos.map((repo: any) => ({ id: repo.node_id, fullName: repo.full_name }));
}

const repos = getRepos();

for (const repo of repos) {
  const [owner, name] = repo.fullName.split('/');
  db.prepare('INSERT OR REPLACE INTO repositories (id, full_name, last_synced_at) VALUES (?, ?, ?)').run(
    repo.id, repo.fullName, new Date().toISOString()
  );
  console.log(`Syncing ${repo.fullName}...`);
  fetchActivities(owner, name, repo.id);
}

console.log('Sync complete!');
