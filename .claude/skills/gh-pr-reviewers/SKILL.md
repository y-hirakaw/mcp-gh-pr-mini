---
name: gh-pr-reviewers
description: "Request reviewers for a GitHub pull request. Use when the user wants to add reviewers to a PR or request a code review."
allowed-tools: Bash(python3 *)
---

# gh-pr-reviewers

Request reviewers for a GitHub pull request. Adds one or more GitHub users as requested reviewers on a specified PR.

## Command

```bash
python3 .claude/skills/gh-pr-reviewers/scripts/request_reviewers.py --owner OWNER --repo REPO --pr-number PR_NUMBER --reviewers USER1,USER2
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--owner` | Yes | Repository owner (username or organization) |
| `--repo` | Yes | Repository name |
| `--pr-number` | Yes | Pull request number |
| `--reviewers` | Yes | Comma-separated list of GitHub usernames to request as reviewers |

## Examples

Request a single reviewer:
```bash
python3 .claude/skills/gh-pr-reviewers/scripts/request_reviewers.py --owner octocat --repo hello-world --pr-number 42 --reviewers alice
```

Request multiple reviewers:
```bash
python3 .claude/skills/gh-pr-reviewers/scripts/request_reviewers.py --owner octocat --repo hello-world --pr-number 42 --reviewers alice,bob,charlie
```
