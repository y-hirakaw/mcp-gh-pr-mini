---
name: gh-pr-diff
description: "Get the unified diff for a GitHub pull request. Use when the user wants to see code changes, review a diff, or understand what changed in a PR."
allowed-tools: Bash(python3 *)
---

# gh-pr-diff

Retrieve the unified diff for a GitHub pull request, showing all code changes in standard diff format.

## Command

```bash
python3 .claude/skills/gh-pr-diff/scripts/get_diff.py --owner OWNER --repo REPO --pr-number PR_NUMBER
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--owner` | Yes | Repository owner (username or organization) |
| `--repo` | Yes | Repository name |
| `--pr-number` | Yes | Pull request number |

## Usage Examples

```bash
# Get diff for PR #42 in octocat/hello-world
python3 .claude/skills/gh-pr-diff/scripts/get_diff.py --owner octocat --repo hello-world --pr-number 42

# Get diff for a PR in the current project
python3 .claude/skills/gh-pr-diff/scripts/get_diff.py --owner my-org --repo my-repo --pr-number 123
```
