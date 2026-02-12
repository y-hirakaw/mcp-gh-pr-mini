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
    parser = argparse.ArgumentParser(description="Request reviewers for a GitHub pull request")
    parser.add_argument("--owner", required=True, help="Repository owner (username or organization)")
    parser.add_argument("--repo", required=True, help="Repository name")
    parser.add_argument("--pr-number", required=True, type=int, help="Pull request number")
    parser.add_argument("--reviewers", required=True, help="Comma-separated list of GitHub usernames")
    args = parser.parse_args()

    reviewers_list = [r.strip() for r in args.reviewers.split(",") if r.strip()]

    if not reviewers_list:
        print("Error: No valid reviewers provided", file=sys.stderr)
        sys.exit(1)

    endpoint = f"/repos/{args.owner}/{args.repo}/pulls/{args.pr_number}/requested_reviewers"
    input_data = {"reviewers": reviewers_list}

    response = run_gh_api(endpoint, method="POST", input_data=input_data)

    requested = response.get("requested_reviewers", [])
    requested_names = [r.get("login", "unknown") for r in requested]

    print(f"Reviewers requested for {args.owner}/{args.repo}#{args.pr_number}:")
    for name in requested_names:
        print(f"  - {name}")
    if not requested_names:
        print(f"  Requested: {', '.join(reviewers_list)}")
        print("  (reviewers may already be assigned or may not have appeared in the response)")


if __name__ == "__main__":
    main()
