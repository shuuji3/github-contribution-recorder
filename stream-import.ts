import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { config } from './config.ts'

const author = config.recordAuthor

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath)
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file)
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles)
    } else if (file.endsWith('.json')) {
      arrayOfFiles.push(fullPath)
    }
  })
  return arrayOfFiles
}

const files = getAllFiles('records').sort()

const git = spawn('git', ['-C', 'records', 'fast-import'])

git.stdout.on('data', (data) => console.log(`git: ${data}`))
git.stderr.on('data', (data) => console.error(`git error: ${data}`))

git.on('close', (code) => {
  console.log(`fast-import exited with code ${code}`)
})

let commitCount = 0
for (const file of files) {
  const filename = path.basename(file)
  // filename format: YYYY-MM-DD-HHmmss-repo-type-slug.json
  const parts = filename.split('-')
  const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`
  const timePart = parts[3]
  const timeStr = `${timePart.substring(0, 2)}:${timePart.substring(2, 4)}:${timePart.substring(4, 6)}`
  const timestamp = Math.floor(new Date(`${dateStr}T${timeStr}Z`).getTime() / 1000)

  const content = fs.readFileSync(file, 'utf8')
  const relativePath = path.relative('records', file)

  const streamData =
    `commit refs/heads/main\n` +
    `committer ${author.name} <${author.email}> ${timestamp} +0000\n` +
    `data <<EOF\nRecord activity: ${filename}\nEOF\n` +
    `M 100644 inline ${relativePath}\n` +
    `data ${Buffer.byteLength(content)}\n` +
    `${content}\n`

  git.stdin.write(streamData)
  commitCount++
}
git.stdin.end()
console.log(`Streamed ${commitCount} commits to git fast-import.`)
