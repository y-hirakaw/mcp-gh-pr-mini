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


def main():
    parser = argparse.ArgumentParser(description="Add a review comment to a specific line in a GitHub pull request")
    parser.add_argument("--owner", required=True, help="Repository owner (username or organization)")
    parser.add_argument("--repo", required=True, help="Repository name")
    parser.add_argument("--pr-number", required=True, type=int, help="Pull request number")
    parser.add_argument("--body", required=True, help="Comment content")
    parser.add_argument("--path", required=True, help="Relative path to the file to comment on")
    parser.add_argument("--position", required=True, type=int, help="Position in the diff where the comment should be placed")
    args = parser.parse_args()

    # Step 1: Get the head commit SHA from the PR
    pr_endpoint = f"/repos/{args.owner}/{args.repo}/pulls/{args.pr_number}"
    pr_data = run_gh_api(pr_endpoint)
    commit_sha = pr_data["head"]["sha"]

    # Step 2: Post the review comment with AI prefix
    comment_body = f"[AI] Generated using MCP\n\n{args.body}"
    comment_endpoint = f"/repos/{args.owner}/{args.repo}/pulls/{args.pr_number}/comments"
    input_data = {
        "body": comment_body,
        "commit_id": commit_sha,
        "path": args.path,
        "position": args.position
    }

    response = run_gh_api(comment_endpoint, method="POST", input_data=input_data)

    comment_url = response.get("html_url", "N/A")
    comment_id = response.get("id", "N/A")

    print(f"Review comment added to {args.owner}/{args.repo}#{args.pr_number}")
    print(f"  File: {args.path}")
    print(f"  Position: {args.position}")
    print(f"  Comment ID: {comment_id}")
    print(f"  URL: {comment_url}")


if __name__ == "__main__":
    main()
