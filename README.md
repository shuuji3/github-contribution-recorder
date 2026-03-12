# 📹 github-contribution-recorder

A tool to record GitHub activities (commits, issues, PRs, comments) into a local SQLite database.

## Setup

```shell
pnpm i
cp config.ts.sample config.ts
```

Edit `config.ts` with your desired GitHub username and synchronization preferences.

## Usage

```shell
node main.ts --help

Usage: node main.ts <username>
Available users: shuuji3
```
