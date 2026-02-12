---
name: gh-pr-update
description: "Update an existing GitHub pull request. Use when the user wants to modify a PR's title, description, state, or base branch."
allowed-tools: Bash(python3 *)
---

# gh-pr-update

既存の GitHub Pull Request を更新するスキル。タイトル、説明、ステート、ベースブランチの変更に使用する。

## Usage

```bash
python3 .claude/skills/gh-pr-update/scripts/update_pr.py \
  --owner <owner> \
  --repo <repo> \
  --pr-number <number> \
  [--title <title>] \
  [--body <body>] \
  [--state open|closed] \
  [--base <base-branch>]
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--owner` | Yes | Repository owner (username or organization) |
| `--repo` | Yes | Repository name |
| `--pr-number` | Yes | Pull request number to update |
| `--title` | No | New title for the pull request |
| `--body` | No | New description body for the pull request |
| `--state` | No | New state: `open` or `closed` |
| `--base` | No | New base branch name |

At least one of `--title`, `--body`, `--state`, or `--base` must be provided.

## Examples

Update the title of a PR:

```bash
python3 .claude/skills/gh-pr-update/scripts/update_pr.py \
  --owner myorg --repo myrepo \
  --pr-number 42 \
  --title "feat: improved user authentication"
```

Close a PR:

```bash
python3 .claude/skills/gh-pr-update/scripts/update_pr.py \
  --owner myorg --repo myrepo \
  --pr-number 42 \
  --state closed
```

Update multiple fields at once:

```bash
python3 .claude/skills/gh-pr-update/scripts/update_pr.py \
  --owner myorg --repo myrepo \
  --pr-number 42 \
  --title "Updated title" \
  --body "Updated description with more detail" \
  --base develop
```
