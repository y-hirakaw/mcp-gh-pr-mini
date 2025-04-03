#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const GITHUB_API_BASE = "https://api.github.com";
const USER_AGENT = "mcp-gh-pr-mini/1.0";
// Create server instance
const server = new McpServer({
    name: "mcp-gh-pr-mini",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Helper functions for parsing response and creating errors
async function parseResponseBody(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return await response.json();
    }
    else {
        return await response.text();
    }
}
function createGitHubError(status, responseBody) {
    const message = typeof responseBody === "string"
        ? responseBody
        : JSON.stringify(responseBody);
    const error = new Error(`GitHub API error! Status: ${status}, Message: ${message}`);
    return error;
}
// Helper function for making GitHub API requests
async function githubRequest(url, options = {}) {
    const headers = {
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        "X-GitHub-Api-Version": "2022-11-28",
        ...options.headers,
    };
    if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
    }
    else {
        throw new Error("GitHub Personal Access Token not found in environment variables. Please set GITHUB_PERSONAL_ACCESS_TOKEN.");
    }
    const response = await fetch(url, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const responseBody = await parseResponseBody(response);
    if (!response.ok) {
        throw createGitHubError(response.status, responseBody);
    }
    return responseBody;
}
// Register GitHub tools
server.tool("create_pull_request", "Create a new pull request in a GitHub repository（GitHubリポジトリで新しいプルリクエストを作成する）", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    title: z.string().describe("Pull request title"),
    body: z.string().describe("Pull request description"),
    head: z.string().describe("Name of the branch where your changes are implemented"),
    base: z.string().describe("Name of the branch you want the changes pulled into")
}, async ({ owner, repo, title, body, head, base }) => {
    try {
        const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`;
        const prData = await githubRequest(url, {
            method: "POST",
            body: {
                title,
                body,
                head,
                base
            }
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Pull request created successfully!\n\nPR #${prData.number}: ${prData.title}\nURL: ${prData.html_url}`,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error creating pull request:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to create pull request: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
server.tool("list_open_pull_requests", "List open pull requests in a GitHub repository（GitHubリポジトリ内の未クローズのプルリクエストを一覧表示する）", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    limit: z.number().optional().describe("Maximum number of PRs to return (default: 10)")
}, async ({ owner, repo, limit = 10 }) => {
    try {
        const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=open&per_page=${limit}`;
        const pullRequests = await githubRequest(url);
        if (pullRequests.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No open pull requests found in ${owner}/${repo}`,
                    },
                ],
            };
        }
        const formattedPRs = pullRequests.map(pr => [
            `#${pr.number}: ${pr.title}`,
            `Created by: ${pr.user.login} on ${new Date(pr.created_at).toLocaleString()}`,
            `${pr.head.label} → ${pr.base.label}`,
            `${pr.requested_reviewers?.length || 0} reviewers requested`,
            `URL: ${pr.html_url}`,
            "---",
        ].join("\n"));
        return {
            content: [
                {
                    type: "text",
                    text: `Open Pull Requests in ${owner}/${repo}:\n\n${formattedPRs.join("\n")}`,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error listing pull requests:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to list pull requests: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
server.tool("get_pull_request_diff", "Get the diff for a GitHub pull request（GitHubのプルリクエストの差分を取得する）", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pr_number: z.number().describe("Pull request number")
}, async ({ owner, repo, pr_number }) => {
    try {
        const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pr_number}`;
        // 特別なヘッダーを使用してdiff形式のレスポンスを要求
        const options = {
            headers: {
                "Accept": "application/vnd.github.v3.diff"
            }
        };
        // このエンドポイントはDiff形式のテキストを返すので、githubRequestではなく直接fetchを使用
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/vnd.github.v3.diff",
                "User-Agent": USER_AGENT,
                "Authorization": `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`
            }
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw createGitHubError(response.status, errorBody);
        }
        const diffText = await response.text();
        if (!diffText || diffText.trim() === "") {
            return {
                content: [
                    {
                        type: "text",
                        text: `No changes found in PR #${pr_number}`,
                    },
                ],
            };
        }
        // PRのメタデータも取得
        const prUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pr_number}`;
        const prData = await githubRequest(prUrl);
        return {
            content: [
                {
                    type: "text",
                    text: `Diff for PR #${pr_number}: ${prData.title}\n\n\`\`\`diff\n${diffText}\n\`\`\``,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error fetching pull request diff:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to get pull request diff: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
