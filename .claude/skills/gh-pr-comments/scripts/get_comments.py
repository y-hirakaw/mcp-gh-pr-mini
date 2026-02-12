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
        return None


def main():
    parser = argparse.ArgumentParser(description="Get all comments from a GitHub pull request")
    parser.add_argument("--owner", required=True, help="Repository owner (username or organization)")
    parser.add_argument("--repo", required=True, help="Repository name")
    parser.add_argument("--pr-number", required=True, help="Pull request number")
    args = parser.parse_args()

    output_parts = []

    # Fetch conversation comments (issues endpoint)
    conversation_comments = run_gh_api(
        f"/repos/{args.owner}/{args.repo}/issues/{args.pr_number}/comments"
    )

    output_parts.append("## Conversation Comments")
    output_parts.append("")

    if conversation_comments and isinstance(conversation_comments, list) and len(conversation_comments) > 0:
        for comment in conversation_comments:
            user = comment.get("user", {}).get("login", "unknown")
            created_at = comment.get("created_at", "unknown")
            body = comment.get("body", "")
            html_url = comment.get("html_url", "")
            output_parts.append(f"### Comment by {user} ({created_at})")
            output_parts.append(body)
            output_parts.append(f"URL: {html_url}")
            output_parts.append("")
            output_parts.append("---")
            output_parts.append("")
    elif conversation_comments is None:
        output_parts.append("Error fetching conversation comments.")
        output_parts.append("")
    else:
        output_parts.append("No conversation comments found.")
        output_parts.append("")

    # Fetch review comments (pulls endpoint)
    review_comments = run_gh_api(
        f"/repos/{args.owner}/{args.repo}/pulls/{args.pr_number}/comments"
    )

    output_parts.append("## Code Review Comments")
    output_parts.append("")

    if review_comments and isinstance(review_comments, list) and len(review_comments) > 0:
        for comment in review_comments:
            user = comment.get("user", {}).get("login", "unknown")
            path = comment.get("path", "unknown")
            position = comment.get("position", "N/A")
            body = comment.get("body", "")
            html_url = comment.get("html_url", "")
            output_parts.append(f"### Comment by {user} on {path} (position: {position})")
            output_parts.append(body)
            output_parts.append(f"URL: {html_url}")
            output_parts.append("")
            output_parts.append("---")
            output_parts.append("")
    elif review_comments is None:
        output_parts.append("Error fetching review comments.")
        output_parts.append("")
    else:
        output_parts.append("No code review comments found.")
        output_parts.append("")

    print("\n".join(output_parts))


if __name__ == "__main__":
    main()
