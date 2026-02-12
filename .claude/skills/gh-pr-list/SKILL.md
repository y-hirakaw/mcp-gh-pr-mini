---
name: gh-pr-list
description: "List open pull requests in a GitHub repository. Use when the user wants to see PRs, check open pull requests, or browse PRs."
allowed-tools: Bash(python3 *)
---

# gh-pr-list

GitHub リポジトリのオープンな Pull Request を一覧表示するスキル。PR の確認やブラウジングに使用する。

## Usage

```bash
python3 .claude/skills/gh-pr-list/scripts/list_prs.py \
  --owner <owner> \
  --repo <repo> \
  [--limit <number>]
```

## Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--owner` | Yes | - | Repository owner (username or organization) |
| `--repo` | Yes | - | Repository name |
| `--limit` | No | 10 | Maximum number of PRs to return (1-100) |

## Examples

List open PRs with default limit:

```bash
python3 .claude/skills/gh-pr-list/scripts/list_prs.py \
  --owner myorg --repo myrepo
```

List up to 5 open PRs:

```bash
python3 .claude/skills/gh-pr-list/scripts/list_prs.py \
  --owner myorg --repo myrepo \
  --limit 5
```

List all open PRs (up to 100):

```bash
python3 .claude/skills/gh-pr-list/scripts/list_prs.py \
  --owner myorg --repo myrepo \
  --limit 100
```
