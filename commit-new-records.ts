import { execSync } from 'child_process'
import * as path from 'path'
import { config } from './config.ts'

const { recordAuthor } = config

// Get untracked files in records directory
const untrackedFiles = execSync('git -C records ls-files --others --exclude-standard', {
  encoding: 'utf8',
})
  .split('\n')
  .filter((f) => f.endsWith('.json'))

for (const file of untrackedFiles) {
  const fullPath = path.join('records', file)
  const filename = path.basename(file)

  // filename format: YYYY-MM-DD-HHmmss-repo-type-slug.json
  const parts = filename.split('-')
  const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`
  const timePart = parts[3]
  const timeStr = `${timePart.substring(0, 2)}:${timePart.substring(2, 4)}:${timePart.substring(4, 6)}`
  const timestamp = `${dateStr}T${timeStr}Z`

  const env = { ...process.env, GIT_AUTHOR_DATE: timestamp, GIT_COMMITTER_DATE: timestamp }

  execSync(`git -C records add "${file}"`)
  execSync(
    `git -C records commit --author="${recordAuthor.name} <${recordAuthor.email}>" -m "Record activity: ${filename}"`,
    { env }
  )
  console.log(`Committed: ${filename} at ${timestamp}`)
}
