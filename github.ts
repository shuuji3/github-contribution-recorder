import { execSync } from 'child_process';
import { config } from './config.ts';

function isMyActivity(data: any, username: string): boolean {
    const users = [data.author, data.committer, data.user, data.merged_by, data.assignee];
    for (const user of users) {
        if (user && user.login === username) return true;
    }
    return false;
}

function isAfterDate(dateString: string, sinceDate: string): boolean {
    if (!sinceDate) return true;
    const date = new Date(dateString);
    const since = new Date(sinceDate);
    return date >= since;
}

export function fetch(username: string, owner: string, repo: string, endpoint: string, filter: (item: any) => boolean = () => true) {
    const userConfig = config[username];
    if (!userConfig) {
        console.error(`User configuration not found for: ${username}`);
        return [];
    }
    try {
        const items = JSON.parse(execSync(`gh api repos/${owner}/${repo}/${endpoint}?per_page=100`, { encoding: 'utf8' }));
        return items.filter((item: any) => {
            const date = item.created_at || (item.commit && item.commit.author && item.commit.author.date);
            return filter(item) && isMyActivity(item, username) && (date ? isAfterDate(date, userConfig.sinceDate) : true);
        });
    } catch (e) {
        console.error(`Error fetching from repos/${owner}/${repo}/${endpoint}: ${e}`);
        return [];
    }
}

export function getRepos(username: string) {
    const userConfig = config[username];
    if (!userConfig) {
        console.error(`User configuration not found for: ${username}`);
        return [];
    }
    let repos: any[] = [];
    let page = 1;
    while (true) {
        const perPage = 100;
        const output = execSync(`gh api user/repos?sort=updated&per_page=${perPage}&page=${page}`, { encoding: 'utf8' });
        const pageRepos = JSON.parse(output);
        if (pageRepos.length === 0) break;
        repos = repos.concat(pageRepos);
        if (userConfig.maxRepos !== 0 && repos.length >= userConfig.maxRepos) {
            repos = repos.slice(0, userConfig.maxRepos);
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
