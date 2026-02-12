---
name: gh-pr-review-comment
description: "Add a review comment to a specific line in a GitHub pull request. Use when the user wants to comment on specific code in a PR diff."
allowed-tools: Bash(python3 *)
---

# gh-pr-review-comment

Add a review comment to a specific line in a GitHub pull request diff. The comment is placed at a specific position in the diff and automatically prefixed with an AI identifier.

## Command

```bash
python3 .claude/skills/gh-pr-review-comment/scripts/add_review_comment.py --owner OWNER --repo REPO --pr-number PR_NUMBER --body "COMMENT" --path FILE_PATH --position POSITION
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--owner` | Yes | Repository owner (username or organization) |
| `--repo` | Yes | Repository name |
| `--pr-number` | Yes | Pull request number |
| `--body` | Yes | Comment content (will be prefixed with "[AI] Generated using MCP") |
| `--path` | Yes | Relative path to the file being commented on |
| `--position` | Yes | Position in the diff where the comment should be placed (use gh-pr-changes skill to find valid positions) |

## Examples

Add a review comment on a specific line:
```bash
python3 .claude/skills/gh-pr-review-comment/scripts/add_review_comment.py --owner octocat --repo hello-world --pr-number 42 --body "Consider using a constant here instead of a magic number." --path src/utils.ts --position 5
```

Add a review comment suggesting a fix:
```bash
python3 .claude/skills/gh-pr-review-comment/scripts/add_review_comment.py --owner octocat --repo hello-world --pr-number 42 --body "This function should handle the null case." --path src/api/handler.ts --position 12
```
