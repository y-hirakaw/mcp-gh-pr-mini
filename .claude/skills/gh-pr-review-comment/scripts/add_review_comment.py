#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys


def run_gh_api(endpoint, method="GET", input_data=None, headers=None, hint_on_422=None):
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
        stderr = e.stderr.strip()
        print(f"Error: {stderr}", file=sys.stderr)
        if hint_on_422 and "HTTP 422" in stderr:
            print(f"Hint: {hint_on_422}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Add a review comment to a specific line in a GitHub pull request")
    parser.add_argument("--owner", required=True, help="Repository owner (username or organization)")
    parser.add_argument("--repo", required=True, help="Repository name")
    parser.add_argument("--pr-number", required=True, type=int, help="Pull request number")
    parser.add_argument("--body", required=True, help="Comment content")
    parser.add_argument("--path", required=True, help="Relative path to the file to comment on")
    parser.add_argument("--line", type=int, help="File line number to comment on (preferred over --position)")
    parser.add_argument("--side", choices=["LEFT", "RIGHT"], default="RIGHT", help="Which side of the diff --line refers to (default: RIGHT)")
    parser.add_argument("--start-line", type=int, help="First line of a multi-line comment range (used together with --line as the last line)")
    parser.add_argument("--start-side", choices=["LEFT", "RIGHT"], help="Which side of the diff --start-line refers to (default: same as --side)")
    parser.add_argument("--subject-type", choices=["line", "file"], help="Set to 'file' for a file-level comment (omits line/position)")
    parser.add_argument("--position", type=int, help="[Deprecated] Position in the diff where the comment should be placed. Prefer --line instead.")
    args = parser.parse_args()

    is_file_level = args.subject_type == "file"
    if not is_file_level:
        if args.line is not None and args.position is not None:
            parser.error("--line and --position are mutually exclusive - specify only one.")
        if args.line is None and args.position is None:
            parser.error("Either --line or --position must be provided (or use --subject-type file for a file-level comment).")

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
    }

    if is_file_level:
        input_data["subject_type"] = "file"
        location_description = "file-level comment"
    elif args.line is not None:
        input_data["line"] = args.line
        input_data["side"] = args.side
        if args.start_line is not None:
            input_data["start_line"] = args.start_line
            input_data["start_side"] = args.start_side or args.side
            location_description = f"lines {args.start_line}-{args.line} ({args.side})"
        else:
            location_description = f"line {args.line} ({args.side})"
    else:
        input_data["position"] = args.position
        location_description = f"position {args.position}"

    hint = None
    if not is_file_level:
        hint = 'the specified line/position is likely outside the diff hunk range. Retry with --subject-type file for a file-level comment instead.'
    response = run_gh_api(comment_endpoint, method="POST", input_data=input_data, hint_on_422=hint)

    comment_url = response.get("html_url", "N/A")
    comment_id = response.get("id", "N/A")

    print(f"Review comment added to {args.owner}/{args.repo}#{args.pr_number}")
    print(f"  File: {args.path} ({location_description})")
    print(f"  Comment ID: {comment_id}")
    print(f"  URL: {comment_url}")


if __name__ == "__main__":
    main()
