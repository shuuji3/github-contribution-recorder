import { execSync } from 'child_process';
import { config } from './config.js';

function isMyActivity(data: any): boolean {
    const users = [data.author, data.committer, data.user, data.merged_by, data.assignee];
    for (const user of users) {
        if (user && user.login === config.targetUser) return true;
    }
    return false;
}

function isAfterDate(dateString: string): boolean {
    if (!config.sinceDate) return true;
    const date = new Date(dateString);
    const since = new Date(config.sinceDate);
    return date >= since;
}

export function fetch(owner: string, repo: string, endpoint: string, filter: (item: any) => boolean = () => true) {
    try {
        const items = JSON.parse(execSync(`gh api repos/${owner}/${repo}/${endpoint}?per_page=100`, { encoding: 'utf8' }));
        return items.filter((item: any) => {
            const date = item.created_at || (item.commit && item.commit.author && item.commit.author.date);
            return filter(item) && isMyActivity(item) && (date ? isAfterDate(date) : true);
        });
    } catch (e) {
        console.error(`Error fetching from repos/${owner}/${repo}/${endpoint}: ${e}`);
        return [];
    }
}

export function getRepos() {
    let repos: any[] = [];
    let page = 1;
    while (true) {
        const perPage = 100;
        const output = execSync(`gh api user/repos?sort=updated&per_page=${perPage}&page=${page}`, { encoding: 'utf8' });
        const pageRepos = JSON.parse(output);
        if (pageRepos.length === 0) break;
        repos = repos.concat(pageRepos);
        if (config.maxRepos !== 0 && repos.length >= config.maxRepos) {
            repos = repos.slice(0, config.maxRepos);
            break;
        }
        if (pageRepos.length < perPage) break;
        page++;
    }
    const result = [];
    for (const repo of repos) {
        result.push({ id: repo.node_id, fullName: repo.full_name });
    }
    return result;
}
