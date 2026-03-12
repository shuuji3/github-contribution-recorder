import { execSync } from 'child_process'

const username = process.argv[2]
if (!username) {
  console.error('Usage: node sync-and-commit.ts <username>')
  process.exit(1)
}

console.log(`--- Step 1: Syncing from GitHub for ${username} ---`)
execSync(`node main.ts ${username}`, { stdio: 'inherit' })

console.log('\n--- Step 2: Generating new JSON records ---')
execSync(`node generate-records.ts ${username}`, { stdio: 'inherit' })

console.log('\n--- Step 3: Committing new records ---')
execSync('node commit-new-records.ts', { stdio: 'inherit' })

console.log('\nSync and Commit complete! ✨')
