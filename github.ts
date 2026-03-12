import { execSync } from 'child_process';

const TARGET_USER = 'shuuji3';

function isMyActivity(data: any): boolean {
    const users = [data.author, data.committer, data.user, data.merged_by, data.assignee];
    for (const user of users) {
        if (user && user.login === TARGET_USER) return true;
    }
    return false;
}

export function fetch(owner: string, repo: string, endpoint: string, filter: (item: any) => boolean = () => true) {
    try {
        const items = JSON.parse(execSync(`gh api repos/${owner}/${repo}/${endpoint}`, { encoding: 'utf8' }));
        return items.filter((item: any) => filter(item) && isMyActivity(item));
    } catch (e) {
        console.error(`Error fetching from repos/${owner}/${repo}/${endpoint}: ${e}`);
        return [];
    }
}

export function getRepos() {
    const output = execSync(`gh api user/repos?sort=updated&per_page=100`, { encoding: 'utf8' });
    const repos = JSON.parse(output);
    const result = [];
    for (const repo of repos) {
        result.push({ id: repo.node_id, fullName: repo.full_name });
    }
    return result;
}
