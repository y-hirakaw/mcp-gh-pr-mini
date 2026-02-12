#!/usr/bin/env python3
"""Update an existing GitHub pull request via the gh CLI."""
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
    parser = argparse.ArgumentParser(
        description="Update an existing GitHub pull request"
    )
    parser.add_argument("--owner", required=True, help="Repository owner")
    parser.add_argument("--repo", required=True, help="Repository name")
    parser.add_argument(
        "--pr-number", required=True, type=int, help="Pull request number"
    )
    parser.add_argument("--title", default=None, help="New PR title")
    parser.add_argument("--body", default=None, help="New PR description")
    parser.add_argument(
        "--state", default=None, choices=["open", "closed"], help="New PR state"
    )
    parser.add_argument("--base", default=None, help="New base branch")
    args = parser.parse_args()

    # Build payload with only provided fields
    payload = {}
    if args.title is not None:
        payload["title"] = args.title
    if args.body is not None:
        payload["body"] = args.body
    if args.state is not None:
        payload["state"] = args.state
    if args.base is not None:
        payload["base"] = args.base

    if not payload:
        print(
            "Error: At least one update field (--title, --body, --state, --base) must be provided.",
            file=sys.stderr,
        )
        sys.exit(1)

    endpoint = f"/repos/{args.owner}/{args.repo}/pulls/{args.pr_number}"
    response = run_gh_api(endpoint, method="PATCH", input_data=payload)

    if isinstance(response, dict):
        pr_number = response.get("number", "N/A")
        pr_title = response.get("title", "N/A")
        pr_url = response.get("html_url", "N/A")
        pr_state = response.get("state", "N/A")
        pr_draft = response.get("draft", False)

        print(f"Pull Request updated successfully!")
        print(f"  Number : #{pr_number}")
        print(f"  Title  : {pr_title}")
        print(f"  URL    : {pr_url}")
        print(f"  State  : {pr_state}")
        print(f"  Draft  : {'Yes' if pr_draft else 'No'}")
        print(f"  Updated: {', '.join(payload.keys())}")
    else:
        print(f"Response: {response}")


if __name__ == "__main__":
    main()