server.tool("request_reviewers", "Request reviewers for a GitHub pull request（GitHubのプルリクエストにレビュー担当者をリクエストする）", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pr_number: z.number().describe("Pull request number"),
    reviewers: z.array(z.string()).describe("GitHub usernames of requested reviewers")
}, async ({ owner, repo, pr_number, reviewers }) => {
    try {
        if (!reviewers || reviewers.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: "No reviewers specified. Please provide at least one reviewer username.",
                    },
                ],
            };
        }
        const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pr_number}/requested_reviewers`;
        await githubRequest(url, {
            method: "POST",
            body: {
                reviewers,
            }
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Successfully requested ${reviewers.length} reviewer${reviewers.length > 1 ? 's' : ''} for PR #${pr_number}: ${reviewers.join(', ')}`,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error requesting reviewers:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to request reviewers: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
server.tool("add_pr_comment", "Add a comment to a GitHub pull request（GitHubのプルリクエストにコメントを追加する）", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pr_number: z.number().describe("Pull request number"),
    body: z.string().describe("Comment content")
}, async ({ owner, repo, pr_number, body }) => {
    try {
        const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${pr_number}/comments`;
        const commentData = await githubRequest(url, {
            method: "POST",
            body: { body }
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Comment added successfully to PR #${pr_number}\nComment URL: ${commentData.html_url}`,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error adding comment to PR:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to add comment to pull request: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
server.tool("get_pr_comments", "Get comments from a GitHub pull request（GitHubのプルリクエストのコメントを取得する）", {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pr_number: z.number().describe("Pull request number")
}, async ({ owner, repo, pr_number }) => {
    try {
        // 通常のIssueコメントを取得（PRの会話タブ）
        const issueCommentsUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${pr_number}/comments`;
        const issueComments = await githubRequest(issueCommentsUrl);
        // コードレビューコメントを取得（ファイルの特定行に付けられたコメント）
        const reviewCommentsUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pr_number}/comments`;
        const reviewComments = await githubRequest(reviewCommentsUrl);
        if (issueComments.length === 0 && reviewComments.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No comments found for PR #${pr_number}`,
                    },
                ],
            };
        }
        let formattedContent = `Comments for PR #${pr_number}:\n\n`;
        // 通常のコメント（会話）のフォーマット
        if (issueComments.length > 0) {
            formattedContent += "## Conversation Comments\n\n";
            const formattedIssueComments = issueComments.map(comment => [
                `Comment by: ${comment.user.login}`,
                `Date: ${new Date(comment.created_at).toLocaleString()}`,
                `${comment.body}`,
                `URL: ${comment.html_url}`,
                "---",
            ].join("\n"));
            formattedContent += formattedIssueComments.join("\n") + "\n\n";
        }
        // レビューコメント（コードに紐づくもの）のフォーマット
        if (reviewComments.length > 0) {
            formattedContent += "## Code Review Comments\n\n";
            const formattedReviewComments = reviewComments.map(comment => [
                `Comment by: ${comment.user.login}`,
                `Date: ${new Date(comment.created_at).toLocaleString()}`,
                `File: ${comment.path}${comment.position ? ` (line ${comment.position})` : ''}`,
                `${comment.body}`,
                `URL: ${comment.html_url}`,
                "---",
            ].join("\n"));
            formattedContent += formattedReviewComments.join("\n");
        }
        return {
            content: [
                {
                    type: "text",
                    text: formattedContent,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error retrieving PR comments:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to retrieve pull request comments: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("GitHub MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
