import { getRepos, fetch } from './github.ts';
import { saveActivity, saveRepository } from './db.ts';

const repos = getRepos();

for (const repo of repos) {
    const [owner, name] = repo.fullName.split('/');
    saveRepository(repo.id, repo.fullName);
    console.log(`Syncing ${repo.fullName}...`);

    const commits = fetch(owner, name, 'commits');
    for (const commit of commits) {
        saveActivity(repo.id, 'commit', commit, commit.sha, commit.commit.author.date);
    }
    const issues = fetch(owner, name, 'issues?state=all', (i: any) => !i.pull_request);
    for (const issue of issues) {
        saveActivity(repo.id, 'issue', issue, issue.node_id, issue.created_at);
    }
    const prs = fetch(owner, name, 'pulls?state=all');
    for (const pr of prs) {
        saveActivity(repo.id, 'pull_request', pr, pr.node_id, pr.created_at);
    }
    const comments = fetch(owner, name, 'issues/comments');
    for (const comment of comments) {
        saveActivity(repo.id, 'issue_comment', comment, comment.node_id, comment.created_at);
    }
}

console.log('Sync complete!');
