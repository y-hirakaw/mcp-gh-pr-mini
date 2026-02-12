---
name: gh-pr-changes
description: "Get file changes from a GitHub pull request with commentable positions. Use when reviewing code and need to know where to place review comments."
allowed-tools: Bash(python3 *)
---

# gh-pr-changes

Get file changes from a GitHub pull request with calculated commentable positions. Parses the diff patches to determine valid position numbers for placing review comments.

## Command

```bash
python3 .claude/skills/gh-pr-changes/scripts/get_changes.py --owner OWNER --repo REPO --pr-number PR_NUMBER
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--owner` | Yes | Repository owner (username or organization) |
| `--repo` | Yes | Repository name |
| `--pr-number` | Yes | Pull request number |

## Examples

Get changes for a pull request:
```bash
python3 .claude/skills/gh-pr-changes/scripts/get_changes.py --owner octocat --repo hello-world --pr-number 42
```

## Output Format

For each changed file, the output includes:
- **File**: the file path
- **Status**: added, modified, removed, renamed, etc.
- **Changes**: additions/deletions/total line counts
- **Comment Positions**: valid diff positions where review comments can be placed (added lines only)
- **Patch**: the full diff patch content
