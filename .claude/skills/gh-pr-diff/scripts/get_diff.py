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
    parser = argparse.ArgumentParser(description="Get the unified diff for a GitHub pull request")
    parser.add_argument("--owner", required=True, help="Repository owner (username or organization)")
    parser.add_argument("--repo", required=True, help="Repository name")
    parser.add_argument("--pr-number", required=True, type=int, help="Pull request number")
    args = parser.parse_args()

    endpoint = f"/repos/{args.owner}/{args.repo}/pulls/{args.pr_number}"
    diff = run_gh_api(endpoint, headers=["Accept: application/vnd.github.v3.diff"])

    if not diff or (isinstance(diff, str) and diff.strip() == ""):
        print("(No changes found in this pull request)")
    else:
        print(diff if isinstance(diff, str) else json.dumps(diff, indent=2))


if __name__ == "__main__":
    main()
