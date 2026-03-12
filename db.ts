import Database from 'better-sqlite3'

const db = new Database('github-contributions.db')

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
    username TEXT,
    html_url TEXT,
    raw_data TEXT NOT NULL,
    FOREIGN KEY(repo_id) REFERENCES repositories(id)
  );
`)

export function saveActivity(
  repoId: string,
  type: string,
  activity: any,
  id: string,
  createdAt: string,
  username: string,
  htmlUrl: string
) {
  db.prepare(
    'INSERT OR REPLACE INTO activities (id, repo_id, type, created_at, username, html_url, raw_data) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, repoId, type, createdAt, username, htmlUrl, JSON.stringify(activity))
}

export function saveRepository(id: string, fullName: string) {
  db.prepare(
    'INSERT OR REPLACE INTO repositories (id, full_name, last_synced_at) VALUES (?, ?, ?)'
  ).run(id, fullName, new Date().toISOString())
}
