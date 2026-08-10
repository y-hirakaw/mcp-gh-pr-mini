---
name: gh-pr-review-comment
description: "Add a review comment to a specific line in a GitHub pull request. Use when the user wants to comment on specific code in a PR diff."
allowed-tools: Bash(python3 *)
---

# gh-pr-review-comment

Add a review comment to a specific line in a GitHub pull request diff. The comment is automatically prefixed with an AI identifier. Prefer `--line` (the actual file line number) over the deprecated `--position` (an offset within the diff) - `--position` requires re-counting diff hunks and is error-prone.

## Command

```bash
python3 .claude/skills/gh-pr-review-comment/scripts/add_review_comment.py --owner OWNER --repo REPO --pr-number PR_NUMBER --body "COMMENT" --path FILE_PATH --line LINE
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--owner` | Yes | Repository owner (username or organization) |
| `--repo` | Yes | Repository name |
| `--pr-number` | Yes | Pull request number |
| `--body` | Yes | Comment content (will be prefixed with "[AI] Generated using MCP") |
| `--path` | Yes | Relative path to the file being commented on |
| `--line` | One of `--line`/`--position` (unless `--subject-type file`) | File line number to comment on (preferred) |
| `--side` | No | Which side of the diff `--line` refers to: `LEFT` (old) or `RIGHT` (new). Default: `RIGHT` |
| `--start-line` | No | First line of a multi-line comment range (used together with `--line` as the last line) |
| `--start-side` | No | Which side of the diff `--start-line` refers to. Default: same as `--side` |
| `--subject-type` | No | Set to `file` for a file-level comment when the target line falls outside the diff hunk (omits line/position) |
| `--position` | One of `--line`/`--position` (unless `--subject-type file`) | [Deprecated] Position in the diff where the comment should be placed (use gh-pr-changes skill to find valid positions) |

`--line` and `--position` are mutually exclusive.

## Examples

Add a review comment on a specific file line (preferred):
```bash
python3 .claude/skills/gh-pr-review-comment/scripts/add_review_comment.py --owner octocat --repo hello-world --pr-number 42 --body "Consider using a constant here instead of a magic number." --path src/utils.ts --line 124
```

Add a multi-line review comment:
```bash
python3 .claude/skills/gh-pr-review-comment/scripts/add_review_comment.py --owner octocat --repo hello-world --pr-number 42 --body "This whole block should handle the null case." --path src/api/handler.ts --start-line 10 --line 15
```

Add a file-level comment when the target line is outside the diff hunk:
```bash
python3 .claude/skills/gh-pr-review-comment/scripts/add_review_comment.py --owner octocat --repo hello-world --pr-number 42 --body "This file is missing tests." --path src/api/handler.ts --subject-type file
```

Add a review comment using the deprecated diff position:
```bash
python3 .claude/skills/gh-pr-review-comment/scripts/add_review_comment.py --owner octocat --repo hello-world --pr-number 42 --body "This function should handle the null case." --path src/api/handler.ts --position 12
```
