#!/usr/bin/env python3
"""Create a new GitHub pull request via the gh CLI."""
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
    parser = argparse.ArgumentParser(description="Create a new GitHub pull request")
    parser.add_argument("--owner", required=True, help="Repository owner")
    parser.add_argument("--repo", required=True, help="Repository name")
    parser.add_argument("--title", required=True, help="Pull request title")
    parser.add_argument("--body", required=True, help="Pull request description")
    parser.add_argument("--head", required=True, help="Branch with changes")
    parser.add_argument("--base", required=True, help="Branch to merge into")
    parser.add_argument(
        "--draft", action="store_true", default=False, help="Create as draft PR"
    )
    args = parser.parse_args()

    endpoint = f"/repos/{args.owner}/{args.repo}/pulls"
    payload = {
        "title": args.title,
        "body": args.body,
        "head": args.head,
        "base": args.base,
        "draft": args.draft,
    }

    response = run_gh_api(endpoint, method="POST", input_data=payload)

    if isinstance(response, dict):
        pr_number = response.get("number", "N/A")
        pr_title = response.get("title", "N/A")
        pr_url = response.get("html_url", "N/A")
        pr_draft = response.get("draft", False)
        pr_state = response.get("state", "N/A")

        print(f"Pull Request created successfully!")
        print(f"  Number : #{pr_number}")
        print(f"  Title  : {pr_title}")
        print(f"  URL    : {pr_url}")
        print(f"  State  : {pr_state}")
        print(f"  Draft  : {'Yes' if pr_draft else 'No'}")
    else:
        print(f"Response: {response}")


if __name__ == "__main__":
    main()
