import { getRepos, fetch } from './github.ts'
import { saveActivity, saveRepository } from './db.ts'
import { config } from './config.ts'

const username = process.argv[2]
if (username === '--help' || !username || !config[username]) {
  console.log(`Usage: node main.ts <username>`)
  console.log(`Available users: ${Object.keys(config).join(', ')}`)
  process.exit(0)
}

const repos = getRepos(username)

for (const repo of repos) {
  const [owner, name] = repo.fullName.split('/')
  saveRepository(repo.id, repo.fullName)
  console.log(`Syncing ${repo.fullName}...`)

  const commits = fetch(username, owner, name, 'commits', () => true)
  for (const commit of commits) {
    saveActivity(
      repo.id,
      'commit',
      commit,
      commit.sha,
      commit.commit.author.date,
      username,
      commit.html_url
    )
  }
  const issues = fetch(username, owner, name, 'issues?state=all', (i: any) => !i.pull_request)
  for (const issue of issues) {
    saveActivity(repo.id, 'issue', issue, issue.node_id, issue.created_at, username, issue.html_url)
  }
  const prs = fetch(username, owner, name, 'pulls?state=all', () => true)
  for (const pr of prs) {
    saveActivity(repo.id, 'pull_request', pr, pr.node_id, pr.created_at, username, pr.html_url)
  }
  const comments = fetch(username, owner, name, 'issues/comments', () => true)
  for (const comment of comments) {
    saveActivity(
      repo.id,
      'issue_comment',
      comment,
      comment.node_id,
      comment.created_at,
      username,
      comment.html_url
    )
  }
}

console.log('Sync complete!')
