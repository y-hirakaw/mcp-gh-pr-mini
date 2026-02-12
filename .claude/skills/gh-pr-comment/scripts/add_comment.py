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
            input=stdin_data,
        )
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr.strip()}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Add a general comment to a GitHub pull request")
    parser.add_argument("--owner", required=True, help="Repository owner (username or organization)")
    parser.add_argument("--repo", required=True, help="Repository name")
    parser.add_argument("--pr-number", required=True, help="Pull request number")
    parser.add_argument("--body", required=True, help="Comment body text")
    args = parser.parse_args()

    prefixed_body = f"[AI] Generated using MCP\n\n{args.body}"

    response = run_gh_api(
        f"/repos/{args.owner}/{args.repo}/issues/{args.pr_number}/comments",
        method="POST",
        input_data={"body": prefixed_body},
    )

    if isinstance(response, dict) and "html_url" in response:
        print(f"Comment added successfully: {response['html_url']}")
    else:
        print("Comment added successfully.")


if __name__ == "__main__":
    main()
