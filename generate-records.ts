import Database from 'better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'

const db = new Database('github-contributions.db', { readonly: true })

function toKebabCase(str: string): string {
  if (!str) return 'no-title'
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 80)
}

const repos = db.prepare('SELECT id, full_name FROM repositories').all() as {
  id: string
  full_name: string
}[]
const repoMap = new Map(repos.map((r) => [r.id, r.full_name]))

const username = 'shuuji3'
const activities = db.prepare('SELECT * FROM activities WHERE username = ?').all(username)


for (const activity of activities) {
  const data = JSON.parse(activity.raw_data)
  const date = new Date(activity.created_at)
  const year = date.getFullYear().toString()
  const dateStr = date.toISOString().split('T')[0]
  const timeStr = date.toISOString().split('T')[1].split('.')[0].replace(/:/g, '') // 6桁の時刻 (HHmmss)

  const repoFullName = repoMap.get(activity.repo_id) || 'unknown-repo'
  const repoName = repoFullName.split('/')[1] || repoFullName

  let slug = ''
  if (activity.type === 'commit') slug = data.commit ? data.commit.message : 'no-message'
  else if (activity.type === 'issue' || activity.type === 'pull_request') slug = data.title
  else if (activity.type === 'issue_comment')
    slug = data.body ? data.body.substring(0, 50) : 'comment'
  else slug = 'activity'

  const filename = `${dateStr}-${timeStr}-${repoName}-${activity.type}-${toKebabCase(slug)}.json`
  const dirPath = path.join('records', username, year)

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  fs.writeFileSync(path.join(dirPath, filename), JSON.stringify(data, null, 2))
  console.log(`Generated: ${path.join(dirPath, filename)}`)
}

db.close()
