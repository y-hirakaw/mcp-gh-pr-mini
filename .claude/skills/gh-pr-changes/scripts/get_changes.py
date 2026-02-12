#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys


def run_gh_api(endpoint, method="GET", input_data=None, headers=None):
    """Execute gh api command and return parsed output."""
    cmd = ["gh", "api", endpoint, "--method", method]
    if headers:
        for h in headers:
            cmd.extend(["--header", h])

    stdin_data = None
    if input_data is not None:
        cmd.extend(["--input", "-"])
        stdin_data = json.dumps(input_data)

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
            input=stdin_data
        )
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr.strip()}", file=sys.stderr)
        sys.exit(1)


def calculate_commentable_positions(patch):
    """Parse a diff patch and return positions of added lines (commentable).

    Position is 1-indexed, incrementing for each line in the patch.
    Lines starting with '+' (but not '+++') are commentable.
    """
    if not patch:
        return []

    commentable = []
    lines = patch.split("\n")
    for position, line in enumerate(lines, start=1):
        if line.startswith("+") and not line.startswith("+++"):
            commentable.append(position)
    return commentable


def main():
    parser = argparse.ArgumentParser(description="Get file changes from a GitHub pull request with commentable positions")
    parser.add_argument("--owner", required=True, help="Repository owner (username or organization)")
    parser.add_argument("--repo", required=True, help="Repository name")
    parser.add_argument("--pr-number", required=True, type=int, help="Pull request number")
    args = parser.parse_args()

    endpoint = f"/repos/{args.owner}/{args.repo}/pulls/{args.pr_number}/files"
    files = run_gh_api(endpoint)

    if not files:
        print("No file changes found in this pull request.")
        sys.exit(0)

    for file_info in files:
        filename = file_info.get("filename", "unknown")
        status = file_info.get("status", "unknown")
        additions = file_info.get("additions", 0)
        deletions = file_info.get("deletions", 0)
        changes = file_info.get("changes", 0)
        patch = file_info.get("patch", "")

        commentable_positions = calculate_commentable_positions(patch)
        positions_str = ", ".join(str(p) for p in commentable_positions) if commentable_positions else "none"

        print(f"File: {filename}")
        print(f"Status: {status}")
        print(f"Changes: +{additions}/-{deletions} (total: {changes})")
        print(f"Comment Positions: {positions_str}")
        if patch:
            print("Patch:")
            print(patch)
        print("---")


if __name__ == "__main__":
    main()
