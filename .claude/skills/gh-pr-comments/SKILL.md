---
name: gh-pr-comments
description: "Get all comments from a GitHub pull request including both conversation and code review comments. Use when the user wants to read PR comments or review feedback."
allowed-tools: Bash(python3 *)
---

# gh-pr-comments

Retrieve all comments from a GitHub pull request, including both conversation comments and code review comments.

## Command

```bash
python3 .claude/skills/gh-pr-comments/scripts/get_comments.py --owner OWNER --repo REPO --pr-number PR_NUMBER
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--owner` | Yes | Repository owner (username or organization) |
| `--repo` | Yes | Repository name |
| `--pr-number` | Yes | Pull request number |

## Examples

```bash
# Get all comments on a PR
python3 .claude/skills/gh-pr-comments/scripts/get_comments.py --owner octocat --repo hello-world --pr-number 42

# Get comments from an organization repo
python3 .claude/skills/gh-pr-comments/scripts/get_comments.py --owner myorg --repo myrepo --pr-number 15
```
