#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 新しい認証・API・ツールシステムのインポート
import { githubAuth } from './auth/github-auth.js';
import { prTools } from './tools/pr-tools.js';
import { commentTools } from './tools/comment-tools.js';
import { logger } from './utils/logger.js';

// Create server instance
const server = new McpServer({
  name: "mcp-gh-pr-mini",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Initialize GitHub authentication on server startup
async function initializeAuth() {
  try {
    await githubAuth.initialize();
    const config = githubAuth.getConfig();
    const user = await githubAuth.getUserInfo();
    logger.info(`GitHub authentication initialized using ${config.method.toUpperCase()} for user: ${user.login}`);
  } catch (error) {
    logger.error('Failed to initialize GitHub authentication:', error);
    throw error;
  }
}

// Register MCP Tools
server.tool(
  "create_pull_request",
  "Create a new pull request in a GitHub repository（GitHubリポジトリで新しいプルリクエストを作成する）",
  {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    title: z.string().describe("Pull request title"),
    body: z.string().describe("Pull request description"),
    head: z.string().describe("Name of the branch where your changes are implemented"),
    base: z.string().describe("Name of the branch you want the changes pulled into")
  },
  async (params) => {
    return await prTools.createPullRequest(params);
  }
);

server.tool(
  "list_open_pull_requests",
  "List open pull requests in a GitHub repository（GitHubリポジトリ内の未クローズのプルリクエストを一覧表示する）",
  {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    limit: z.number().optional().describe("Maximum number of PRs to return (default: 10)")
  },
  async (params) => {
    return await prTools.listOpenPullRequests(params);
  }
);

server.tool(
  "get_pull_request_diff",
  "Get the diff for a GitHub pull request（GitHubのプルリクエストの差分を取得する）",
  {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pr_number: z.number().describe("Pull request number")
  },
  async (params) => {
    return await prTools.getPullRequestDiff(params);
  }
);

server.tool(
  "request_reviewers",
  "Request reviewers for a GitHub pull request（GitHubのプルリクエストにレビュー担当者をリクエストする）",
  {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pr_number: z.number().describe("Pull request number"),
    reviewers: z.array(z.string()).describe("GitHub usernames of requested reviewers")
  },
  async (params) => {
    return await prTools.requestReviewers(params);
  }
);

server.tool(
  "add_pr_comment",
  "Add a comment to a GitHub pull request（GitHubのプルリクエストにコメントを追加する）",
  {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pr_number: z.number().describe("Pull request number"),
    body: z.string().describe("Comment content")
  },
  async (params) => {
    return await commentTools.addComment(params);
  }
);

server.tool(
  "add_review_comment",
  "Add a review comment to a specific line in a GitHub pull request（GitHubのプルリクエストの特定の行にレビューコメントを追加する）",
  {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pr_number: z.number().describe("Pull request number"),
    body: z.string().describe("Comment content"),
    path: z.string().describe("The relative path to the file to comment on"),
    position: z.number().describe("The position in the diff where you want to add a comment")
  },
  async (params) => {
    return await commentTools.addReviewComment(params);
  }
);

server.tool(
  "get_pr_comments",
  "Get comments from a GitHub pull request（GitHubのプルリクエストのコメントを取得する）",
  {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pr_number: z.number().describe("Pull request number")
  },
  async (params) => {
    return await commentTools.getComments(params);
  }
);

server.tool(
  "get_pr_changes_for_commenting",
  "Get file changes from a GitHub pull request with positions for commenting（GitHubのプルリクエストのファイル変更とコメント可能な位置を取得する）",
  {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pr_number: z.number().describe("Pull request number")
  },
  async (params) => {
    return await prTools.getChangesForCommenting(params);
  }
);

async function main() {
  try {
    // Initialize authentication before starting the server
    await initializeAuth();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    logger.info("GitHub MCP Server running on stdio with dual authentication support (PAT + GitHub CLI)");
  } catch (error) {
    logger.error("Fatal error in main():", error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

main().catch((error) => {
  logger.error("Fatal error in main():", error);
  process.exit(1);
});