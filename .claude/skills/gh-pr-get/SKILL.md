---
name: gh-pr-get
description: "Get detailed information about a specific GitHub pull request. Use when the user wants to see PR details, check PR status, or view PR metadata."
allowed-tools: Bash(python3 *)
---

# gh-pr-get

Retrieve detailed information about a specific GitHub pull request, including title, state, author, branches, and description.

## Command

```bash
python3 .claude/skills/gh-pr-get/scripts/get_pr.py --owner OWNER --repo REPO --pr-number PR_NUMBER
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--owner` | Yes | Repository owner (username or organization) |
| `--repo` | Yes | Repository name |
| `--pr-number` | Yes | Pull request number |

## Usage Examples

```bash
# Get details for PR #42 in octocat/hello-world
python3 .claude/skills/gh-pr-get/scripts/get_pr.py --owner octocat --repo hello-world --pr-number 42

# Get details for a PR in the current project
python3 .claude/skills/gh-pr-get/scripts/get_pr.py --owner my-org --repo my-repo --pr-number 123
```
