#!/usr/bin/env python3
"""List open pull requests in a GitHub repository via the gh CLI."""
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


def format_date(iso_date):
    """Format ISO date string to a readable format."""
    if not iso_date:
        return "N/A"
    return iso_date.replace("T", " ").replace("Z", " UTC")


def main():
    parser = argparse.ArgumentParser(
        description="List open pull requests in a GitHub repository"
    )
    parser.add_argument("--owner", required=True, help="Repository owner")
    parser.add_argument("--repo", required=True, help="Repository name")
    parser.add_argument(
        "--limit",
        type=int,
        default=10,
        help="Maximum number of PRs to return (default: 10)",
    )
    args = parser.parse_args()

    endpoint = f"/repos/{args.owner}/{args.repo}/pulls?state=open&per_page={args.limit}"
    response = run_gh_api(endpoint)

    if isinstance(response, list):
        if not response:
            print(f"No open pull requests found in {args.owner}/{args.repo}.")
            return

        print(f"Open pull requests in {args.owner}/{args.repo} ({len(response)} found):")
        print("-" * 80)

        for pr in response:
            number = pr.get("number", "N/A")
            title = pr.get("title", "N/A")
            user = pr.get("user", {}).get("login", "N/A")
            created = format_date(pr.get("created_at"))
            head = pr.get("head", {}).get("ref", "N/A")
            base = pr.get("base", {}).get("ref", "N/A")
            url = pr.get("html_url", "N/A")
            draft = pr.get("draft", False)

            draft_label = " [DRAFT]" if draft else ""
            print(f"  #{number}{draft_label} {title}")
            print(f"    Author  : {user}")
            print(f"    Created : {created}")
            print(f"    Branch  : {head} -> {base}")
            print(f"    URL     : {url}")
            print()
    else:
        print(f"Unexpected response format: {response}")


if __name__ == "__main__":
    main()
