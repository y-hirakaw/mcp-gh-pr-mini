---
name: gh-pr-create
description: "Create a new GitHub pull request. Use when the user wants to create a PR, open a pull request, or submit changes for review."
allowed-tools: Bash(python3 *)
---

# gh-pr-create

GitHub Pull Request を新規作成するスキル。現在のブランチの変更をレビューに提出する際に使用する。

## Usage

```bash
python3 .claude/skills/gh-pr-create/scripts/create_pr.py \
  --owner <owner> \
  --repo <repo> \
  --title <title> \
  --body <body> \
  --head <head-branch> \
  --base <base-branch> \
  [--draft]
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--owner` | Yes | Repository owner (username or organization) |
| `--repo` | Yes | Repository name |
| `--title` | Yes | Pull request title |
| `--body` | Yes | Pull request description body |
| `--head` | Yes | Branch containing the changes |
| `--base` | Yes | Branch to merge changes into |
| `--draft` | No | Create as a draft pull request (flag, no value needed) |

## Examples

Create a standard PR:

```bash
python3 .claude/skills/gh-pr-create/scripts/create_pr.py \
  --owner myorg --repo myrepo \
  --title "Add user authentication" \
  --body "Implements JWT-based authentication flow" \
  --head feature/auth --base main
```

Create a draft PR:

```bash
python3 .claude/skills/gh-pr-create/scripts/create_pr.py \
  --owner myorg --repo myrepo \
  --title "WIP: Refactor database layer" \
  --body "Work in progress - refactoring database connections" \
  --head refactor/db --base main \
  --draft
```
