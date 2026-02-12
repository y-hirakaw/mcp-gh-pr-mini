---
name: gh-pr-comment
description: "Add a general comment to a GitHub pull request. Use when the user wants to post a comment on a PR conversation."
allowed-tools: Bash(python3 *)
---

# gh-pr-comment

Add a general comment to a GitHub pull request conversation thread.

## Command

```bash
python3 .claude/skills/gh-pr-comment/scripts/add_comment.py --owner OWNER --repo REPO --pr-number PR_NUMBER --body "COMMENT_TEXT"
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--owner` | Yes | Repository owner (username or organization) |
| `--repo` | Yes | Repository name |
| `--pr-number` | Yes | Pull request number |
| `--body` | Yes | Comment body text to post |

Note: The comment body is automatically prefixed with `[AI] Generated using MCP` to identify AI-generated comments.

## Examples

```bash
# Add a simple comment
python3 .claude/skills/gh-pr-comment/scripts/add_comment.py --owner octocat --repo hello-world --pr-number 42 --body "LGTM! The changes look good."

# Add a multi-line comment
python3 .claude/skills/gh-pr-comment/scripts/add_comment.py --owner myorg --repo myrepo --pr-number 15 --body "Great work on this PR.\n\nA few minor suggestions:\n- Consider adding tests\n- Update the README"
```
